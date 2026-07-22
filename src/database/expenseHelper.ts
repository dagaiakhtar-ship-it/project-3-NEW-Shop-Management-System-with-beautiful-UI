import { db, type Expense, type ExpenseCategory } from './db';

/**
 * Generates the next sequential unique Expense Number.
 * Format: EXP-000001, EXP-000002...
 */
export async function generateExpenseNumber(): Promise<string> {
  const lastExpense = await db.expenses.orderBy('id').last();
  if (!lastExpense || !lastExpense.expenseNumber) {
    return 'EXP-000001';
  }
  const match = lastExpense.expenseNumber.match(/EXP-(\d+)/);
  if (!match) {
    return 'EXP-000001';
  }
  const nextNum = parseInt(match[1], 10) + 1;
  return `EXP-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Generates a collision-proof sequential unique Expense Number.
 */
export async function generateSafeExpenseNumber(): Promise<string> {
  let num = await generateExpenseNumber();
  let attempts = 0;
  while (attempts < 100) {
    const existing = await db.expenses.where('expenseNumber').equals(num).first();
    if (!existing) {
      return num;
    }
    const match = num.match(/EXP-(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    num = `EXP-${String(nextNum).padStart(6, '0')}`;
    attempts++;
  }
  return num;
}

/**
 * Fetches a single expense record by ID.
 */
export async function getExpense(id: number): Promise<Expense | undefined> {
  return await db.expenses.get(id);
}

/**
 * Creates a new expense in the database with validation.
 */
export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseNumber'>): Promise<number> {
  if (!expense.title || expense.title.trim() === '') {
    throw new Error('Expense Title is required.');
  }
  if (!expense.amount || expense.amount <= 0) {
    throw new Error('Expense Amount must be greater than zero.');
  }
  if (!expense.categoryId) {
    throw new Error('Expense Category is required.');
  }
  if (!expense.expenseDate) {
    throw new Error('Expense Date is required.');
  }
  if (!expense.paymentMethod) {
    throw new Error('Payment Method is required.');
  }

  const expenseNumber = await generateSafeExpenseNumber();
  const categoryRec = await db.expenseCategories.get(expense.categoryId);
  const categoryName = categoryRec ? categoryRec.name : 'Miscellaneous';

  const newExpense: Expense = {
    ...expense,
    expenseNumber,
    category: categoryName, // Compatibility string
    status: expense.status || 'Paid',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await db.expenses.add(newExpense);
}

/**
 * Updates an existing expense.
 */
export async function updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
  const existing = await db.expenses.get(id);
  if (!existing) {
    throw new Error(`Expense with ID ${id} not found.`);
  }

  let categoryName = existing.category;
  if (updates.categoryId && updates.categoryId !== existing.categoryId) {
    const categoryRec = await db.expenseCategories.get(updates.categoryId);
    categoryName = categoryRec ? categoryRec.name : 'Miscellaneous';
  }

  const finalUpdates = {
    ...updates,
    category: categoryName,
    updatedAt: new Date(),
  };

  await db.expenses.update(id, finalUpdates);
}

/**
 * Soft deletes an expense.
 */
export async function deleteExpense(id: number): Promise<void> {
  const existing = await db.expenses.get(id);
  if (!existing) {
    throw new Error(`Expense with ID ${id} not found.`);
  }
  await db.expenses.update(id, { isDeleted: true, updatedAt: new Date() });
}

/**
 * Restores a soft-deleted expense.
 */
export async function restoreExpense(id: number): Promise<void> {
  const existing = await db.expenses.get(id);
  if (!existing) {
    throw new Error(`Expense with ID ${id} not found.`);
  }
  await db.expenses.update(id, { isDeleted: false, updatedAt: new Date() });
}

/**
 * Duplicates an existing expense with a brand new Expense Number.
 */
export async function duplicateExpense(id: number): Promise<number> {
  const existing = await db.expenses.get(id);
  if (!existing) {
    throw new Error(`Expense with ID ${id} not found.`);
  }

  const nextNumber = await generateSafeExpenseNumber();
  const duplicated: Expense = {
    ...existing,
    id: undefined, // Let Dexie generate a new auto-increment ID
    expenseNumber: nextNumber,
    expenseDate: new Date(), // Set to today's date
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await db.expenses.add(duplicated);
}

/**
 * Performs bulk soft-deletion of expenses.
 */
export async function bulkDeleteExpenses(ids: number[]): Promise<void> {
  await Promise.all(
    ids.map(id => db.expenses.update(id, { isDeleted: true, updatedAt: new Date() }))
  );
}

/**
 * Performs bulk category update on expenses.
 */
export async function bulkUpdateExpenseCategory(ids: number[], categoryId: number): Promise<void> {
  const categoryRec = await db.expenseCategories.get(categoryId);
  const categoryName = categoryRec ? categoryRec.name : 'Miscellaneous';

  await Promise.all(
    ids.map(id => db.expenses.update(id, { categoryId, category: categoryName, updatedAt: new Date() }))
  );
}

/**
 * Performs bulk status update on expenses.
 */
export async function bulkUpdateExpenseStatus(ids: number[], status: 'Paid' | 'Pending' | 'Voided'): Promise<void> {
  await Promise.all(
    ids.map(id => db.expenses.update(id, { status, updatedAt: new Date() }))
  );
}

/**
 * Check and generate recurring expense reminders as notifications/alerts.
 * This identifies recurring expenses where nextRecurringDate is in the past or is today,
 * but does not auto-create the expense (Only notifies according to business rules).
 */
export interface RecurringReminder {
  expenseId: number;
  title: string;
  amount: number;
  recurringType: string;
  nextRecurringDate: Date;
  daysRemaining: number;
}

export async function checkRecurringReminders(): Promise<RecurringReminder[]> {
  const expenses = await db.expenses.where('isRecurring').equals(1).toArray(); // Dexie boolean search or filter
  const allExpenses = await db.expenses.toArray();
  const activeRecurring = allExpenses.filter(e => e.isRecurring && !e.isDeleted);
  
  const reminders: RecurringReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  activeRecurring.forEach(e => {
    if (!e.nextRecurringDate) return;
    const nextDate = new Date(e.nextRecurringDate);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Notify if next billing date is within 7 days or is overdue
    if (diffDays <= 7) {
      reminders.push({
        expenseId: e.id!,
        title: e.title,
        amount: e.amount,
        recurringType: e.recurringType || 'Monthly',
        nextRecurringDate: nextDate,
        daysRemaining: diffDays,
      });
    }
  });

  return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Google Sheets Synchronization Placeholders (Offline Sandbox Requirements)
 */
export async function syncExpensesToSheetsPlaceholder(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Sandbox Sheets Sync: 12 expenses exported successfully to Google Sheets spreadsheet.',
      });
    }, 600);
  });
}

export async function syncCategoriesToSheetsPlaceholder(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Sandbox Sheets Sync: Expense categories structure backup completed.',
      });
    }, 400);
  });
}

export async function syncRecurringToSheetsPlaceholder(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Sandbox Sheets Sync: Recurring schedules and active reminder parameters backup completed.',
      });
    }, 400);
  });
}
