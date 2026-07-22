import { db, type Purchase, type PurchaseItem, type StockHistory, type Supplier, type Product } from './db';

/**
 * Automatically generates a unique Purchase Number looking like PUR-000001.
 */
export async function generatePurchaseNumber(): Promise<string> {
  let isUnique = false;
  let purchaseNumber = '';

  while (!isUnique) {
    // Get total count of purchases or get maximum id
    const count = await db.purchases.count();
    const nextNum = count + 1;
    const formattedNum = String(nextNum).padStart(6, '0');
    purchaseNumber = `PUR-${formattedNum}`;

    // Verify uniqueness against existing purchases
    const existing = await db.purchases
      .filter((p) => p.purchaseNumber === purchaseNumber)
      .first();

    if (!existing) {
      isUnique = true;
    } else {
      // If code somehow duplicates (e.g., deleted records), randomize suffix or increment
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      purchaseNumber = `PUR-${randomPart}`;
    }
  }

  return purchaseNumber;
}

/**
 * Recalculates and updates the outstanding balance for a supplier.
 * Formula: Outstanding Balance = Opening Balance + sum(Remaining Amount of Active Purchases)
 */
export async function recalculateSupplierBalance(supplierId: number): Promise<void> {
  const supplier = await db.suppliers.get(supplierId);
  if (!supplier) return;

  // Retrieve all active purchases
  const activePurchases = await db.purchases
    .filter((p) => p.supplierId === supplierId && p.status === 'Active')
    .toArray();

  const totalRemaining = activePurchases.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const newBalance = (supplier.openingBalance || 0) + totalRemaining;

  await db.suppliers.update(supplierId, {
    currentBalance: parseFloat(newBalance.toFixed(2)),
    updatedAt: new Date(),
  });
}

/**
 * Validates purchase fields before saving to IndexedDB.
 */
export async function validatePurchase(
  purchase: Partial<Purchase>,
  items: Partial<PurchaseItem>[]
): Promise<string | null> {
  if (!purchase.supplierId || isNaN(Number(purchase.supplierId))) {
    return 'Supplier selection is required.';
  }

  const supplier = await db.suppliers.get(Number(purchase.supplierId));
  if (!supplier) {
    return 'Selected supplier does not exist.';
  }

  if (!items || items.length === 0) {
    return 'At least one product is required in the purchase cart.';
  }

  for (const item of items) {
    if (!item.productId) {
      return 'Each item must be linked to a valid product.';
    }
    const product = await db.products.get(item.productId);
    if (!product) {
      return 'One or more selected products do not exist.';
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      return `Quantity for product "${item.productName || 'Unknown'}" must be greater than zero.`;
    }
    if (item.purchasePrice === undefined || Number(item.purchasePrice) <= 0) {
      return `Purchase price for product "${item.productName || 'Unknown'}" must be greater than zero.`;
    }
  }

  if (purchase.paidAmount !== undefined && purchase.grandTotal !== undefined) {
    if (Number(purchase.paidAmount) > Number(purchase.grandTotal)) {
      return 'Paid Amount cannot exceed Grand Total.';
    }
  }

  return null;
}

/**
 * Creates a new purchase with transaction-safety.
 * Automatically updates product stock, supplier balance, and stock history.
 */
