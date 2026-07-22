import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, type CreditAccount, type CreditPayment, type Customer } from '../database/db';
import {
  getCreditDashboardStats,
  getCustomerCreditProfile,
  getCustomerLedger,
  receiveCreditPayment,
  reverseCreditPayment,
  updateCustomerBalance
} from '../database/creditHelper';
import showToast from '../utils/toast';

/**
 * Hook to manage outstanding credit accounts listing with search, filtering, sorting, and pagination.
 */
export function useCredit(filters: {
  searchQuery?: string;
  customerId?: number;
  status?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        let accounts = await db.creditAccounts.toArray();

        // 1. Filter out Cancelled/Deleted unless specifically requested
        if (filters.status === 'Cancelled') {
          accounts = accounts.filter((a) => a.status === 'Cancelled');
        } else {
          accounts = accounts.filter((a) => a.status !== 'Cancelled');
          if (filters.status && filters.status !== 'All') {
            accounts = accounts.filter((a) => a.status === filters.status);
          }
        }

        // 2. Filter by Customer ID
        if (filters.customerId && filters.customerId !== 0) {
          accounts = accounts.filter((a) => a.customerId === filters.customerId);
        }

        // 3. Search by Invoice Number or Customer Name
        const queryStr = filters.searchQuery?.trim().toLowerCase();
        if (queryStr) {
          // Fetch customer names to match in search
          const customers = await db.customers.toArray();
          const custMap = new Map(customers.map((c) => [c.id, c.fullName.toLowerCase()]));

          accounts = accounts.filter((a) => {
            const invNum = (a.invoiceNumber || '').toLowerCase();
            const custName = custMap.get(a.customerId) || '';
            return invNum.includes(queryStr) || custName.includes(queryStr);
          });
        }

        // 4. Sort
        const sort = filters.sortBy || 'newest';
        accounts.sort((a, b) => {
          const dateA = new Date(a.invoiceDate || a.createdAt).getTime();
          const dateB = new Date(b.invoiceDate || b.createdAt).getTime();

          if (sort === 'oldest') return dateA - dateB;
          if (sort === 'highest_balance') {
            return (b.remainingAmount ?? 0) - (a.remainingAmount ?? 0);
          }
          if (sort === 'lowest_balance') {
            return (a.remainingAmount ?? 0) - (b.remainingAmount ?? 0);
          }
          // Default: newest first
          return dateB - dateA;
        });

        if (!active) return;

        // Enrich with customer details
        const enriched = await Promise.all(
          accounts.map(async (acc) => {
            const customer = await db.customers.get(acc.customerId);
            return {
              ...acc,
              customerName: customer ? customer.fullName : 'Unknown Customer',
              customerPhone: customer ? customer.phone : '',
            };
          })
        );

        const totalCount = enriched.length;
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 10;
        const pages = Math.ceil(totalCount / pageSize) || 1;
        const start = (page - 1) * pageSize;
        const paginated = enriched.slice(start, start + pageSize);

        setCreditAccounts(paginated as any);
        setTotal(totalCount);
        setTotalPages(pages);
      } catch (err) {
        console.error('Error loading credit accounts:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    filters.searchQuery,
    filters.customerId,
    filters.status,
    filters.sortBy,
    filters.page,
    filters.pageSize,
    refreshTrigger,
  ]);

  return {
    creditAccounts,
    total,
    totalPages,
    isLoading,
    refetch,
  };
}

/**
 * Hook to fetch the complete chronological customer ledger.
 */
