import { useState, useCallback } from 'react';
import {
  getSupplierById,
  addSupplier,
  updateSupplier,
  duplicateSupplier as dbDuplicateSupplier,
} from '../database/supplierHelper';
import { type Supplier } from '../database/db';

export function useSupplier() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSupplierById(id);
      if (!data) {
        throw new Error('Supplier not found.');
      }
      setSupplier(data);
    } catch (err: any) {
      console.error('Error fetching supplier:', err);
      setError(err.message || 'Failed to retrieve supplier.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSup = await addSupplier(supplierData);
      setSupplier(newSup);
      return newSup;
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExistingSupplier = async (id: number, supplierData: Partial<Supplier>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateSupplier(id, supplierData);
      setSupplier(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update supplier.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateExistingSupplier = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const duplicated = await dbDuplicateSupplier(id);
      setSupplier(duplicated);
      return duplicated;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate supplier.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    supplier,
    isLoading,
    error,
    fetchSupplier,
    createNewSupplier,
    updateExistingSupplier,
    duplicateExistingSupplier,
  };
}
export default useSupplier;