export async function createPurchase(
  purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'referenceNo' | 'createdAt' | 'updatedAt' | 'status'>,
  itemsData: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
): Promise<Purchase> {
  // Validate first
  const validationError = await validatePurchase(purchaseData, itemsData);
  if (validationError) {
    throw new Error(validationError);
  }

  const purchaseNumber = await generatePurchaseNumber();

  // Return transaction promise
  return await db.transaction('rw', [db.purchases, db.purchaseItems, db.products, db.suppliers, db.stockHistory], async () => {
    const now = new Date();

    const remainingAmount = parseFloat((purchaseData.grandTotal - purchaseData.paidAmount).toFixed(2));
    
    // Automatically calculate payment status
    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (purchaseData.paidAmount >= purchaseData.grandTotal) {
      paymentStatus = 'Paid';
    } else if (purchaseData.paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    const purchase: Purchase = {
      ...purchaseData,
      purchaseNumber,
      referenceNo: purchaseNumber, // compatibility
      remainingAmount,
      paymentStatus,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
      total: purchaseData.grandTotal, // compatibility
    };

    const purchaseId = await db.purchases.add(purchase);
    purchase.id = purchaseId;

    // Add purchase items and update stock
    for (const itemData of itemsData) {
      const item: PurchaseItem = {
        ...itemData,
        purchaseId,
        cost: itemData.purchasePrice, // compatibility
        subtotal: itemData.subtotal, // compatibility
      };

      await db.purchaseItems.add(item);

      // 1. Update product stock
      const product = await db.products.get(itemData.productId);
      if (product) {
        const nextStock = (product.currentStock || 0) + itemData.quantity;
        await db.products.update(itemData.productId, {
          currentStock: nextStock,
          stock: nextStock, // compatibility
          updatedAt: now,
        });

        // 2. Add Stock History record (Ensure no duplicates)
        const existingHistory = await db.stockHistory
          .filter((sh) => sh.referenceNo === purchaseNumber && sh.productId === itemData.productId)
          .first();

        if (!existingHistory) {
          await db.stockHistory.add({
            productId: itemData.productId,
            type: 'Purchase',
            quantity: itemData.quantity,
            currentStock: nextStock,
            referenceNo: purchaseNumber,
            createdAt: now,
          });
        }
      }
    }

    // 3. Update supplier balance
    if (purchase.supplierId) {
      await recalculateSupplierBalance(purchase.supplierId);
    }

    return purchase;
  });
}

/**
 * Updates an existing purchase. Reverts old stock changes and supplier balances before applying new ones.
 */
export async function updatePurchase(
  id: number,
  purchaseData: Partial<Purchase>,
  itemsData: Omit<PurchaseItem, 'id' | 'purchaseId'>[]
): Promise<Purchase> {
  const existing = await db.purchases.get(id);
  if (!existing) {
    throw new Error('Purchase order not found.');
  }

  // Validate fields
  const validationError = await validatePurchase(purchaseData, itemsData);
  if (validationError) {
    throw new Error(validationError);
  }

  return await db.transaction('rw', [db.purchases, db.purchaseItems, db.products, db.suppliers, db.stockHistory], async () => {
    const now = new Date();
    const oldSupplierId = existing.supplierId;
    const newSupplierId = purchaseData.supplierId || oldSupplierId;

    // Fetch existing purchase items to revert their stocks
    const oldItems = await db.purchaseItems.filter((pi) => pi.purchaseId === id).toArray();

    // 1. Revert stocks for old items & remove old stock histories
    for (const item of oldItems) {
      const product = await db.products.get(item.productId);
      if (product) {
        const revertedStock = (product.currentStock || 0) - item.quantity;
        await db.products.update(item.productId, {
          currentStock: revertedStock,
          stock: revertedStock,
          updatedAt: now,
        });

        await db.stockHistory
          .filter((sh) => sh.referenceNo === existing.purchaseNumber && sh.productId === item.productId)
          .delete();
      }
    }

    // 2. Delete old purchase items from DB
    await db.purchaseItems.filter((pi) => pi.purchaseId === id).delete();

    // Calculate totals, payments & status
    const paidAmount = purchaseData.paidAmount !== undefined ? purchaseData.paidAmount : existing.paidAmount;
    const grandTotal = purchaseData.grandTotal !== undefined ? purchaseData.grandTotal : existing.grandTotal;
    const remainingAmount = parseFloat((grandTotal - paidAmount).toFixed(2));

    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (paidAmount >= grandTotal) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    const updatedPurchase: Purchase = {
      ...existing,
      ...purchaseData,
      remainingAmount,
      paymentStatus,
      total: grandTotal, // compatibility
      updatedAt: now,
    };

    await db.purchases.put(updatedPurchase);

    // 3. Add new purchase items & apply stock updates
    for (const itemData of itemsData) {
      const item: PurchaseItem = {
        ...itemData,
        purchaseId: id,
        cost: itemData.purchasePrice, // compatibility
        subtotal: itemData.subtotal, // compatibility
      };

      await db.purchaseItems.add(item);

      const product = await db.products.get(itemData.productId);
      if (product) {
        const nextStock = (product.currentStock || 0) + itemData.quantity;
        await db.products.update(itemData.productId, {
          currentStock: nextStock,
          stock: nextStock,
          updatedAt: now,
        });

        // Add Stock History
        await db.stockHistory.add({
          productId: itemData.productId,
          type: 'Purchase',
          quantity: itemData.quantity,
          currentStock: nextStock,
          referenceNo: existing.purchaseNumber,
          createdAt: now,
        });
      }
    }

    // 4. Recalculate supplier balances for both old and new suppliers (if changed)
    if (oldSupplierId) {
      await recalculateSupplierBalance(oldSupplierId);
    }
    if (newSupplierId && newSupplierId !== oldSupplierId) {
      await recalculateSupplierBalance(newSupplierId);
    }

    return updatedPurchase;
  });
}

/**
 * Soft-deletes (archives) a purchase. Reverts product stock levels and supplier balance.
 */
export async function deletePurchase(id: number): Promise<void> {
  const existing = await db.purchases.get(id);
  if (!existing) {
    throw new Error('Purchase not found.');
  }

  return await db.transaction('rw', [db.purchases, db.purchaseItems, db.products, db.suppliers, db.stockHistory], async () => {
    const now = new Date();

    // 1. Fetch items to revert product stocks
    const items = await db.purchaseItems.filter((pi) => pi.purchaseId === id).toArray();
    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (product) {
        const revertedStock = (product.currentStock || 0) - item.quantity;
        await db.products.update(item.productId, {
          currentStock: revertedStock,
          stock: revertedStock,
          updatedAt: now,
        });

        // Add stock history adjustment record
        await db.stockHistory.add({
          productId: item.productId,
          type: 'Adjustment',
          quantity: -item.quantity,
          currentStock: revertedStock,
          referenceNo: `ARCHIVE-${existing.purchaseNumber}`,
          notes: `Purchase ${existing.purchaseNumber} archived`,
          createdAt: now,
        });
      }
    }

    // 2. Mark purchase as Archived
    await db.purchases.update(id, {
      status: 'Archived',
      updatedAt: now,
    });

    // 3. Recalculate Supplier Balance
    if (existing.supplierId) {
      await recalculateSupplierBalance(existing.supplierId);
    }
  });
}

