import { useState, useEffect, useCallback } from 'react';
import { db, type Product, type Category } from '../database/db';

export interface LowStockProduct extends Product {
  categoryName: string;
}

/**
 * Custom hook to retrieve products with critically low stock or out-of-stock from IndexedDB.
 */
export function useLowStock() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLowStock = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all products to filter locally (since alertQuantity is dynamic and relative)
      const allProducts = await db.products.toArray();
      const lowStockList = allProducts.filter((p) => p.stock <= p.alertQuantity);

      // Join with categories for better details
      const categoryIds = Array.from(new Set(lowStockList.map((p) => p.categoryId))) as number[];
      const categories = await db.categories.where('id').anyOf(categoryIds).toArray();
      const categoryMap = new Map<number, string>();
      categories.forEach((c) => {
        if (c.id) categoryMap.set(c.id, c.name);
      });

      const processedProducts: LowStockProduct[] = lowStockList.map((p) => ({
        ...p,
        categoryName: categoryMap.get(p.categoryId) || 'General',
      }));

      // Sort: Out of stock first, then lowest stock level
      processedProducts.sort((a, b) => {
        if (a.stock === 0 && b.stock > 0) return -1;
        if (b.stock === 0 && a.stock > 0) return 1;
        return a.stock - b.stock;
      });

      setProducts(processedProducts);
    } catch (err: any) {
      console.error('Error in useLowStock:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchLowStock,
  };
}
