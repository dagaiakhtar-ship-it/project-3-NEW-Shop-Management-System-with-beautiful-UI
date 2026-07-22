import { db, type Customer } from './db';

/**
 * Validates a customer before insertion or update.
 * Returns an error message string if invalid, or null if valid.
 */
export async function validateCustomer(
  customer: Partial<Customer>,
  isUpdate = false,
  id?: number
): Promise<string | null> {
  const fullName = customer.fullName?.trim();
  const phone = customer.phone?.trim();
  const customerCode = customer.customerCode?.trim();
  const email = customer.email?.trim();
  const openingBalance = customer.openingBalance ?? 0;
  const creditLimit = customer.creditLimit ?? 0;

  // 1. Full Name Required
  if (!fullName) {
    return 'Full Name is required.';
  }

  // 2. Phone Required
  if (!phone) {
    return 'Phone number is required.';
  }

  // 3. Opening Balance cannot be negative
  if (openingBalance < 0) {
    return 'Opening Balance cannot be negative.';
  }

  // 4. Credit Limit cannot be negative
  if (creditLimit < 0) {
    return 'Credit Limit cannot be negative.';
  }

  // 5. Valid Email Format
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
  }

  // 6. Unique Customer Code Check
  if (customerCode) {
    const existingCode = await db.customers
      .filter(
        (c) =>
          c.customerCode?.trim().toLowerCase() === customerCode.toLowerCase() &&
          !c.isDeleted &&
          (!isUpdate || c.id !== id)
      )
      .first();

    if (existingCode) {
      return `A customer with code "${customerCode}" already exists.`;
    }
  } else {
    return 'Customer Code is required.';
  }

  // 7. Unique Phone Number Check
  const existingPhone = await db.customers
    .filter(
      (c) =>
        c.phone.trim().replace(/[\s-()]/g, '') === phone.replace(/[\s-()]/g, '') &&
        !c.isDeleted &&
        (!isUpdate || c.id !== id)
    )
    .first();

  if (existingPhone) {
    return `A customer with phone number "${phone}" already exists.`;
  }

  return null;
}

/**
 * Automatically generates a unique, sequential Customer Code (e.g., CUS-000001)
 */