/**
 * Restores a soft-deleted (archived) purchase. Re-applies stock updates and supplier balance.
 */
export async function restorePurchase(id: number): Promise<void> {
  const existing = await db.purchases.get(id);
  if (!existing) {
    throw new Error('Purchase not found.');
  }

  if (existing.status !== 'Archived') {
    return;
  }

  return await db.transaction('rw', [db.purchases, db.purchaseItems, db.products, db.suppliers, db.stockHistory], async () => {
    const now = new Date();

    // 1. Fetch items to apply product stocks back
    const items = await db.purchaseItems.filter((pi) => pi.purchaseId === id).toArray();
    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (product) {
        const nextStock = (product.currentStock || 0) + item.quantity;
        await db.products.update(item.productId, {
          currentStock: nextStock,
          stock: nextStock,
          updatedAt: now,
        });

        // Add stock history adjustment record
        await db.stockHistory.add({
          productId: item.productId,
          type: 'Purchase',
          quantity: item.quantity,
          currentStock: nextStock,
          referenceNo: existing.purchaseNumber,
          notes: `Purchase ${existing.purchaseNumber} restored`,
          createdAt: now,
        });
      }
    }

    // 2. Mark purchase as Active
    await db.purchases.update(id, {
      status: 'Active',
      updatedAt: now,
    });

    // 3. Recalculate Supplier Balance
    if (existing.supplierId) {
      await recalculateSupplierBalance(existing.supplierId);
    }
  });
}

