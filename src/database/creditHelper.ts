import { db, type CreditAccount, type CreditPayment, type Customer, type Sale } from './db';

/**
 * Creates a Credit Account record for a specific credit/partial invoice transaction.
 */
export async function createCreditAccount(
  customerId: number,
  invoiceId: number,
  invoiceNumber: string,
  invoiceDate: Date | string,
  invoiceAmount: number,
  paidAmount: number,
  remainingAmount: number,
  notes: string = '',
  dueDate?: Date | string
): Promise<number> {
  const finalDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days due

  const newAccount: CreditAccount = {
    customerId,
    invoiceId,
    invoiceNumber,
    invoiceDate: new Date(invoiceDate),
    invoiceAmount,
    paidAmount,
    remainingAmount,
    status: remainingAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
    dueDate: new Date(finalDueDate),
    notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const id = await db.creditAccounts.add(newAccount);

  // Update customer's general balance
  await updateCustomerBalance(customerId);

  return id;
}

/**
 * Re-calculates and updates the total outstanding credit balance for a customer.
 * Gets openingBalance + sum of remaining credit from active credit accounts - advance payments.
 */
export async function updateCustomerBalance(customerId: number): Promise<number> {
  const customer = await db.customers.get(customerId);
  if (!customer) return 0;

  // Sum up all active credit accounts for this customer
  const activeAccounts = await db.creditAccounts
    .where('customerId')
    .equals(customerId)
    .toArray();

  const unpaidInvoicesRemaining = activeAccounts
    .filter((acc) => acc.status !== 'Paid' && acc.status !== 'Cancelled')
    .reduce((sum, acc) => sum + (acc.remainingAmount ?? 0), 0);

  // Sum up unallocated/advance payments
  const allPayments = await db.creditPayments
    .where('customerId')
    .equals(customerId)
    .toArray();

  const advancePaymentsSum = allPayments
    .filter((p) => !p.creditAccountId)
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const openingBal = customer.openingBalance ?? 0;
  const currentBal = Math.max(0, openingBal + unpaidInvoicesRemaining - advancePaymentsSum);

  await db.customers.update(customerId, {
    currentBalance: currentBal,
    balance: currentBal, // compatibility
    updatedAt: new Date(),
  });

  return currentBal;
}

/**
 * Submits a new customer credit payment. Supports oldest-first auto-allocation
 * or manual allocation to a selection of outstanding credit accounts.
 */
export async function receiveCreditPayment(params: {
  customerId: number;
  totalAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  receivedBy?: string;
  allocationType: 'auto' | 'manual';
  manualAllocations?: Array<{ creditAccountId: number; amount: number }>;
}): Promise<{ success: boolean; paymentIds: number[]; message: string }> {
  if (!params.customerId) {
    throw new Error('A customer must be selected to receive credit payment.');
  }
  if (params.totalAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const customer = await db.customers.get(params.customerId);
  if (!customer) {
    throw new Error('Selected customer was not found in the database.');
  }

  const paymentIds: number[] = [];

  // Run inside Dexie transaction
  await db.transaction('rw', [db.creditAccounts, db.creditPayments, db.customers, db.sales], async () => {
    const outstandingInvoices = await db.creditAccounts
      .where('customerId')
      .equals(params.customerId)
      .toArray();

    // Filter out paid or cancelled credit accounts
    const activeCreditInvoices = outstandingInvoices.filter(
      (acc) => acc.status !== 'Paid' && acc.status !== 'Cancelled'
    );

    let remainingPayment = params.totalAmount;

    if (params.allocationType === 'manual' && params.manualAllocations) {
      // Validate allocations sum
      const totalAllocated = params.manualAllocations.reduce((sum, item) => sum + item.amount, 0);
      if (Math.abs(totalAllocated - params.totalAmount) > 0.01) {
        throw new Error('Manual allocation amounts must sum exactly to the total paid amount.');
      }

      // Process manual allocations
      for (const alloc of params.manualAllocations) {
        const acc = await db.creditAccounts.get(alloc.creditAccountId);
        if (!acc) continue;

        const maxRem = acc.remainingAmount ?? 0;
        const allocAmt = Math.min(alloc.amount, maxRem);
        if (allocAmt <= 0) continue;

        const newPaid = (acc.paidAmount ?? 0) + allocAmt;
        const newRem = Math.max(0, (acc.invoiceAmount ?? 0) - newPaid);
        const newStatus = newRem <= 0 ? 'Paid' : 'Partial';

        await db.creditAccounts.update(acc.id!, {
          paidAmount: newPaid,
          remainingAmount: newRem,
          status: newStatus,
          updatedAt: new Date(),
        });

        // Also update corresponding Sale payment details (for invoice ledger alignment)
        if (acc.invoiceId) {
          const sale = await db.sales.get(acc.invoiceId);
          if (sale) {
            const salePaid = sale.paidAmount + allocAmt;
            const saleRem = Math.max(0, (sale.grandTotal ?? sale.total ?? 0) - salePaid);
            const saleStatus = saleRem <= 0 ? 'Paid' : 'Partial';
            await db.sales.update(acc.invoiceId, {
              paidAmount: salePaid,
              remainingAmount: saleRem,
              paymentStatus: saleStatus,
              updatedAt: new Date(),
            });
          }
        }

        // Add payment record
        const pId = await db.creditPayments.add({
          creditAccountId: acc.id,
          customerId: params.customerId,
          invoiceId: acc.invoiceId,
          paymentDate: new Date(),
          paymentMethod: params.paymentMethod,
          amount: allocAmt,
          referenceNumber: params.referenceNumber || '',
          referenceNo: params.referenceNumber || '', // compatibility
          notes: params.notes || '',
          receivedBy: params.receivedBy || 'Cashier',
          createdAt: new Date(),
        });
        paymentIds.push(pId);
      }
    } else {
      // Auto-allocation (Oldest outstanding credit invoice first)
      const sortedInvoices = activeCreditInvoices.sort((a, b) => {
        const dateA = new Date(a.invoiceDate || a.createdAt).getTime();
        const dateB = new Date(b.invoiceDate || b.createdAt).getTime();
        return dateA - dateB;
      });

      for (const acc of sortedInvoices) {
        if (remainingPayment <= 0) break;

        const outstanding = acc.remainingAmount ?? 0;
        if (outstanding <= 0) continue;

        const allocAmt = Math.min(remainingPayment, outstanding);
        remainingPayment -= allocAmt;

        const newPaid = (acc.paidAmount ?? 0) + allocAmt;
        const newRem = Math.max(0, (acc.invoiceAmount ?? 0) - newPaid);
        const newStatus = newRem <= 0 ? 'Paid' : 'Partial';

        await db.creditAccounts.update(acc.id!, {
          paidAmount: newPaid,
          remainingAmount: newRem,
          status: newStatus,
          updatedAt: new Date(),
        });

        // Update corresponding Sale invoice alignment
        if (acc.invoiceId) {
          const sale = await db.sales.get(acc.invoiceId);
          if (sale) {
            const salePaid = sale.paidAmount + allocAmt;
            const saleRem = Math.max(0, (sale.grandTotal ?? sale.total ?? 0) - salePaid);
            const saleStatus = saleRem <= 0 ? 'Paid' : 'Partial';
            await db.sales.update(acc.invoiceId, {
              paidAmount: salePaid,
              remainingAmount: saleRem,
              paymentStatus: saleStatus,
              updatedAt: new Date(),
            });
          }
        }

        // Save Credit payment log
        const pId = await db.creditPayments.add({
          creditAccountId: acc.id,
          customerId: params.customerId,
          invoiceId: acc.invoiceId,
          paymentDate: new Date(),
          paymentMethod: params.paymentMethod,
          amount: allocAmt,
          referenceNumber: params.referenceNumber || '',
          referenceNo: params.referenceNumber || '',
          notes: params.notes || '',
          receivedBy: params.receivedBy || 'Cashier',
          createdAt: new Date(),
        });
        paymentIds.push(pId);
      }

      // If there's still money left, it's an Advance Payment!
      if (remainingPayment > 0.01) {
        // Save as an Advance credit payment (not tied to specific invoice account)
        const pId = await db.creditPayments.add({
          customerId: params.customerId,
          paymentDate: new Date(),
          paymentMethod: params.paymentMethod,
          amount: remainingPayment,
          referenceNumber: params.referenceNumber || '',
          referenceNo: params.referenceNumber || '',
          notes: `${params.notes || ''} (Advance Payment / Account Credit)`.trim(),
          receivedBy: params.receivedBy || 'Cashier',
          createdAt: new Date(),
        });
        paymentIds.push(pId);
      }
    }

    // Re-sync final customer balance
    await updateCustomerBalance(params.customerId);
  });

  return {
    success: true,
    paymentIds,
    message: 'Customer payment received and allocated successfully.',
  };
}

/**
 * Reverses (voids / deletes) a payment. Re-adjusts outstanding invoice balances
 * and customer credit balances accordingly.
 */
export async function reverseCreditPayment(paymentId: number): Promise<boolean> {
  const payment = await db.creditPayments.get(paymentId);
  if (!payment) {
    throw new Error('Credit payment record not found.');
  }

  await db.transaction('rw', [db.creditAccounts, db.creditPayments, db.customers, db.sales], async () => {
    // 1. Delete payment record
    await db.creditPayments.delete(paymentId);

    // 2. Revert invoice outstanding if payment was linked to a specific creditAccount
    if (payment.creditAccountId) {
      const acc = await db.creditAccounts.get(payment.creditAccountId);
      if (acc) {
        const newPaid = Math.max(0, (acc.paidAmount ?? 0) - payment.amount);
        const newRem = (acc.invoiceAmount ?? 0) - newPaid;
        const newStatus = newRem <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

        await db.creditAccounts.update(payment.creditAccountId, {
          paidAmount: newPaid,
          remainingAmount: newRem,
          status: newStatus,
          updatedAt: new Date(),
        });

        // Sync with Sale
        if (acc.invoiceId) {
          const sale = await db.sales.get(acc.invoiceId);
          if (sale) {
            const salePaid = Math.max(0, sale.paidAmount - payment.amount);
            const saleRem = (sale.grandTotal ?? sale.total ?? 0) - salePaid;
            const saleStatus = saleRem <= 0 ? 'Paid' : salePaid > 0 ? 'Partial' : 'Unpaid';

            await db.sales.update(acc.invoiceId, {
              paidAmount: salePaid,
              remainingAmount: saleRem,
              paymentStatus: saleStatus,
              updatedAt: new Date(),
            });
          }
        }
      }
    }

    // 3. Re-evaluate customer overall balance
    await updateCustomerBalance(payment.customerId);
  });

  return true;
}

/**
 * Generates the complete, chronological Customer Ledger statement.
 * Calculates opening balances, debit invoices, credit payments, adjustments, and running balance.
 */
export async function getCustomerLedger(customerId: number): Promise<{
  openingBalance: number;
  ledgerEntries: Array<{
    date: Date;
    reference: string;
    description: string;
    type: 'Debit' | 'Credit' | 'Opening' | 'Adjustment';
    debit: number;
    credit: number;
    balance: number;
    notes?: string;
  }>;
  closingBalance: number;
}> {
  const customer = await db.customers.get(customerId);
  if (!customer) {
    throw new Error('Customer not found.');
  }

  const openingBalance = customer.openingBalance ?? 0;

  // 1. Fetch Sales (Debits)
  const sales = await db.sales
    .where('customerId')
    .equals(customerId)
    .toArray();

  const creditSales = sales.filter((s) => !s.isDeleted && (s.saleType === 'Credit Sale' || s.saleType === 'Partial Payment Sale'));

  // 2. Fetch Credit Payments (Credits)
  const payments = await db.creditPayments
    .where('customerId')
    .equals(customerId)
    .toArray();

  // Combine into single log array
  interface RawEntry {
    date: Date;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    notes?: string;
    type: 'Debit' | 'Credit' | 'Opening' | 'Adjustment';
  }

  const rawEntries: RawEntry[] = [];

  // Add Opening Balance entry (if positive, it's a starting debit)
  if (openingBalance > 0) {
    rawEntries.push({
      date: new Date(customer.createdAt || Date.now() - 365 * 24 * 3600000), // static past date
      reference: 'OP-BAL',
      description: 'Customer Account Opening Credit Balance',
      debit: openingBalance,
      credit: 0,
      type: 'Opening',
    });
  }

  // Add Credit Sales
  creditSales.forEach((sale) => {
    // A Credit Sale represents a full invoice amount added to ledger
    rawEntries.push({
      date: new Date(sale.saleDate || sale.createdAt),
      reference: sale.invoiceNumber || sale.invoiceNo,
      description: `Invoice Checkout (${sale.saleType || 'Credit Sale'})`,
      debit: sale.grandTotal ?? sale.total ?? 0,
      credit: 0,
      notes: sale.notes,
      type: 'Debit',
    });
  });

  // Add payments (includes POS checkout downpayments and subsequent credit payments)
  payments.forEach((pay) => {
    const isDownpayment = pay.referenceNumber === 'POS-DP' || pay.referenceNo === 'POS-DP';
    rawEntries.push({
      date: new Date(pay.paymentDate || pay.createdAt),
      reference: pay.referenceNumber ? `REF-${pay.referenceNumber}` : `REC-${pay.id}`,
      description: isDownpayment ? 'Downpayment received at checkout' : `Credit Payment Received (${pay.paymentMethod})`,
      debit: 0,
      credit: pay.amount,
      notes: pay.notes,
      type: 'Credit',
    });
  });

  // Chronological sort
  rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute Running Balance
  let runningBalance = 0;
  const ledgerEntries = rawEntries.map((entry) => {
    runningBalance = runningBalance + entry.debit - entry.credit;
    return {
      ...entry,
      balance: runningBalance,
    };
  });

  return {
    openingBalance,
    ledgerEntries,
    closingBalance: runningBalance,
  };
}

/**
 * Retrieves the Credit Profile summary of a specific customer, including overdue and outstanding stats.
 */
export async function getCustomerCreditProfile(customerId: number) {
  const customer = await db.customers.get(customerId);
  if (!customer) {
    throw new Error('Customer not found.');
  }

  const creditLimit = customer.creditLimit ?? 10000.0;
  const currentBalance = customer.currentBalance ?? customer.balance ?? 0;
  const remainingLimit = Math.max(0, creditLimit - currentBalance);

  const creditAccounts = await db.creditAccounts
    .where('customerId')
    .equals(customerId)
    .toArray();

  const activeCreditAccounts = creditAccounts.filter((a) => a.status !== 'Cancelled');

  const totalInvoicesCount = activeCreditAccounts.length;
  const paidInvoicesCount = activeCreditAccounts.filter((a) => a.status === 'Paid').length;
  const partialInvoicesCount = activeCreditAccounts.filter((a) => a.status === 'Partial').length;
  const unpaidInvoicesCount = activeCreditAccounts.filter((a) => a.status === 'Unpaid').length;

  // Compute Overdue invoices count (where remainingAmount > 0 and dueDate < now)
  const today = new Date();
  const overdueInvoicesCount = activeCreditAccounts.filter((a) => {
    if (a.status === 'Paid' || a.status === 'Cancelled') return false;
    const due = a.dueDate ? new Date(a.dueDate) : null;
    return due ? due < today : false;
  }).length;

  // Sum total credit given
  const totalCreditGiven = activeCreditAccounts.reduce((sum, a) => sum + (a.invoiceAmount ?? 0), 0);

  // Sum total recovered credit
  const totalCreditRecovered = activeCreditAccounts.reduce((sum, a) => sum + (a.paidAmount ?? 0), 0);

  return {
    customer,
    creditLimit,
    currentBalance,
    remainingLimit,
    totalInvoicesCount,
    paidInvoicesCount,
    partialInvoicesCount,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    totalCreditGiven,
    totalCreditRecovered,
  };
}

/**
 * Computes global credit dashboard statistics.
 */
export async function getCreditDashboardStats() {
  const activeAccounts = await db.creditAccounts.toArray();
  const validAccounts = activeAccounts.filter((a) => a.status !== 'Cancelled');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Outstanding Credit Sum
  const outstandingCredit = validAccounts.reduce((sum, a) => sum + (a.remainingAmount ?? 0), 0);

  // 2. Total Credit Given & Recovered
  const totalCreditGiven = validAccounts.reduce((sum, a) => sum + (a.invoiceAmount ?? 0), 0);
  const recoveredCredit = validAccounts.reduce((sum, a) => sum + (a.paidAmount ?? 0), 0);

  // 3. Today's payments recovered
  const payments = await db.creditPayments.toArray();
  const todaysCollections = payments
    .filter((p) => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      return pDate >= today;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 4. Total Customers with Credit (unique customers who have non-zero remainingAmount)
  const uniqueCustomersWithCredit = new Set(
    validAccounts.filter((a) => (a.remainingAmount ?? 0) > 0).map((a) => a.customerId)
  ).size;

  // 5. Overdue and Pending Counts
  const overdueCustomersCount = new Set(
    validAccounts
      .filter((a) => {
        if (a.status === 'Paid' || a.status === 'Cancelled') return false;
        const due = a.dueDate ? new Date(a.dueDate) : null;
        return due ? due < today : false;
      })
      .map((a) => a.customerId)
  ).size;

  const pendingPaymentsCount = validAccounts.filter((a) => (a.remainingAmount ?? 0) > 0).length;

  // Reminders lists
  const reminders = {
    dueToday: validAccounts.filter((a) => {
      if (a.status === 'Paid' || a.status === 'Cancelled') return false;
      const due = a.dueDate ? new Date(a.dueDate) : null;
      if (!due) return false;
      return due.toDateString() === new Date().toDateString();
    }),
    overdue: validAccounts.filter((a) => {
      if (a.status === 'Paid' || a.status === 'Cancelled') return false;
      const due = a.dueDate ? new Date(a.dueDate) : null;
      return due ? due < today : false;
    }),
    upcoming: validAccounts.filter((a) => {
      if (a.status === 'Paid' || a.status === 'Cancelled') return false;
      const due = a.dueDate ? new Date(a.dueDate) : null;
      if (!due) return false;
      const diffTime = due.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    }),
  };

  return {
    outstandingCredit,
    recoveredCredit,
    totalCreditGiven,
    todaysCollections,
    totalCustomersWithCredit: uniqueCustomersWithCredit,
    pendingPayments: pendingPaymentsCount,
    overdueCustomers: overdueCustomersCount,
    reminders,
  };
}

/**
 * Placeholder synchronization services for Google Sheets backup as requested.
 */
export async function syncToGoogleSheetsPlaceholder() {
  console.log('[Google Sheets Sync Service - Placeholder Triggered]');
  console.log('- Syncing Active Sales data...');
  console.log('- Syncing Credit Accounts invoices tracking...');
  console.log('- Syncing Credit Payments ledger logs...');
  console.log('- Syncing Registered Customers outstanding profiles...');
  return {
    success: true,
    syncedAt: new Date(),
    message: 'Simulated Google Sheets synchronization complete.',
  };
}
