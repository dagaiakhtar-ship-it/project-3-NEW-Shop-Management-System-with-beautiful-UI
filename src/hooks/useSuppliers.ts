import { useState, useEffect, useCallback } from 'react';
import {
  querySuppliers,
  deleteSupplier,
  restoreSupplier,
  bulkDeleteSuppliers,
  bulkUpdateSupplierStatus,
} from '../database/supplierHelper';
import { type Supplier, db } from '../database/db';
import { type SupplierSortBy } from './useSupplierSort';

interface UseSuppliersParams {
  searchQuery?: string;
  status?: 'Active' | 'Inactive' | 'Archived' | 'All';
  city?: string;
  country?: string;
  paymentTerms?: string;
  sortBy?: SupplierSortBy;
  page?: number;
  pageSize?: number;
}

export function useSuppliers(params: UseSuppliersParams) {
  const [suppliers, setSuppliers] = useState<(Supplier & { purchaseCount: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter lists derived dynamically from active database entries
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [paymentTermsList, setPaymentTermsList] = useState<string[]>([]);

  const fetchSuppliersList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await querySuppliers({
        searchQuery: params.searchQuery,
        status: params.status,
        city: params.city,
        country: params.country,
        paymentTerms: params.paymentTerms,
        sortBy: params.sortBy,
        page: params.page,
        pageSize: params.pageSize,
      });

      setSuppliers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);

      // Load distinct filter options for location & billing filters
      const allEntries = await db.suppliers.filter((s) => s.status !== 'Archived').toArray();
      const uniqueCities = Array.from(new Set(allEntries.map((s) => s.city?.trim()).filter(Boolean))) as string[];
      const uniqueCountries = Array.from(new Set(allEntries.map((s) => s.country?.trim()).filter(Boolean))) as string[];
      const uniqueTerms = Array.from(new Set(allEntries.map((s) => s.paymentTerms?.trim()).filter(Boolean))) as string[];

      setCities(uniqueCities.sort());
      setCountries(uniqueCountries.sort());
      setPaymentTermsList(uniqueTerms.sort());
    } catch (err: any) {
      console.error('Error fetching suppliers list:', err);
      setError(err.message || 'Failed to query suppliers database.');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.searchQuery,
    params.status,
    params.city,
    params.country,
    params.paymentTerms,
    params.sortBy,
    params.page,
    params.pageSize,
  ]);

  // Refetch when params change
  useEffect(() => {
    fetchSuppliersList();
  }, [fetchSuppliersList]);

  // Soft delete a supplier (set Archived status)
  const softDelete = async (id: number) => {
    try {
      await deleteSupplier(id);
      await fetchSuppliersList();
    } catch (err: any) {
      throw new Error(err.message || 'Archiving failed.');
    }
  };

  // Restore supplier to Active status
  const restore = async (id: number) => {
    try {
      await restoreSupplier(id);
      await fetchSuppliersList();
    } catch (err: any) {
      throw new Error(err.message || 'Restoration failed.');
    }
  };

  // Bulk delete (archive) selection
  const bulkDelete = async (ids: number[]) => {
    try {
      await bulkDeleteSuppliers(ids);
      await fetchSuppliersList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk delete action failed.');
    }
  };

  // Bulk status update selection
  const bulkStatusUpdate = async (ids: number[], newStatus: 'Active' | 'Inactive') => {
    try {
      await bulkUpdateSupplierStatus(ids, newStatus);
      await fetchSuppliersList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk status modification failed.');
    }
  };

  return {
    suppliers,
    total,
    totalPages,
    isLoading,
    error,
    cities,
    countries,
    paymentTermsList,
    refetch: fetchSuppliersList,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  };
}