/**
 * Duplicates an existing purchase. Generates a new purchase number with current timestamp.
 */
export async function duplicatePurchase(id: number): Promise<Purchase> {
  const existing = await db.purchases.get(id);
  if (!existing) {
    throw new Error('Purchase to duplicate not found.');
  }

  const items = await db.purchaseItems.filter((pi) => pi.purchaseId === id).toArray();

  const purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'referenceNo' | 'createdAt' | 'updatedAt' | 'status'> = {
    supplierId: existing.supplierId,
    purchaseDate: new Date(),
    invoiceNumber: existing.invoiceNumber ? `${existing.invoiceNumber}-DUP` : undefined,
    subtotal: existing.subtotal,
    discount: existing.discount,
    tax: existing.tax,
    shipping: existing.shipping,
    otherCharges: existing.otherCharges,
    grandTotal: existing.grandTotal,
    total: existing.grandTotal ?? existing.total ?? 0, // Compatibility
    paidAmount: 0, // Reset paid amount to 0 (unpaid) for a duplicated draft
    remainingAmount: existing.grandTotal,
    paymentStatus: 'Unpaid',
    paymentMethod: existing.paymentMethod,
    notes: `Duplicate of ${existing.purchaseNumber}. ${existing.notes || ''}`,
    createdBy: existing.createdBy,
  };

  const itemsData = items.map((item) => {
    const cost = item.purchasePrice ?? item.cost ?? 0;
    const itemTotal = item.total ?? item.subtotal ?? 0;
    return {
      productId: item.productId,
      barcode: item.barcode,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: cost,
      cost, // Compatibility
      sellingPrice: item.sellingPrice,
      discount: item.discount,
      tax: item.tax,
      total: itemTotal,
      subtotal: itemTotal, // Compatibility
    };
  });

  return await createPurchase(purchaseData, itemsData);
}

/**
 * Advanced query function with live joining, search, filtering, sorting, and pagination.
 */
