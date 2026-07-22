import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, type Expense, type ExpenseCategory } from '../database/db';
import {
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  restoreExpense,
  duplicateExpense,
  bulkDeleteExpenses,
  bulkUpdateExpenseCategory,
  bulkUpdateExpenseStatus,
  checkRecurringReminders,
  type RecurringReminder
} from '../database/expenseHelper';

export interface UseExpensesParams {
  searchQuery?: string;
  categoryId?: number | 'all';
  paymentMethod?: string | 'all';
  status?: string | 'all';
  startDate?: string | null;
  endDate?: string | null;
  isRecurring?: boolean | 'all';
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'title';
  page?: number;
  pageSize?: number;
}

/**
 * useExpenses: Core Hook for querying, paginating, and modifying offline expenses
 */
export function useExpenses(params: UseExpensesParams = {}) {
  const {
    searchQuery = '',
    categoryId = 'all',
    paymentMethod = 'all',
    status = 'all',
    startDate = null,
    endDate = null,
    isRecurring = 'all',
    sortBy = 'newest',
    page = 1,
    pageSize = 10,
  } = params;

  const [expenses, setExpenses] = useState<(Expense & { categoryName: string; categoryColor: string; categoryIcon: string })[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpensesList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch categories for joining
      const allCategories = await db.expenseCategories.toArray();
      setCategories(allCategories);

      const categoryMap = new Map<number, ExpenseCategory>();
      allCategories.forEach(cat => {
        if (cat.id) categoryMap.set(cat.id, cat);
      });

      // 2. Fetch all expenses and filter in memory for complex offline queries
      let allExpenses = await db.expenses.toArray();

      // Filter deleted records by default (soft delete rule)
      if (status === 'Archived') {
        allExpenses = allExpenses.filter(e => !!e.isDeleted);
      } else {
        allExpenses = allExpenses.filter(e => !e.isDeleted);
      }

      // Search filters: Expense Number, Title, Vendor, Reference Number
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        allExpenses = allExpenses.filter(e => 
          (e.expenseNumber && e.expenseNumber.toLowerCase().includes(query)) ||
          (e.title && e.title.toLowerCase().includes(query)) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(query)) ||
          (e.referenceNumber && e.referenceNumber.toLowerCase().includes(query)) ||
          (e.description && e.description.toLowerCase().includes(query))
        );
      }

      // Filter by categoryId
      if (categoryId !== 'all') {
        const catId = Number(categoryId);
        allExpenses = allExpenses.filter(e => e.categoryId === catId);
      }

      // Filter by payment method
      if (paymentMethod !== 'all') {
        allExpenses = allExpenses.filter(e => e.paymentMethod === paymentMethod);
      }

      // Filter by status (skip if status is Archived since that's a deletion filter)
      if (status !== 'all' && status !== 'Archived') {
        allExpenses = allExpenses.filter(e => e.status === status);
      }

      // Filter by date range (inclusive)
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        allExpenses = allExpenses.filter(e => new Date(e.expenseDate) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        allExpenses = allExpenses.filter(e => new Date(e.expenseDate) <= end);
      }

      // Filter by recurring settings
      if (isRecurring !== 'all') {
        allExpenses = allExpenses.filter(e => !!e.isRecurring === isRecurring);
      }

      // 3. Sorting
      allExpenses.sort((a, b) => {
        const dateA = new Date(a.expenseDate).getTime();
        const dateB = new Date(b.expenseDate).getTime();

        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'highest') return b.amount - a.amount;
        if (sortBy === 'lowest') return a.amount - b.amount;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return dateB - dateA;
      });

      // 4. Pagination
      const totalCount = allExpenses.length;
      const totalPagesCount = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedExpenses = allExpenses.slice(startIndex, startIndex + pageSize);

      // Join Category details
      const joinedData = paginatedExpenses.map(exp => {
        const cat = categoryMap.get(exp.categoryId);
        return {
          ...exp,
          categoryName: cat ? cat.name : 'Miscellaneous',
          categoryColor: cat ? cat.color : 'gray',
          categoryIcon: cat ? cat.icon : 'HelpCircle',
        };
      });

      setExpenses(joinedData);
      setTotal(totalCount);
      setTotalPages(totalPagesCount);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Failed to load expense ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryId, paymentMethod, status, startDate, endDate, isRecurring, sortBy, page, pageSize]);

  useEffect(() => {
    fetchExpensesList();
  }, [fetchExpensesList]);

  // Wrappers for Actions
  const handleCreate = async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseNumber' | 'category'>) => {
    await createExpense(data);
    await fetchExpensesList();
  };

  const handleUpdate = async (id: number, updates: Partial<Expense>) => {
    await updateExpense(id, updates);
    await fetchExpensesList();
  };

  const handleSoftDelete = async (id: number) => {
    await deleteExpense(id);
    await fetchExpensesList();
  };

  const handleRestore = async (id: number) => {
    await restoreExpense(id);
    await fetchExpensesList();
  };

  const handleDuplicate = async (id: number) => {
    await duplicateExpense(id);
    await fetchExpensesList();
  };

  const handleBulkDelete = async (ids: number[]) => {
    await bulkDeleteExpenses(ids);
    await fetchExpensesList();
  };

  const handleBulkCategoryChange = async (ids: number[], catId: number) => {
    await bulkUpdateExpenseCategory(ids, catId);
    await fetchExpensesList();
  };

  const handleBulkStatusChange = async (ids: number[], newStatus: 'Paid' | 'Pending' | 'Voided') => {
    await bulkUpdateExpenseStatus(ids, newStatus);
    await fetchExpensesList();
  };

  return {
    expenses,
    categories,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchExpensesList,
    create: handleCreate,
    update: handleUpdate,
    softDelete: handleSoftDelete,
    restore: handleRestore,
    duplicate: handleDuplicate,
    bulkDelete: handleBulkDelete,
    bulkCategoryChange: handleBulkCategoryChange,
    bulkStatusChange: handleBulkStatusChange,
  };
}

