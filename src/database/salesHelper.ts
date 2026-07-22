import { db, type Sale, type SaleItem, type StockHistory, type Customer, type CreditAccount } from './db';
import { updateCustomerBalance } from './creditHelper';

/**
 * Validates sale data and stock availability before saving.
 */
export async function validateSaleItems(items: Array<{ productId: number; quantity: number }>): Promise<string | null> {
  if (!items || items.length === 0) {
    return 'At least one product is required to create a sale.';
  }

  for (const item of items) {
    const product = await db.products.get(item.productId);
    if (!product) {
      return `Product ID ${item.productId} not found in database.`;
    }
    const available = product.currentStock ?? product.stock ?? 0;
    if (item.quantity <= 0) {
      return `Quantity for product "${product.name}" must be greater than zero.`;
    }
    if (available < item.quantity) {
      return `Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}.`;
    }
  }

  return null;
}

/**
 * Saves a sale transaction into IndexedDB inside an ACID transaction.
 * Automatically decreases stock, writes stock history logs, and updates customer credit balance.
 */
export async function saveSale(
  saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNo'>,
  itemsData: Array<Omit<SaleItem, 'id' | 'saleId'>>
): Promise<{ saleId: number; sale: Sale }> {
  // Validate items and stock availability first
  const validationError = await validateSaleItems(itemsData);
  if (validationError) {
    throw new Error(validationError);
  }

  // Calculate transaction financial metrics safely
  const grandTotal = saleData.grandTotal ?? saleData.total ?? 0;
  const paidAmount = saleData.paidAmount ?? 0;
  const remainingAmount = Math.max(0, saleData.remainingAmount ?? (grandTotal - paidAmount));

  // Determine if this is a credit/loan or partial payment sale
  const isCreditOrLoan =
    saleData.saleType === 'Credit Sale' ||
    saleData.saleType === 'Partial Payment Sale' ||
    remainingAmount > 0 ||
    saleData.paymentMethod === 'Credit' ||
    saleData.paymentMethod === 'Loan';

  // Ensure credit rules are respected: a customer ID must be provided
  if (isCreditOrLoan && (!saleData.customerId || saleData.customerId <= 0)) {
    throw new Error('A registered customer is required to process Credit, Partial, or Loan transactions.');
  }

  const invoiceNo = saleData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

  // Run everything inside an atomic Dexie read-write transaction
  const result = await db.transaction(
    'rw',
    [db.sales, db.saleItems, db.products, db.stockHistory, db.customers, db.creditAccounts, db.creditPayments],
    async () => {
      // 1. Check customer credit limit if applicable
      if (isCreditOrLoan && saleData.customerId) {
        const customer = await db.customers.get(saleData.customerId);
        if (!customer) {
          throw new Error(`Customer with ID ${saleData.customerId} not found in database.`);
        }

        const limit = customer.creditLimit ?? 0;
        const currentBal = customer.currentBalance ?? customer.balance ?? 0;
        const projectedBal = currentBal + remainingAmount;

        if (limit > 0 && projectedBal > limit) {
          throw new Error(
            `Transaction exceeds customer credit limit. Limit: $${limit.toFixed(
              2
            )}, Projected Balance: $${projectedBal.toFixed(2)}`
          );
        }
      }

      // 2. Create Sale Header
      const newSale: Sale = {
        ...saleData,
        grandTotal,
        paidAmount,
        remainingAmount,
        invoiceNo, // compatibility field
        invoiceNumber: invoiceNo,
        isDeleted: false,
        status: 'Completed', // compatibility
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const saleId = await db.sales.add(newSale);
      newSale.id = saleId;

      // 3. Add Sale Items & Update Stock & Write Stock History Logs
      for (const item of itemsData) {
        const product = await db.products.get(item.productId);
        if (!product) continue;

        // Save Sale Item
        const newSaleItem: SaleItem = {
          ...item,
          saleId,
          price: item.sellingPrice,
          subtotal: item.total,
        };
        await db.saleItems.add(newSaleItem);

        // Update Product Stock
        const prevStock = product.currentStock ?? product.stock ?? 0;
        const nextStock = prevStock - item.quantity;

        await db.products.update(item.productId, {
          currentStock: nextStock,
          stock: nextStock,
          updatedAt: new Date(),
        });

        // Write Stock History Log
        const history: StockHistory = {
          productId: item.productId,
          type: 'Sale',
          quantity: -item.quantity,
          currentStock: nextStock,
          referenceNo: invoiceNo,
          notes: `POS Sale checkout. Invoice: ${invoiceNo}`,
          createdAt: new Date(),
        };
        await db.stockHistory.add(history);
      }

      // 4. Handle Credit Account & Downpayment Ledger Logging
      if (isCreditOrLoan && saleData.customerId) {
        // Create Credit Account record for this specific invoice
        const creditAccId = await db.creditAccounts.add({
          customerId: saleData.customerId,
          invoiceId: saleId,
          invoiceNumber: invoiceNo,
          invoiceDate: saleData.saleDate || new Date(),
          invoiceAmount: grandTotal,
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          status: remainingAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days due
          notes: saleData.notes || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Record downpayment in creditPayments if paidAmount > 0
        if (paidAmount > 0) {
          await db.creditPayments.add({
            creditAccountId: creditAccId,
            customerId: saleData.customerId,
            invoiceId: saleId,
            paymentDate: saleData.saleDate || new Date(),
            paymentMethod: saleData.paymentMethod || 'Cash',
            amount: paidAmount,
            referenceNumber: 'POS-DP',
            referenceNo: 'POS-DP',
            notes: 'Downpayment received at Point Of Sale checkout',
            receivedBy: String(saleData.createdBy || 'Cashier'),
            createdAt: new Date(),
          });
        }

        // Recalculate customer total credit balance directly from source records
        await updateCustomerBalance(saleData.customerId);
      }

      return { saleId, sale: newSale };
    }
  );

  return result;
}

/**
 * Soft deletes a sale (marks `isDeleted = true`).
 * Restores product stock and reverts any customer credit balances.
 */
export async function deleteSale(saleId: number): Promise<boolean> {
  const sale = await db.sales.get(saleId);
  if (!sale) {
    throw new Error('Sale transaction not found.');
  }

  if (sale.isDeleted) {
    return true; // Already deleted
  }

  await db.transaction(
    'rw',
    [db.sales, db.saleItems, db.products, db.stockHistory, db.customers, db.creditAccounts, db.creditPayments],
    async () => {
      // 1. Mark Sale as soft deleted
      await db.sales.update(saleId, {
        isDeleted: true,
        status: 'Deleted',
        updatedAt: new Date(),
      });

      const items = await db.saleItems.where('saleId').equals(saleId).toArray();

      // 2. Restore Stock and log reversals
      for (const item of items) {
        const product = await db.products.get(item.productId);
        if (product) {
          const prevStock = product.currentStock ?? product.stock ?? 0;
          const nextStock = prevStock + item.quantity;

          await db.products.update(item.productId, {
            currentStock: nextStock,
            stock: nextStock,
            updatedAt: new Date(),
          });

          // Log restoration in stock history
          const history: StockHistory = {
            productId: item.productId,
            type: 'Adjustment',
            quantity: item.quantity,
            currentStock: nextStock,
            referenceNo: sale.invoiceNumber || sale.invoiceNo,
            notes: `Reversed POS checkout (Sale Deleted). Invoice: ${sale.invoiceNumber || sale.invoiceNo}`,
            createdAt: new Date(),
          };
          await db.stockHistory.add(history);
        }
      }

      // 3. Cancel associated credit accounts and revert customer balance
      const associatedCreditAccs = await db.creditAccounts
        .where('invoiceId')
        .equals(saleId)
        .toArray();

      for (const acc of associatedCreditAccs) {
        await db.creditAccounts.update(acc.id!, {
          status: 'Cancelled',
          remainingAmount: 0,
          updatedAt: new Date(),
        });

        // Remove downpayment records associated with this cancelled credit account
        await db.creditPayments.where('creditAccountId').equals(acc.id!).delete();
      }

      // Re-calculate customer credit balance from source
      if (sale.customerId) {
        await updateCustomerBalance(sale.customerId);
      }
    }
  );

  return true;
}

/**
 * Restores a soft-deleted sale.
 * Deducts stock again and updates customer credit balances.
 */
export async function restoreSale(saleId: number): Promise<boolean> {
  const sale = await db.sales.get(saleId);
  if (!sale) {
    throw new Error('Sale transaction not found.');
  }

  if (!sale.isDeleted) {
    return true; // Already active
  }

  const items = await db.saleItems.where('saleId').equals(saleId).toArray();

  // Validate stock before restoring
  const validationItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  const validationError = await validateSaleItems(validationItems);
  if (validationError) {
    throw new Error(`Cannot restore transaction: ${validationError}`);
  }

  await db.transaction(
    'rw',
    [db.sales, db.saleItems, db.products, db.stockHistory, db.customers, db.creditAccounts, db.creditPayments],
    async () => {
      // 1. Mark sale as active
      await db.sales.update(saleId, {
        isDeleted: false,
        status: 'Completed',
        updatedAt: new Date(),
      });

      // 2. Re-deduct stock and log
      for (const item of items) {
        const product = await db.products.get(item.productId);
        if (product) {
          const prevStock = product.currentStock ?? product.stock ?? 0;
          const nextStock = prevStock - item.quantity;

          await db.products.update(item.productId, {
            currentStock: nextStock,
            stock: nextStock,
            updatedAt: new Date(),
          });

          const history: StockHistory = {
            productId: item.productId,
            type: 'Sale',
            quantity: -item.quantity,
            currentStock: nextStock,
            referenceNo: sale.invoiceNumber || sale.invoiceNo,
            notes: `Restored POS checkout. Invoice: ${sale.invoiceNumber || sale.invoiceNo}`,
            createdAt: new Date(),
          };
          await db.stockHistory.add(history);
        }
      }

      // 3. Re-activate associated credit accounts and restore customer credit balance
      const associatedCreditAccs = await db.creditAccounts
        .where('invoiceId')
        .equals(saleId)
        .toArray();

      for (const acc of associatedCreditAccs) {
        const rem = sale.remainingAmount ?? 0;
        const status = rem <= 0 ? 'Paid' : (sale.paidAmount > 0 ? 'Partial' : 'Unpaid');

        await db.creditAccounts.update(acc.id!, {
          status: status,
          remainingAmount: rem,
          updatedAt: new Date(),
        });

        if (sale.paidAmount > 0) {
          await db.creditPayments.add({
            creditAccountId: acc.id,
            customerId: sale.customerId,
            invoiceId: saleId,
            paymentDate: new Date(),
            paymentMethod: sale.paymentMethod || 'Cash',
            amount: sale.paidAmount,
            referenceNumber: 'POS-DP',
            referenceNo: 'POS-DP',
            notes: 'Downpayment re-applied upon sale restoration',
            receivedBy: 'Cashier',
            createdAt: new Date(),
          });
        }
      }

      if (sale.customerId) {
        await updateCustomerBalance(sale.customerId);
      }
    }
  );

  return true;
}

/**
 * Offline-first sales query engine. Filters, searches, sorts, and paginates sales records.
 */
export async function querySales(params: {
  searchQuery?: string;
  customerId?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  saleType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    let allSales = await db.sales.toArray();

    // Support soft deletes
    const isDeletedFilter = params.paymentStatus === 'Deleted';
    if (isDeletedFilter) {
      allSales = allSales.filter((s) => s.isDeleted === true);
    } else {
      // Exclude soft-deleted items from normal queries
      allSales = allSales.filter((s) => s.isDeleted !== true);
      
      // Filter by payment status if specified and not 'All'
      if (params.paymentStatus && params.paymentStatus !== 'All' && params.paymentStatus !== 'all') {
        allSales = allSales.filter((s) => s.paymentStatus === params.paymentStatus);
      }
    }

    // Filter by Customer
    if (params.customerId && params.customerId !== 0) {
      allSales = allSales.filter((s) => s.customerId === params.customerId);
    }

    // Filter by Payment Method
    if (params.paymentMethod && params.paymentMethod !== 'All' && params.paymentMethod !== 'all') {
      allSales = allSales.filter((s) => s.paymentMethod === params.paymentMethod);
    }

    // Filter by Sale Type
    if (params.saleType && params.saleType !== 'All' && params.saleType !== 'all') {
      allSales = allSales.filter((s) => s.saleType === params.saleType);
    }

    // Filter by Date Range
    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      allSales = allSales.filter((s) => new Date(s.saleDate || s.createdAt) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      allSales = allSales.filter((s) => new Date(s.saleDate || s.createdAt) <= end);
    }

    // Search (matches invoice number or customerName)
    const queryStr = params.searchQuery?.trim().toLowerCase();
    if (queryStr) {
      allSales = allSales.filter((s) => {
        const invNum = (s.invoiceNumber || s.invoiceNo || '').toLowerCase();
        const custName = (s.customerName || '').toLowerCase();
        return invNum.includes(queryStr) || custName.includes(queryStr);
      });
    }

    // Sort
    const sort = params.sortBy || 'newest';
    allSales.sort((a, b) => {
      const dateA = new Date(a.saleDate || a.createdAt).getTime();
      const dateB = new Date(b.saleDate || b.createdAt).getTime();

      if (sort === 'oldest') {
        return dateA - dateB;
      }
      if (sort === 'invoice_asc') {
        return (a.invoiceNumber || a.invoiceNo).localeCompare(b.invoiceNumber || b.invoiceNo);
      }
      if (sort === 'invoice_desc') {
        return (b.invoiceNumber || b.invoiceNo).localeCompare(a.invoiceNumber || a.invoiceNo);
      }
      if (sort === 'grandTotal_desc') {
        const totalA = a.grandTotal ?? a.total ?? 0;
        const totalB = b.grandTotal ?? b.total ?? 0;
        return totalB - totalA;
      }
      if (sort === 'grandTotal_asc') {
        const totalA = a.grandTotal ?? a.total ?? 0;
        const totalB = b.grandTotal ?? b.total ?? 0;
        return totalA - totalB;
      }
      if (sort === 'customer_asc') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sort === 'customer_desc') {
        return (b.customerName || '').localeCompare(a.customerName || '');
      }
      // default: newest
      return dateB - dateA;
    });

    // Populate item counts and items info
    const enrichedSales = await Promise.all(
      allSales.map(async (sale) => {
        const items = await db.saleItems.where('saleId').equals(sale.id!).toArray();
        const customer = sale.customerId ? await db.customers.get(sale.customerId) : null;
        
        return {
          ...sale,
          items,
          customerName: customer ? customer.fullName : (sale.customerName || 'Walk-in Customer'),
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
    );

    // Pagination
    const total = enrichedSales.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = enrichedSales.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
    };
  } catch (err) {
    console.error('Error in querySales helper:', err);
    throw new Error('Database Error: Failed to query sales history.');
  }
}
