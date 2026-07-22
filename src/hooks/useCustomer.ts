import { useState, useCallback } from 'react';
import {
  getCustomerById,
  addCustomer as dbAddCustomer,
  updateCustomer as dbUpdateCustomer,
  duplicateCustomer as dbDuplicateCustomer,
  generateNextCustomerCode as dbGenerateNextCustomerCode,
} from '../database/customerHelper';
import { type Customer } from '../database/db';

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomerById(id);
      if (!data) {
        throw new Error('Customer not found.');
      }
      setCustomer(data);
      return data;
    } catch (err: any) {
      console.error('Error fetching customer:', err);
      setError(err.message || 'Failed to retrieve customer.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewCustomer = async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'name' | 'balance'>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCust = await dbAddCustomer(customerData);
      setCustomer(newCust);
      return newCust;
    } catch (err: any) {
      setError(err.message || 'Failed to create customer.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExistingCustomer = async (id: number, customerData: Partial<Customer>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await dbUpdateCustomer(id, customerData);
      setCustomer(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update customer.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateExistingCustomer = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const duplicated = await dbDuplicateCustomer(id);
      setCustomer(duplicated);
      return duplicated;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate customer.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextCode = async () => {
    try {
      return await dbGenerateNextCustomerCode();
    } catch (err) {
      console.error('Error in generateNextCode:', err);
      return 'CUS-000001';
    }
  };

  return {
    customer,
    isLoading,
    error,
    fetchCustomer,
    createNewCustomer,
    updateExistingCustomer,
    duplicateExistingCustomer,
    generateNextCode,
  };
}

export default useCustomer;
