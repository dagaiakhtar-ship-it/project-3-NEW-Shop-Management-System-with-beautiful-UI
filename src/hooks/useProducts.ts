import { useState, useEffect, useCallback } from 'react';
import {
  queryProducts,
  deleteProduct,
  restoreProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
} from '../database/productHelper';
import { type Product } from '../database/db';
import { type ProductSortBy } from './useProductSort';

interface UseProductsParams {
  searchQuery?: string;
  categoryId?: number | 'all';
  status?: 'Active' | 'Inactive' | 'Archived' | 'All';
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out Of Stock' | 'All';
  brand?: string;
  sortBy?: ProductSortBy;
  page?: number;
  pageSize?: number;
}

export function useProducts(params: UseProductsParams) {
  const [products, setProducts] = useState<(Product & { categoryName: string; stockStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock' })[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryProducts({
        searchQuery: params.searchQuery,
        categoryId: params.categoryId,
        status: params.status,
        stockStatus: params.stockStatus,
        brand: params.brand,
        sortBy: params.sortBy,
        page: params.page,
        pageSize: params.pageSize,
      });

      setProducts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setBrands(result.brands);
    } catch (err: any) {
      console.error('Error in useProducts hook:', err);
      setError(err.message || 'Failed to fetch products.');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.searchQuery,
    params.categoryId,
    params.status,
    params.stockStatus,
    params.brand,
    params.sortBy,
    params.page,
    params.pageSize,
  ]);

  // Refetch when dependencies change
  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Soft delete a single product
  const softDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      await fetchProductsList();
    } catch (err: any) {
      throw new Error(err.message || 'Archiving failed.');
    }
  };

  // Restore a soft deleted product
  const restore = async (id: number) => {
    try {
      await restoreProduct(id);
      await fetchProductsList();
    } catch (err: any) {
      throw new Error(err.message || 'Restoration failed.');
    }
  };

  // Bulk delete (archive) products
  const bulkDelete = async (ids: number[]) => {
    try {
      await bulkDeleteProducts(ids);
      await fetchProductsList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk delete failed.');
    }
  };

  // Bulk status update
  const bulkStatusUpdate = async (ids: number[], newStatus: 'Active' | 'Inactive') => {
    try {
      await bulkUpdateProductStatus(ids, newStatus);
      await fetchProductsList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk status update failed.');
    }
  };

  return {
    products,
    brands,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchProductsList,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  };
}
