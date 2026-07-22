import { useState, useEffect, useCallback } from 'react';
import { db, type Purchase, type Supplier } from '../database/db';

export interface RecentPurchaseItem extends Purchase {
  supplierName: string;
  itemCount: number;
}

/**
 * Custom hook to retrieve recent purchases with supplier details from IndexedDB.
 */
export function useRecentPurchases(limit = 6) {
  const [purchases, setPurchases] = useState<RecentPurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentPurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allPurchases = await db.purchases
        .orderBy('createdAt')
        .reverse()
        .limit(limit * 2)
        .toArray();

      const supplierIds = Array.from(new Set(allPurchases.map((p) => p.supplierId).filter(Boolean))) as number[];
      const suppliers = await db.suppliers.where('id').anyOf(supplierIds).toArray();
      const supplierMap = new Map<number, Supplier>();
      suppliers.forEach((s) => {
        if (s.id) supplierMap.set(s.id, s);
      });

      const processedPurchases: RecentPurchaseItem[] = await Promise.all(
        allPurchases.map(async (purchase) => {
          const items = await db.purchaseItems.where('purchaseId').equals(purchase.id!).toArray();
          const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);

          return {
            ...purchase,
            supplierName: purchase.supplierId 
              ? (supplierMap.get(purchase.supplierId)?.companyName || supplierMap.get(purchase.supplierId)?.name || 'Unknown Supplier') 
              : 'Direct Vendor',
            itemCount: totalQty,
          };
        })
      );

      setPurchases(processedPurchases.slice(0, limit));
    } catch (err: any) {
      console.error('Error in useRecentPurchases:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentPurchases();
  }, [fetchRecentPurchases]);

  return {
    purchases,
    isLoading,
    error,
    refetch: fetchRecentPurchases,
  };
}
