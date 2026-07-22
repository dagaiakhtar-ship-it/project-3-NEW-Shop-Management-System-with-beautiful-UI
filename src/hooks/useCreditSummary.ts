import { useState, useEffect, useCallback } from 'react';
import { db, type Customer, type CreditAccount, type CreditPayment } from '../database/db';

export interface CreditSummaryItem {
  customerId: number;
  customerName: string;
  customerPhone?: string;
  outstandingBalance: number;
  creditLimit: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  status: 'Good' | 'Warning' | 'Exceeded';
}

/**
 * Custom hook to get a summary of customers with outstanding credit balances.
 */
export function useCreditSummary() {
  const [creditSummary, setCreditSummary] = useState<CreditSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCreditSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Find all customers with outstanding balances
      const allCustomers = await db.customers.toArray();
      const customersWithBalance = allCustomers.filter((customer) => (customer.balance || 0) > 0);
      
      // Find all credit accounts
      const allCreditAccounts = await db.creditAccounts.toArray();
      const creditAccountMap = new Map<number, CreditAccount>();
      allCreditAccounts.forEach((acc) => {
        creditAccountMap.set(acc.customerId, acc);
      });

      const summaries: CreditSummaryItem[] = await Promise.all(
        customersWithBalance.map(async (customer) => {
          const account = creditAccountMap.get(customer.id!);
          const creditLimit = account ? account.creditLimit : 1000.00; // Default limit if none found
          
          let lastPaymentAmount: number | undefined;
          let lastPaymentDate: Date | undefined;

          if (account && account.id) {
            const payments = await db.creditPayments
              .where('creditAccountId')
              .equals(account.id)
              .sortBy('createdAt');
            
            if (payments.length > 0) {
              const lastPayment = payments[payments.length - 1];
              lastPaymentAmount = lastPayment.amount;
              lastPaymentDate = lastPayment.createdAt;
            }
          }

          // Calculate credit usage status
          const usagePercent = (customer.balance / creditLimit) * 100;
          let status: 'Good' | 'Warning' | 'Exceeded' = 'Good';
          if (usagePercent > 100) {
            status = 'Exceeded';
          } else if (usagePercent >= 80) {
            status = 'Warning';
          }

          return {
            customerId: customer.id!,
            customerName: customer.name,
            customerPhone: customer.phone,
            outstandingBalance: customer.balance,
            creditLimit,
            lastPaymentAmount,
            lastPaymentDate,
            status,
          };
        })
      );

      // Sort by outstanding balance descending
      summaries.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

      setCreditSummary(summaries);
    } catch (err: any) {
      console.error('Error in useCreditSummary:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditSummary();
  }, [fetchCreditSummary]);

  return {
    creditSummary,
    isLoading,
    error,
    refetch: fetchCreditSummary,
  };
}
