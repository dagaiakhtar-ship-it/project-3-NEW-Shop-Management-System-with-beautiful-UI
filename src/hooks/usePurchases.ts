import { useState, useEffect, useCallback } from 'react';
import { queryPurchases, deletePurchase, restorePurchase } from '../database/purchaseHelper';
import { type Purchase } from '../database/db';

interface UsePurchasesParams {
  searchQuery?: string;
  supplierId?: number | string | null;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid' | 'All';
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  status?: 'Active' | 'Archived' | 'All';
  sortBy?: 'newest' | 'oldest' | 'grandTotal_desc' | 'grandTotal_asc' | 'purchaseNumber_asc' | 'purchaseNumber_desc' | 'supplierName_asc';
  page?: number;
  pageSize?: number;
}

export function usePurchases(params: UsePurchasesParams) {
  const [purchases, setPurchases] = useState<(Purchase & { supplierName: string; itemCount: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchasesList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryPurchases({
        searchQuery: params.searchQuery,
        supplierId: params.supplierId,
        paymentStatus: params.paymentStatus,
        paymentMethod: params.paymentMethod,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
        sortBy: params.sortBy,
        page: params.page,
        pageSize: params.pageSize,
      });

      setPurchases(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Error fetching purchases list:', err);
      setError(err.message || 'Failed to query purchases database.');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.searchQuery,
    params.supplierId,
    params.paymentStatus,
    params.paymentMethod,
    params.startDate,
    params.endDate,
    params.status,
    params.sortBy,
    params.page,
    params.pageSize,
  ]);

  useEffect(() => {
    fetchPurchasesList();
  }, [fetchPurchasesList]);

  // Soft delete (archive) a purchase
  const softDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await deletePurchase(id);
      await fetchPurchasesList();
    } catch (err: any) {
      setError(err.message || 'Failed to archive purchase.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Restore an archived purchase
  const restore = async (id: number) => {
    setIsLoading(true);
    try {
      await restorePurchase(id);
      await fetchPurchasesList();
    } catch (err: any) {
      setError(err.message || 'Failed to restore purchase.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchases,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchPurchasesList,
    softDelete,
    restore,
  };
}

export default usePurchases;
