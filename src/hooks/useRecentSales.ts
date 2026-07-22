import { useState, useEffect, useCallback } from 'react';
import { db, type Sale, type Customer } from '../database/db';

export interface RecentSaleItem extends Sale {
  customerName: string;
  itemCount: number;
}

/**
 * Custom hook to retrieve recent sales with customer details from IndexedDB.
 */
export function useRecentSales(limit = 6) {
  const [sales, setSales] = useState<RecentSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allSales = await db.sales
        .orderBy('createdAt')
        .reverse()
        .limit(limit * 2) // Fetch slightly more to ensure filtering doesn't empty it
        .toArray();

      const customerIds = Array.from(new Set(allSales.map((s) => s.customerId).filter(Boolean))) as number[];
      const customers = await db.customers.where('id').anyOf(customerIds).toArray();
      const customerMap = new Map<number, Customer>();
      customers.forEach((c) => {
        if (c.id) customerMap.set(c.id, c);
      });

      const processedSales: RecentSaleItem[] = await Promise.all(
        allSales.map(async (sale) => {
          const items = await db.saleItems.where('saleId').equals(sale.id!).toArray();
          const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);

          return {
            ...sale,
            customerName: sale.customerId ? (customerMap.get(sale.customerId)?.name || 'Guest Customer') : 'Guest Customer',
            itemCount: totalQty,
          };
        })
      );

      setSales(processedSales.slice(0, limit));
    } catch (err: any) {
      console.error('Error in useRecentSales:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentSales();
  }, [fetchRecentSales]);

  return {
    sales,
    isLoading,
    error,
    refetch: fetchRecentSales,
  };
}