/**
 * useExpense: Hook for loading and tracking a single expense
 */
export function useExpense(id: number | null) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!id) {
      setExpense(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rec = await getExpense(id);
      if (rec) {
        setExpense(rec);
      } else {
        setError(`Expense #${id} not found.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading expense.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  return {
    expense,
    isLoading,
    error,
    refetch: fetchExpense,
  };
}

/**
 * useExpenseSearch: Standalone hook to manage search queries
 */
export function useExpenseSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  return {
    searchQuery: query,
    debouncedQuery,
    setSearchQuery: setQuery,
  };
}

/**
 * Simple debounce utility hook
 */
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

/**
 * useExpenseFilter: Manages filters states
 */
export function useExpenseFilter() {
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<string | 'all'>('all');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState<boolean | 'all'>('all');

  const resetFilters = useCallback(() => {
    setCategoryId('all');
    setPaymentMethod('all');
    setStatus('all');
    setStartDate(null);
    setEndDate(null);
    setIsRecurring('all');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryId !== 'all') count++;
    if (paymentMethod !== 'all') count++;
    if (status !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (isRecurring !== 'all') count++;
    return count;
  }, [categoryId, paymentMethod, status, startDate, endDate, isRecurring]);

  return {
    categoryId,
    paymentMethod,
    status,
    startDate,
    endDate,
    isRecurring,
    setCategoryId,
    setPaymentMethod,
    setStatus,
    setStartDate,
    setEndDate,
    setIsRecurring,
    resetFilters,
    activeFilterCount,
  };
}

/**
 * useExpenseSort: Manages sorting configuration
 */
export function useExpenseSort() {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'title'>('newest');

  return {
    sortBy,
    setSortBy,
  };
}

/**
 * useRecurringExpenses: Manages recurring schedules and background reminder trigger
 */
export function useRecurringExpenses() {
  const [reminders, setReminders] = useState<RecurringReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeReminders = await checkRecurringReminders();
      setReminders(activeReminders);
    } catch (err) {
      console.error('Error running recurring reminder check:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return {
    reminders,
    isLoading,
    refetch: fetchReminders,
  };
}

/**
 * useExpenseSummary: Aggregates totals (Today, Month, Year, category breakdown)
 * for custom financial overview cards & auto-refreshing dashboard hooks
 */
export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export function useExpenseSummary() {
  const [summary, setSummary] = useState<{
    todayExpenses: number;
    monthExpenses: number;
    yearExpenses: number;
    categoryBreakdown: CategoryBreakdownItem[];
    recentExpenses: Expense[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allExpenses, allCategories] = await Promise.all([
        db.expenses.toArray(),
        db.expenseCategories.toArray(),
      ]);

      const activeExpenses = allExpenses.filter(e => !e.isDeleted);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      let todayTotal = 0;
      let monthTotal = 0;
      let yearTotal = 0;

      activeExpenses.forEach(e => {
        const date = new Date(e.expenseDate);
        const amount = Number(e.amount) || 0;

        if (date >= todayStart && date <= todayEnd) {
          todayTotal += amount;
        }
        if (date >= monthStart) {
          monthTotal += amount;
        }
        if (date >= yearStart) {
          yearTotal += amount;
        }
      });

      // Calculate category breakdown
      const categoryMap = new Map<number, ExpenseCategory>();
      allCategories.forEach(cat => {
        if (cat.id) categoryMap.set(cat.id, cat);
      });

      const breakdownMap = new Map<number, number>();
      activeExpenses.forEach(e => {
        const amt = breakdownMap.get(e.categoryId) || 0;
        breakdownMap.set(e.categoryId, amt + e.amount);
      });

      const totalSpent = Array.from(breakdownMap.values()).reduce((sum, val) => sum + val, 0);

      const categoryBreakdown: CategoryBreakdownItem[] = Array.from(breakdownMap.entries()).map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
        return {
          categoryId: catId,
          categoryName: cat ? cat.name : 'Miscellaneous',
          color: cat ? cat.color : 'gray',
          icon: cat ? cat.icon : 'HelpCircle',
          amount,
          percentage,
        };
      }).sort((a, b) => b.amount - a.amount);

      // Top 5 recent expenses
      const recentExpenses = [...activeExpenses]
        .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
        .slice(0, 5);

      setSummary({
        todayExpenses: todayTotal,
        monthExpenses: monthTotal,
        yearExpenses: yearTotal,
        categoryBreakdown,
        recentExpenses,
      });
    } catch (err) {
      console.error('Error calculating expense summary stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  return {
    summary,
    isLoading,
    refetch: calculateSummary,
  };
}
