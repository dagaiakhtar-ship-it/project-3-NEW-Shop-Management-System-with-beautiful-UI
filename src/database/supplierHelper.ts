import { db, type Supplier, type Purchase } from './db';

/**
 * Validates a supplier before insertion or update.
 * Returns an error message string if invalid, or null if valid.
 */
export async function validateSupplier(
  supplier: Partial<Supplier>,
  isUpdate = false,
  id?: number
): Promise<string | null> {
  const companyName = supplier.companyName?.trim();
  const phone = supplier.phone?.trim();
  const supplierCode = supplier.supplierCode?.trim();
  const email = supplier.email?.trim();
  const website = supplier.website?.trim();
  const openingBalance = supplier.openingBalance ?? 0;

  // 1. Company Name Required
  if (!companyName) {
    return 'Company Name is required.';
  }

  // 2. Phone Required
  if (!phone) {
    return 'Phone number is required.';
  }

  // 3. Opening Balance cannot be negative
  if (openingBalance < 0) {
    return 'Opening Balance cannot be negative.';
  }

  // 4. Valid Email Format
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
  }

  // 5. Valid Website URL
  if (website) {
    try {
      // Allow relative or standard web domains by verifying prefix if needed
      // A simple regex or URL construction
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      if (!urlPattern.test(website)) {
        return 'Please enter a valid website URL.';
      }
    } catch (e) {
      return 'Please enter a valid website URL.';
    }
  }

  // 6. Unique Supplier Code check (excluding soft-deleted Archived if they don't conflict, but standard is all non-archived)
  if (supplierCode) {
    const existingCode = await db.suppliers
      .filter(
        (s) =>
          s.supplierCode.trim().toLowerCase() === supplierCode.toLowerCase() &&
          s.status !== 'Archived' &&
          (!isUpdate || s.id !== id)
      )
      .first();

    if (existingCode) {
      return `A supplier with code "${supplierCode}" already exists.`;
    }
  } else {
    return 'Supplier Code is required.';
  }

  // 7. Unique Phone Number check
  const existingPhone = await db.suppliers
    .filter(
      (s) =>
        s.phone.trim().replace(/[\s-()]/g, '') === phone.replace(/[\s-()]/g, '') &&
        s.status !== 'Archived' &&
        (!isUpdate || s.id !== id)
    )
    .first();

  if (existingPhone) {
    return `A supplier with phone number "${phone}" already exists.`;
  }

  return null;
}

/**
 * Automatically generates a unique, sequential Supplier Code (e.g., SUP-000001)
 */