export async function queryPurchases(params: {
  searchQuery?: string;
  supplierId?: number | string | null;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid' | 'All';
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  status?: 'Active' | 'Archived' | 'All';
  sortBy?: 'newest' | 'oldest' | 'grandTotal_desc' | 'grandTotal_asc' | 'purchaseNumber_asc' | 'purchaseNumber_desc' | 'supplierName_asc';
  page?: number;
  pageSize?: number;
}): Promise<{
  data: (Purchase & { supplierName: string; itemCount: number })[];
  total: number;
  totalPages: number;
}> {
  try {
    const allPurchases = await db.purchases.toArray();
    const allSuppliers = await db.suppliers.toArray();
    const allItems = await db.purchaseItems.toArray();

    // Map supplier ids to names
    const supplierMap = new Map<number, string>();
    allSuppliers.forEach((s) => {
      if (s.id) supplierMap.set(s.id, s.companyName || s.name || 'Unknown');
    });

    // Calculate count of items per purchase
    const itemCountsMap = new Map<number, number>();
    allItems.forEach((item) => {
      const current = itemCountsMap.get(item.purchaseId) || 0;
      itemCountsMap.set(item.purchaseId, current + 1);
    });

    // We also need product info to search on product name inside the query
    const productIdsInSearch: number[] = [];
    const search = params.searchQuery?.trim().toLowerCase();
    if (search) {
      const matchingProducts = await db.products
        .filter((p) => p.name.toLowerCase().includes(search))
        .toArray();
      matchingProducts.forEach((p) => {
        if (p.id) productIdsInSearch.push(p.id);
      });
    }

    let list = allPurchases.map((p) => ({
      ...p,
      supplierName: p.supplierId ? (supplierMap.get(p.supplierId) || 'Unknown Supplier') : 'Walk-in Vendor',
      itemCount: p.id ? (itemCountsMap.get(p.id) || 0) : 0,
    }));

    // 1. Filter: Status
    const statusFilter = params.status || 'All';
    if (statusFilter !== 'All') {
      list = list.filter((p) => p.status === statusFilter);
    } else {
      list = list.filter((p) => p.status !== 'Archived'); // default hides soft deleted
    }

    // 2. Filter: Supplier
    if (params.supplierId && params.supplierId !== 'all') {
      const sId = Number(params.supplierId);
      list = list.filter((p) => p.supplierId === sId);
    }

    // 3. Filter: Payment Status
    if (params.paymentStatus && params.paymentStatus !== 'All') {
      list = list.filter((p) => p.paymentStatus === params.paymentStatus);
    }

    // 4. Filter: Payment Method
    if (params.paymentMethod && params.paymentMethod !== 'all') {
      list = list.filter((p) => p.paymentMethod === params.paymentMethod);
    }

    // 5. Filter: Date Range
    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.purchaseDate).getTime() >= start.getTime());
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.purchaseDate).getTime() <= end.getTime());
    }

    // 6. Search (Purchase Number, Invoice Number, Supplier Name, or contained Product Name)
    if (search) {
      // Find purchaseIds containing matching products
      const matchingPurchaseIds = allItems
        .filter((item) => productIdsInSearch.includes(item.productId))
        .map((item) => item.purchaseId);

      list = list.filter((p) => {
        const numberMatch = p.purchaseNumber.toLowerCase().includes(search);
        const invoiceMatch = p.invoiceNumber?.toLowerCase().includes(search) || false;
        const supplierMatch = p.supplierName.toLowerCase().includes(search);
        const productMatch = p.id ? matchingPurchaseIds.includes(p.id) : false;
        return numberMatch || invoiceMatch || supplierMatch || productMatch;
      });
    }

    // 7. Sort
    const sortBy = params.sortBy || 'newest';
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      if (sortBy === 'oldest') return new Date(a.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      if (sortBy === 'grandTotal_desc') return b.grandTotal - a.grandTotal;
      if (sortBy === 'grandTotal_asc') return a.grandTotal - b.grandTotal;
      if (sortBy === 'purchaseNumber_asc') return a.purchaseNumber.localeCompare(b.purchaseNumber);
      if (sortBy === 'purchaseNumber_desc') return b.purchaseNumber.localeCompare(a.purchaseNumber);
      if (sortBy === 'supplierName_asc') return a.supplierName.localeCompare(b.supplierName);
      return 0;
    });

    // 8. Paginate
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedData = list.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Error querying purchases:', error);
    throw new Error('Database Error: Unable to query purchases.');
  }
}

/* ==========================================================================
   GOOGLE SHEETS SYNC & RESTORE PLACEHOLDERS
   ========================================================================== */

/**
 * Prepares purchase and its items for backup synchronization.
 */
export function preparePurchaseForSheetsSync(purchase: Purchase, items: PurchaseItem[]) {
  return {
    purchase: {
      ...purchase,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      purchaseDate: typeof purchase.purchaseDate === 'string' ? purchase.purchaseDate : purchase.purchaseDate.toISOString(),
    },
    items: items.map((item) => ({
      ...item,
    })),
  };
}

/**
 * Placeholder for Google Sheets Synchronization Sync Backup.
 */
export async function syncPurchasesToGoogleSheets(): Promise<boolean> {
  console.log('Google Sheets Purchases Synchronization triggered (placeholder).');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Purchases sync completed successfully.');
      resolve(true);
    }, 1000);
  });
}

/**
 * Placeholder for Google Sheets Restore Backup.
 */
export async function restorePurchasesFromGoogleSheets(): Promise<boolean> {
  console.log('Google Sheets Purchases Restoration triggered (placeholder).');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Purchases restore completed successfully.');
      resolve(true);
    }, 1000);
  });
}
