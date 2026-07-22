import { useState, useEffect, useCallback } from 'react';
import { db, type StockHistory } from '../database/db';

export function useStockUpdate(productId?: number) {
  const [history, setHistory] = useState<(StockHistory & { productName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStockHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      let queryResult: StockHistory[] = [];
      if (productId) {
        queryResult = await db.stockHistory
          .filter((sh) => sh.productId === productId)
          .toArray();
      } else {
        queryResult = await db.stockHistory.toArray();
      }

      // Fetch products to map product name
      const products = await db.products.toArray();
      const productMap = new Map<number, string>();
      products.forEach((p) => {
        if (p.id) productMap.set(p.id, p.name);
      });

      const joined = queryResult.map((sh) => ({
        ...sh,
        productName: productMap.get(sh.productId) || 'Unknown Product',
      }));

      // Sort by newest first
      joined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(joined);
    } catch (err) {
      console.error('Error fetching stock history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStockHistory();
  }, [fetchStockHistory]);

  return {
    history,
    isLoading,
    refetch: fetchStockHistory,
  };
}

export default useStockUpdate;
