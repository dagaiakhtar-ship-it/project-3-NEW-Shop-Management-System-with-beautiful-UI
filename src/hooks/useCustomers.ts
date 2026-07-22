import { useState, useEffect, useCallback } from 'react';
import {
  queryCustomers,
  deleteCustomer as dbDeleteCustomer,
  restoreCustomer as dbRestoreCustomer,
  bulkDeleteCustomers as dbBulkDeleteCustomers,
  bulkUpdateStatus as dbBulkUpdateStatus,
} from '../database/customerHelper';
import { type Customer, db } from '../database/db';
import { type CustomerSortBy } from './useCustomerSort';

interface UseCustomersParams {
  searchQuery?: string;
  customerType?: string;
  status?: string;
  city?: string;
  sortBy?: CustomerSortBy;
  page?: number;
  pageSize?: number;
}

export function useCustomers(params: UseCustomersParams) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamically populated filters derived from DB
  const [cities, setCities] = useState<string[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);

  const fetchCustomersList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryCustomers({
        searchQuery: params.searchQuery,
        customerType: params.customerType,
        status: params.status,
        city: params.city,
        sortBy: params.sortBy,
        page: params.page,
        pageSize: params.pageSize,
      });

      setCustomers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);

      // Extract unique list of cities and customerTypes for filter dropdowns
      const allEntries = await db.customers.toArray();
      
      const uniqueCities = Array.from(
        new Set(allEntries.filter((c) => !c.isDeleted).map((c) => c.city?.trim()).filter(Boolean))
      ) as string[];

      const uniqueTypes = Array.from(
        new Set(allEntries.filter((c) => !c.isDeleted).map((c) => c.customerType).filter(Boolean))
      ) as string[];

      setCities(uniqueCities.sort());
      setCustomerTypes(uniqueTypes.sort());
    } catch (err: any) {
      console.error('Error in useCustomers hook:', err);
      setError(err.message || 'Failed to query customers database.');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.searchQuery,
    params.customerType,
    params.status,
    params.city,
    params.sortBy,
    params.page,
    params.pageSize,
  ]);

  // Refetch when params change
  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  // Soft delete a customer (set isDeleted = true)
  const softDelete = async (id: number) => {
    try {
      await dbDeleteCustomer(id);
      await fetchCustomersList();
    } catch (err: any) {
      throw new Error(err.message || 'Customer deletion failed.');
    }
  };

  // Restore customer (set isDeleted = false)
  const restore = async (id: number) => {
    try {
      await dbRestoreCustomer(id);
      await fetchCustomersList();
    } catch (err: any) {
      throw new Error(err.message || 'Customer restoration failed.');
    }
  };

  // Bulk delete selection
  const bulkDelete = async (ids: number[]) => {
    try {
      await dbBulkDeleteCustomers(ids);
      await fetchCustomersList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk delete action failed.');
    }
  };

  // Bulk status update
  const bulkStatusUpdate = async (ids: number[], newStatus: 'Active' | 'Inactive' | 'Blocked') => {
    try {
      await dbBulkUpdateStatus(ids, newStatus);
      await fetchCustomersList();
    } catch (err: any) {
      throw new Error(err.message || 'Bulk status modification failed.');
    }
  };

  return {
    customers,
    total,
    totalPages,
    isLoading,
    error,
    cities,
    customerTypes,
    refetch: fetchCustomersList,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  };
}

export default useCustomers;