export async function generateNextCustomerCode(): Promise<string> {
  try {
    const allCustomers = await db.customers.toArray();
    let maxNum = 0;
    const regex = /^CUS-(\d+)$/i;

    for (const c of allCustomers) {
      if (c.customerCode) {
        const match = c.customerCode.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNum = maxNum + 1;
    return `CUS-${String(nextNum).padStart(6, '0')}`;
  } catch (error) {
    console.error('Error in generateNextCustomerCode:', error);
    return 'CUS-000001';
  }
}

/**
 * Gets a single customer by ID
 */
export async function getCustomerById(id: number): Promise<Customer | undefined> {
  try {
    return await db.customers.get(id);
  } catch (error) {
    console.error('Database error in getCustomerById:', error);
    throw new Error('Database Error: Unable to fetch customer details.');
  }
}

/**
 * Adds a new customer.
 */
export async function addCustomer(
  customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'name' | 'balance'>
): Promise<Customer> {
  // Trim spaces and clean inputs
  const fullName = customerData.fullName?.trim() || '';
  const customerCode = customerData.customerCode?.trim() || '';
  const phone = customerData.phone?.trim() || '';
  const openingBalance = Number(customerData.openingBalance) || 0;
  const currentBalance = Number(customerData.currentBalance) ?? openingBalance; // starts as openingBalance

  const cleanedData = {
    ...customerData,
    fullName,
    customerCode,
    phone,
    alternatePhone: customerData.alternatePhone?.trim() || '',
    email: customerData.email?.trim() || '',
    address: customerData.address?.trim() || '',
    city: customerData.city?.trim() || '',
    postalCode: customerData.postalCode?.trim() || '',
    gender: customerData.gender || 'Other',
    nationalId: customerData.nationalId?.trim() || '',
    openingBalance,
    currentBalance,
    creditLimit: Number(customerData.creditLimit) || 0,
    notes: customerData.notes?.trim() || '',
    status: customerData.status || 'Active',
    profileImage: customerData.profileImage || '',
    isDeleted: false,
    
    // Compatibility fields
    name: fullName,
    balance: currentBalance
  };

  const validationError = await validateCustomer(cleanedData);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const newCustomer: Customer = {
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.customers.add(newCustomer);
    return { ...newCustomer, id };
  } catch (error: any) {
    console.error('Error adding customer:', error);
    throw new Error(error.message || 'Database error occurred while adding customer.');
  }
}

/**
 * Updates an existing customer.
 */
export async function updateCustomer(
  id: number,
  customerData: Partial<Customer>
): Promise<Customer> {
  const existing = await db.customers.get(id);
  if (!existing) {
    throw new Error('Customer not found.');
  }

  const cleanedData: Partial<Customer> = {
    ...customerData,
    fullName: customerData.fullName !== undefined ? customerData.fullName.trim() : existing.fullName,
    customerCode: customerData.customerCode !== undefined ? customerData.customerCode.trim() : existing.customerCode,
    phone: customerData.phone !== undefined ? customerData.phone.trim() : existing.phone,
    alternatePhone: customerData.alternatePhone !== undefined ? customerData.alternatePhone.trim() : existing.alternatePhone,
    email: customerData.email !== undefined ? customerData.email.trim() : existing.email,
    address: customerData.address !== undefined ? customerData.address.trim() : existing.address,
    city: customerData.city !== undefined ? customerData.city.trim() : existing.city,
    postalCode: customerData.postalCode !== undefined ? customerData.postalCode.trim() : existing.postalCode,
    nationalId: customerData.nationalId !== undefined ? customerData.nationalId.trim() : existing.nationalId,
    openingBalance: customerData.openingBalance !== undefined ? Number(customerData.openingBalance) : existing.openingBalance,
    currentBalance: customerData.currentBalance !== undefined ? Number(customerData.currentBalance) : existing.currentBalance,
    creditLimit: customerData.creditLimit !== undefined ? Number(customerData.creditLimit) : existing.creditLimit,
    notes: customerData.notes !== undefined ? customerData.notes.trim() : existing.notes,
    status: customerData.status || existing.status,
    profileImage: customerData.profileImage !== undefined ? customerData.profileImage : existing.profileImage,
    gender: customerData.gender || existing.gender,
    dateOfBirth: customerData.dateOfBirth !== undefined ? customerData.dateOfBirth : existing.dateOfBirth,
  };

  // Keep compatibility fields synchronized
  if (cleanedData.fullName) {
    cleanedData.name = cleanedData.fullName;
  }
  if (cleanedData.currentBalance !== undefined) {
    cleanedData.balance = cleanedData.currentBalance;
  }

  // Validate changes
  const validationError = await validateCustomer(cleanedData, true, id);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const updatedCustomer: Customer = {
      ...existing,
      ...cleanedData,
      updatedAt: new Date(),
    } as Customer;

    await db.customers.put(updatedCustomer);
    return updatedCustomer;
  } catch (error: any) {
    console.error('Error updating customer:', error);
    throw new Error(error.message || 'Database error occurred while updating customer.');
  }
}

/**
 * Soft deletes a customer by setting `isDeleted = true`.
 */
export async function deleteCustomer(id: number): Promise<boolean> {
  try {
    const existing = await db.customers.get(id);
    if (!existing) {
      throw new Error('Customer not found.');
    }

    await db.customers.update(id, {
      isDeleted: true,
      status: 'Inactive',
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw new Error('Failed to soft delete customer.');
  }
}

/**
 * Restores a soft-deleted customer.
 */
export async function restoreCustomer(id: number): Promise<boolean> {
  try {
    const existing = await db.customers.get(id);
    if (!existing) {
      throw new Error('Customer not found.');
    }

    await db.customers.update(id, {
      isDeleted: false,
      status: 'Active',
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error in restoreCustomer:', error);
    throw new Error('Failed to restore customer.');
  }
}

/**
 * Duplicates a customer record.
 */
export async function duplicateCustomer(id: number): Promise<Customer> {
  try {
    const existing = await db.customers.get(id);
    if (!existing) {
      throw new Error('Customer to duplicate was not found.');
    }

    const nextCode = await generateNextCustomerCode();

    const duplicatedData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      customerCode: nextCode,
      customerType: existing.customerType,
      fullName: `${existing.fullName} (Copy)`,
      phone: `${existing.phone}-copy`, // unique placeholder to edit later
      alternatePhone: existing.alternatePhone,
      email: existing.email ? `${existing.email.split('@')[0]}+copy@${existing.email.split('@')[1] || 'gmail.com'}` : '',
      address: existing.address,
      city: existing.city,
      postalCode: existing.postalCode,
      dateOfBirth: existing.dateOfBirth,
      gender: existing.gender,
      nationalId: existing.nationalId ? `${existing.nationalId}-copy` : '',
      profileImage: existing.profileImage,
      openingBalance: existing.openingBalance,
      currentBalance: existing.currentBalance,
      creditLimit: existing.creditLimit,
      status: 'Active',
      notes: existing.notes,
      isDeleted: false,
      name: `${existing.fullName} (Copy)`,
      balance: existing.currentBalance || 0,
    };

    const newId = await db.customers.add({
      ...duplicatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Customer);

    const result = await db.customers.get(newId);
    if (!result) {
      throw new Error('Failed to retrieve duplicated customer.');
    }
    return result;
  } catch (error: any) {
    console.error('Error in duplicateCustomer:', error);
    throw new Error(error.message || 'Failed to duplicate customer.');
  }
}

/**
 * Queries customers with search, sort, filters, and pagination.
 */
export async function queryCustomers(params: {
  searchQuery?: string;
  customerType?: string;
  status?: string;
  city?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: Customer[];
  total: number;
  totalPages: number;
}> {
  try {
    let list = await db.customers.toArray();

    // 1. Map name & balance compatibility fields if not already populated
    let processed = list.map((c) => ({
      ...c,
      name: c.fullName || c.name || '',
      balance: c.currentBalance ?? c.balance ?? 0,
    }));

    // 2. Filter by soft deleted vs active
    const statusFilter = params.status || 'Active';
    
    if (statusFilter === 'Deleted') {
      // Specifically look for soft-deleted entries
      processed = processed.filter((c) => c.isDeleted === true);
    } else {
      // Exclude soft-deleted entries unless status is 'All' which includes deleted
      if (statusFilter !== 'All') {
        processed = processed.filter((c) => c.isDeleted !== true);
        if (statusFilter !== 'all-active-inactive') {
          processed = processed.filter((c) => c.status === statusFilter);
        }
      } else {
        // 'All' includes deleted and non-deleted
      }
    }

    // 3. Filter by Customer Type
    if (params.customerType && params.customerType !== 'All' && params.customerType !== 'all') {
      processed = processed.filter((c) => c.customerType === params.customerType);
    }

    // 4. Filter by City
    if (params.city && params.city !== 'All' && params.city !== 'all') {
      processed = processed.filter((c) => c.city?.toLowerCase() === params.city?.toLowerCase());
    }

    // 5. Search (matches code, full name, phone, email, nationalId)
    const search = params.searchQuery?.trim().toLowerCase();
    if (search) {
      processed = processed.filter((c) => {
        return (
          c.customerCode?.toLowerCase().includes(search) ||
          c.fullName?.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.nationalId && c.nationalId.toLowerCase().includes(search))
        );
      });
    }

    // 6. Sorting
    const sort = params.sortBy || 'newest';
    processed.sort((a, b) => {
      if (sort === 'fullName_asc') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      }
      if (sort === 'fullName_desc') {
        return (b.fullName || '').localeCompare(a.fullName || '');
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'currentBalance_desc') {
        return (b.currentBalance ?? 0) - (a.currentBalance ?? 0);
      }
      if (sort === 'currentBalance_asc') {
        return (a.currentBalance ?? 0) - (b.currentBalance ?? 0);
      }
      if (sort === 'creditLimit_desc') {
        return (b.creditLimit ?? 0) - (a.creditLimit ?? 0);
      }
      if (sort === 'creditLimit_asc') {
        return (a.creditLimit ?? 0) - (b.creditLimit ?? 0);
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 7. Pagination
    const total = processed.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = processed.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Error in queryCustomers:', error);
    throw new Error('Database Error: Failed to retrieve customers list.');
  }
}

/**
 * BULK ACTIONS
 */

/**
 * Bulk updates the status of multiple customers.
 */
export async function bulkUpdateStatus(ids: number[], status: 'Active' | 'Inactive' | 'Blocked'): Promise<number> {
  try {
    let count = 0;
    for (const id of ids) {
      const customer = await db.customers.get(id);
      if (customer && !customer.isDeleted) {
        await db.customers.update(id, { status, updatedAt: new Date() });
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    throw new Error('Failed to update status for selected customers.');
  }
}

/**
 * Bulk soft-deletes multiple customers.
 */
export async function bulkDeleteCustomers(ids: number[]): Promise<number> {
  try {
    let count = 0;
    for (const id of ids) {
      const customer = await db.customers.get(id);
      if (customer && !customer.isDeleted) {
        await db.customers.update(id, {
          isDeleted: true,
          status: 'Inactive',
          updatedAt: new Date(),
        });
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error('Error in bulkDeleteCustomers:', error);
    throw new Error('Failed to delete selected customers.');
  }
}

/**
 * GOOGLE SHEETS SYNC PLACEHOLDERS (Future Work)
 */

/**
 * Create Customer Sync Placeholder
 */
export async function syncCustomerToGoogleSheets(customer: Customer): Promise<{ success: boolean; message: string }> {
  console.log('Google Sheets Sync Placeholder triggered for customer:', customer.fullName);
  return Promise.resolve({
    success: true,
    message: '[Placeholder] Sync connection success. Customer will auto-synchronize to Google Sheets in future releases.'
  });
}

/**
 * Create Customer Restore Placeholder
 */
export async function restoreCustomersFromGoogleSheets(): Promise<{ success: boolean; count: number; message: string }> {
  console.log('Google Sheets Restore Placeholder triggered.');
  return Promise.resolve({
    success: true,
    count: 0,
    message: '[Placeholder] Restore connection success. Google Sheets import capability is prepared.'
  });
}