export function useCustomerLedger(customerId: number | null) {
  const [ledgerData, setLedgerData] = useState<{
    openingBalance: number;
    ledgerEntries: any[];
    closingBalance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!customerId) {
      setLedgerData(null);
      return;
    }

    let active = true;
    setIsLoading(true);

    getCustomerLedger(customerId)
      .then((res) => {
        if (active) {
          setLedgerData(res);
        }
      })
      .catch((err) => {
        console.error('Ledger calculation failed:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customerId, refreshTrigger]);

  return {
    ledgerData,
    isLoading,
    refetch,
  };
}

/**
 * Hook to compute and track the outstanding balance for any customer in real-time.
 */
export function useOutstandingBalance(customerId?: number) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const bal = await updateCustomerBalance(customerId);
      setBalance(bal);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    refetch: fetchBalance,
  };
}

/**
 * Hook to process new customer credit payment receipts.
 */
export function useReceivePayment() {
  const [isProcessing, setIsProcessing] = useState(false);

  const submitPayment = useCallback(async (params: {
    customerId: number;
    totalAmount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    receivedBy?: string;
    allocationType: 'auto' | 'manual';
    manualAllocations?: Array<{ creditAccountId: number; amount: number }>;
  }) => {
    setIsProcessing(true);
    try {
      const res = await receiveCreditPayment(params);
      showToast.success(res.message);
      return { success: true, paymentIds: res.paymentIds };
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      showToast.error(err.message || 'Payment processing failed.');
      return { success: false, paymentIds: [] };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reversePayment = useCallback(async (paymentId: number) => {
    setIsProcessing(true);
    try {
      await reverseCreditPayment(paymentId);
      showToast.success('Credit payment transaction reversed successfully.');
      return true;
    } catch (err: any) {
      console.error('Reversing payment failed:', err);
      showToast.error(err.message || 'Payment reversal failed.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    submitPayment,
    reversePayment,
    isProcessing,
  };
}

/**
 * Hook to fetch the Credit Dashboard Statistics and overdue alerts.
 */
export function useCreditSummary() {
  const [summary, setSummary] = useState<{
    outstandingCredit: number;
    recoveredCredit: number;
    totalCreditGiven: number;
    todaysCollections: number;
    totalCustomersWithCredit: number;
    pendingPayments: number;
    overdueCustomers: number;
    reminders: {
      dueToday: any[];
      overdue: any[];
      upcoming: any[];
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getCreditDashboardStats()
      .then((res) => {
        if (active) setSummary(res);
      })
      .catch((err) => {
        console.error('Failed to load credit summary:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return {
    summary,
    isLoading,
    refetch,
  };
}

/**
 * Hook to manage automatic allocation of a payment amount across outstanding customer invoices.
 */
export function usePaymentAllocation(customerId: number | null, amount: number) {
  const [outstandingInvoices, setOutstandingInvoices] = useState<CreditAccount[]>([]);
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [remainingUnallocated, setRemainingUnallocated] = useState(amount);

  // Fetch unpaid credit invoices for customer
  useEffect(() => {
    if (!customerId) {
      setOutstandingInvoices([]);
      setAllocations({});
      return;
    }

    db.creditAccounts
      .where('customerId')
      .equals(customerId)
      .toArray()
      .then((list) => {
        const unpaid = list.filter((a) => a.status !== 'Paid' && a.status !== 'Cancelled');
        // Sort oldest first
        unpaid.sort((a, b) => {
          const dateA = new Date(a.invoiceDate || a.createdAt).getTime();
          const dateB = new Date(b.invoiceDate || b.createdAt).getTime();
          return dateA - dateB;
        });
        setOutstandingInvoices(unpaid);
      });
  }, [customerId]);

  // Compute auto-allocation whenever invoices or input amount changes
  const autoAllocations = useMemo(() => {
    let remaining = amount;
    const allocMap: Record<number, number> = {};

    for (const inv of outstandingInvoices) {
      if (remaining <= 0) {
        allocMap[inv.id!] = 0;
        continue;
      }
      const dueAmt = inv.remainingAmount ?? 0;
      const allocated = Math.min(remaining, dueAmt);
      allocMap[inv.id!] = allocated;
      remaining -= allocated;
    }

    return {
      allocations: allocMap,
      unallocated: remaining,
    };
  }, [outstandingInvoices, amount]);

  return {
    outstandingInvoices,
    autoAllocations: autoAllocations.allocations,
    autoUnallocated: autoAllocations.unallocated,
    allocations,
    setAllocations,
    remainingUnallocated,
    setRemainingUnallocated,
  };
}
