import { useState, useEffect, useCallback } from 'react';
import { querySales, deleteSale, restoreSale } from '../database/salesHelper';
import { type Sale, type SaleItem } from '../database/db';

export interface UseSalesParams {
  searchQuery?: string;
  customerId?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  saleType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export function useSales(params: UseSalesParams) {
  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await querySales({
        searchQuery: params.searchQuery,
        customerId: params.customerId,
        paymentStatus: params.paymentStatus,
        paymentMethod: params.paymentMethod,
        saleType: params.saleType,
        startDate: params.startDate,
        endDate: params.endDate,
        sortBy: params.sortBy,
        page: params.page,
        pageSize: params.pageSize,
      });

      setSales(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Error fetching sales history list:', err);
      setError(err.message || 'Failed to load sales history records.');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.searchQuery,
    params.customerId,
    params.paymentStatus,
    params.paymentMethod,
    params.saleType,
    params.startDate,
    params.endDate,
    params.sortBy,
    params.page,
    params.pageSize,
  ]);

  // Refetch when dependencies change
  useEffect(() => {
    fetchSalesList();
  }, [fetchSalesList]);

  // Soft delete wrapper
  const softDelete = async (id: number) => {
    try {
      await deleteSale(id);
      await fetchSalesList();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete sale transaction.');
    }
  };

  // Restore wrapper
  const restore = async (id: number) => {
    try {
      await restoreSale(id);
      await fetchSalesList();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to restore sale transaction.');
    }
  };

  return {
    sales,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchSalesList,
    softDelete,
    restore,
  };
}

export default useSales;