export async function generateNextSupplierCode(): Promise<string> {
  try {
    const allSuppliers = await db.suppliers.toArray();
    let maxNum = 0;
    const regex = /^SUP-(\d+)$/i;

    for (const s of allSuppliers) {
      if (s.supplierCode) {
        const match = s.supplierCode.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNum = maxNum + 1;
    return `SUP-${String(nextNum).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error in generateNextSupplierCode:', error);
    return 'SUP-000001';
  }
}

/**
 * Calculates current balance for a supplier.
 * Formula: Opening Balance + Future Purchases (Total) - Future Payments (Paid)
 */
export async function calculateCurrentBalance(
  supplierId: number,
  openingBalance: number
): Promise<number> {
  try {
    // Get all purchases for this supplier that are not Cancelled
    const purchases = await db.purchases
      .filter((p) => p.supplierId === supplierId && p.status !== 'Cancelled')
      .toArray();

    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalPayments = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // Current Balance = Opening Balance + Total Purchases - Total Payments
    const currentBalance = openingBalance + totalPurchases - totalPayments;
    return Math.round(currentBalance * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating current balance for supplier:', error);
    return openingBalance;
  }
}

/**
 * Gets a single supplier by ID and computes their live current balance.
 */
export async function getSupplierById(id: number): Promise<Supplier | undefined> {
  try {
    const supplier = await db.suppliers.get(id);
    if (supplier) {
      // Calculate live current balance
      const balance = await calculateCurrentBalance(supplier.id!, supplier.openingBalance || 0);
      return {
        ...supplier,
        currentBalance: balance,
      };
    }
    return undefined;
  } catch (error) {
    console.error('Database error in getSupplierById:', error);
    throw new Error('Database Error: Unable to fetch supplier details.');
  }
}

/**
 * Adds a new supplier.
 */
export async function addSupplier(
  supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>
): Promise<Supplier> {
  // Trim spaces from inputs
  const cleanedData = {
    supplierCode: supplierData.supplierCode?.trim() || '',
    companyName: supplierData.companyName?.trim() || '',
    contactPerson: supplierData.contactPerson?.trim() || '',
    phone: supplierData.phone?.trim() || '',
    alternatePhone: supplierData.alternatePhone?.trim() || '',
    email: supplierData.email?.trim() || '',
    address: supplierData.address?.trim() || '',
    city: supplierData.city?.trim() || '',
    country: supplierData.country?.trim() || '',
    postalCode: supplierData.postalCode?.trim() || '',
    website: supplierData.website?.trim() || '',
    taxNumber: supplierData.taxNumber?.trim() || '',
    openingBalance: Number(supplierData.openingBalance) || 0,
    paymentTerms: supplierData.paymentTerms?.trim() || 'Net 30',
    notes: supplierData.notes?.trim() || '',
    status: supplierData.status || 'Active',
    name: supplierData.companyName?.trim() || '', // compatibility field
  };

  const validationError = await validateSupplier(cleanedData);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const newSupplier: Supplier = {
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.suppliers.add(newSupplier);
    const currentBalance = await calculateCurrentBalance(id, newSupplier.openingBalance || 0);

    return {
      ...newSupplier,
      id,
      currentBalance,
    };
  } catch (error: any) {
    console.error('Database error in addSupplier:', error);
    throw new Error(error.message || 'Database Error: Unable to save supplier.');
  }
}

/**
 * Updates an existing supplier.
 */
export async function updateSupplier(
  id: number,
  supplierData: Partial<Supplier>
): Promise<Supplier> {
  const existing = await db.suppliers.get(id);
  if (!existing) {
    throw new Error('Supplier not found.');
  }

  // Prepare updated data with trimmed strings
  const updatedFields: Partial<Supplier> = {};
  if (supplierData.supplierCode !== undefined) updatedFields.supplierCode = supplierData.supplierCode.trim();
  if (supplierData.companyName !== undefined) {
    updatedFields.companyName = supplierData.companyName.trim();
    updatedFields.name = supplierData.companyName.trim(); // sync compatibility name
  }
  if (supplierData.contactPerson !== undefined) updatedFields.contactPerson = supplierData.contactPerson.trim();
  if (supplierData.phone !== undefined) updatedFields.phone = supplierData.phone.trim();
  if (supplierData.alternatePhone !== undefined) updatedFields.alternatePhone = supplierData.alternatePhone.trim();
  if (supplierData.email !== undefined) updatedFields.email = supplierData.email.trim();
  if (supplierData.address !== undefined) updatedFields.address = supplierData.address.trim();
  if (supplierData.city !== undefined) updatedFields.city = supplierData.city.trim();
  if (supplierData.country !== undefined) updatedFields.country = supplierData.country.trim();
  if (supplierData.postalCode !== undefined) updatedFields.postalCode = supplierData.postalCode.trim();
  if (supplierData.website !== undefined) updatedFields.website = supplierData.website.trim();
  if (supplierData.taxNumber !== undefined) updatedFields.taxNumber = supplierData.taxNumber.trim();
  if (supplierData.openingBalance !== undefined) updatedFields.openingBalance = Number(supplierData.openingBalance);
  if (supplierData.paymentTerms !== undefined) updatedFields.paymentTerms = supplierData.paymentTerms.trim();
  if (supplierData.notes !== undefined) updatedFields.notes = supplierData.notes.trim();
  if (supplierData.status !== undefined) updatedFields.status = supplierData.status;

  const validationError = await validateSupplier({ ...existing, ...updatedFields }, true, id);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const updatedSupplier: Supplier = {
      ...existing,
      ...updatedFields,
      updatedAt: new Date(),
    };

    await db.suppliers.put(updatedSupplier);
    const liveBalance = await calculateCurrentBalance(id, updatedSupplier.openingBalance || 0);

    return {
      ...updatedSupplier,
      currentBalance: liveBalance,
    };
  } catch (error: any) {
    console.error('Database error in updateSupplier:', error);
    throw new Error(error.message || 'Database Error: Unable to update supplier.');
  }
}

/**
 * Soft deletes a supplier (sets status to Archived).
 */
export async function deleteSupplier(id: number): Promise<void> {
  try {
    const existing = await db.suppliers.get(id);
    if (!existing) {
      throw new Error('Supplier not found.');
    }

    await db.suppliers.update(id, {
      status: 'Archived',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in deleteSupplier:', error);
    throw new Error(error.message || 'Database Error: Unable to archive supplier.');
  }
}

/**
 * Restores a soft-deleted supplier (sets status to Active).
 */
export async function restoreSupplier(id: number): Promise<void> {
  try {
    const existing = await db.suppliers.get(id);
    if (!existing) {
      throw new Error('Supplier not found.');
    }

    await db.suppliers.update(id, {
      status: 'Active',
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Database error in restoreSupplier:', error);
    throw new Error(error.message || 'Database Error: Unable to restore supplier.');
  }
}

/**
 * Duplicates a supplier with a newly auto-generated Supplier Code.
 */
export async function duplicateSupplier(id: number): Promise<Supplier> {
  try {
    const existing = await db.suppliers.get(id);
    if (!existing) {
      throw new Error('Source supplier not found.');
    }

    const nextCode = await generateNextSupplierCode();

    const duplicatedData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'> = {
      supplierCode: nextCode,
      companyName: `${existing.companyName} (Copy)`,
      contactPerson: existing.contactPerson || '',
      phone: `${existing.phone}-Copy`, // modify phone slightly to bypass unique validation, or make it empty
      alternatePhone: existing.alternatePhone || '',
      email: existing.email ? existing.email.replace('@', '+copy@') : '',
      address: existing.address || '',
      city: existing.city || '',
      country: existing.country || '',
      postalCode: existing.postalCode || '',
      website: existing.website || '',
      taxNumber: existing.taxNumber || '',
      openingBalance: existing.openingBalance || 0,
      paymentTerms: existing.paymentTerms || 'Net 30',
      notes: existing.notes || '',
      status: 'Active',
      name: `${existing.companyName} (Copy)`,
    };

    // Clean phone number duplicate bypass
    // Check if duplicate exists with this copy phone, if so generate random string suffix
    let cleanPhone = duplicatedData.phone;
    let existingP = await db.suppliers.where('phone').equals(cleanPhone).first();
    while (existingP) {
      cleanPhone = `${existing.phone}-${Math.floor(1000 + Math.random() * 9000)}`;
      existingP = await db.suppliers.where('phone').equals(cleanPhone).first();
    }
    duplicatedData.phone = cleanPhone;

    return await addSupplier(duplicatedData);
  } catch (error: any) {
    console.error('Database error in duplicateSupplier:', error);
    throw new Error(error.message || 'Database Error: Unable to duplicate supplier.');
  }
}

/**
 * Queries suppliers with search, sort, filters, and pagination.
 */
export async function querySuppliers(params: {
  searchQuery?: string;
  status?: 'Active' | 'Inactive' | 'Archived' | 'All';
  city?: string;
  country?: string;
  paymentTerms?: string;
  sortBy?: 'companyName_asc' | 'companyName_desc' | 'newest' | 'oldest' | 'openingBalance_asc' | 'openingBalance_desc' | 'currentBalance_asc' | 'currentBalance_desc';
  page?: number;
  pageSize?: number;
}): Promise<{
  data: (Supplier & { purchaseCount: number })[];
  total: number;
  totalPages: number;
}> {
  try {
    let list = await db.suppliers.toArray();

    // 1. Calculate live balances and count purchase orders
    const itemsWithLiveBalances = await Promise.all(
      list.map(async (s) => {
        const liveBalance = await calculateCurrentBalance(s.id!, s.openingBalance || 0);
        const purchaseCount = await db.purchases.where('supplierId').equals(s.id!).count();
        return {
          ...s,
          currentBalance: liveBalance,
          purchaseCount,
        };
      })
    );

    let filtered = itemsWithLiveBalances;

    // 2. Filter by Status
    const statusFilter = params.status || 'All';
    if (statusFilter !== 'All') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    } else {
      // Default to non-archived for 'All'
      filtered = filtered.filter((s) => s.status !== 'Archived');
    }

    // 3. Filter by City
    if (params.city && params.city !== 'all') {
      filtered = filtered.filter((s) => s.city?.toLowerCase() === params.city?.toLowerCase());
    }

    // 4. Filter by Country
    if (params.country && params.country !== 'all') {
      filtered = filtered.filter((s) => s.country?.toLowerCase() === params.country?.toLowerCase());
    }

    // 5. Filter by Payment Terms
    if (params.paymentTerms && params.paymentTerms !== 'all') {
      filtered = filtered.filter((s) => s.paymentTerms?.toLowerCase() === params.paymentTerms?.toLowerCase());
    }

    // 6. Search (Company name, code, phone, email, contact person)
    const search = params.searchQuery?.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((s) => {
        return (
          s.companyName?.toLowerCase().includes(search) ||
          s.supplierCode?.toLowerCase().includes(search) ||
          s.phone?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.contactPerson?.toLowerCase().includes(search)
        );
      });
    }

    // 7. Sorting
    const sort = params.sortBy || 'newest';
    filtered.sort((a, b) => {
      if (sort === 'companyName_asc') {
        return (a.companyName || '').localeCompare(b.companyName || '');
      }
      if (sort === 'companyName_desc') {
        return (b.companyName || '').localeCompare(a.companyName || '');
      }
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'openingBalance_asc') {
        return (a.openingBalance || 0) - (b.openingBalance || 0);
      }
      if (sort === 'openingBalance_desc') {
        return (b.openingBalance || 0) - (a.openingBalance || 0);
      }
      if (sort === 'currentBalance_asc') {
        return (a.currentBalance || 0) - (b.currentBalance || 0);
      }
      if (sort === 'currentBalance_desc') {
        return (b.currentBalance || 0) - (a.currentBalance || 0);
      }
      return 0;
    });

    // 8. Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedData = filtered.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Database error in querySuppliers:', error);
    throw new Error('Database Error: Query operation failed.');
  }
}

/**
 * Bulk updates status for multiple suppliers.
 */
export async function bulkUpdateSupplierStatus(
  ids: number[],
  status: 'Active' | 'Inactive' | 'Archived'
): Promise<void> {
  try {
    await db.transaction('rw', db.suppliers, async () => {
      for (const id of ids) {
        await db.suppliers.update(id, {
          status,
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkUpdateSupplierStatus:', error);
    throw new Error('Database Error: Bulk status update failed.');
  }
}

/**
 * Bulk deletes (soft deletes) multiple suppliers.
 */
export async function bulkDeleteSuppliers(ids: number[]): Promise<void> {
  try {
    await db.transaction('rw', db.suppliers, async () => {
      for (const id of ids) {
        await db.suppliers.update(id, {
          status: 'Archived',
          updatedAt: new Date(),
        });
      }
    });
  } catch (error) {
    console.error('Database error in bulkDeleteSuppliers:', error);
    throw new Error('Database Error: Bulk delete failed.');
  }
}

/* ==========================================================================
   GOOGLE SHEETS SYNC PLACEHOLDERS
   ========================================================================== */

/**
 * Formats supplier object for sync.
 */
export function prepareSupplierForSheetsSync(supplier: Supplier) {
  return {
    id: supplier.id,
    supplierCode: supplier.supplierCode,
    companyName: supplier.companyName,
    contactPerson: supplier.contactPerson || '',
    phone: supplier.phone,
    alternatePhone: supplier.alternatePhone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    city: supplier.city || '',
    country: supplier.country || '',
    postalCode: supplier.postalCode || '',
    website: supplier.website || '',
    taxNumber: supplier.taxNumber || '',
    openingBalance: supplier.openingBalance || 0,
    currentBalance: supplier.currentBalance || 0,
    paymentTerms: supplier.paymentTerms || 'Net 30',
    notes: supplier.notes || '',
    status: supplier.status || 'Active',
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt ? supplier.updatedAt.toISOString() : '',
  };
}

/**
 * Simulates uploading suppliers data to Google Sheets backup.
 */
export async function syncSuppliersToGoogleSheets(): Promise<boolean> {
  console.log('Google Sheets Supplier Synchronization triggered (placeholder).');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Suppliers synchronization completed successfully.');
      resolve(true);
    }, 1200);
  });
}
