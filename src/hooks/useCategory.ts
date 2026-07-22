import { useState, useCallback } from 'react';
import { type Category } from '../database/db';
import {
  getCategoryById,
  addCategory,
  updateCategory,
  validateCategory,
} from '../database/categoryHelper';

/**
 * Hook to manage fetching, validating, tracking changes, and saving a single category.
 */
export function useCategory(initialId?: number) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Partial<Category>>({});

  const fetchCategory = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCategoryById(id);
      if (data) {
        setCategory(data);
        setChanges({});
      } else {
        setError('Category not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load category.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setField = useCallback(<K extends keyof Category>(key: K, value: Category[K]) => {
    setChanges((prev) => {
      const updated = { ...prev, [key]: value };
      // If the modified value matches original category value, remove it from changes tracker
      if (category && category[key] === value) {
        const copy = { ...updated };
        delete copy[key];
        return copy;
      }
      return updated;
    });
  }, [category]);

  const resetChanges = useCallback(() => {
    setChanges({});
  }, []);

  const createNewCategory = useCallback(async (
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCat = await addCategory(data);
      return newCat;
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExistingCategory = useCallback(async (
    id: number,
    data: Partial<Category>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCat = await updateCategory(id, data);
      setCategory(updatedCat);
      setChanges({});
      return updatedCat;
    } catch (err: any) {
      setError(err.message || 'Failed to update category.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateDetails = useCallback(async (
    data: Partial<Category>,
    isUpdate = false,
    id?: number
  ) => {
    return await validateCategory(data, isUpdate, id);
  }, []);

  return {
    category,
    isLoading,
    error,
    changes,
    setField,
    resetChanges,
    fetchCategory,
    createNewCategory,
    updateExistingCategory,
    validateDetails,
  };
}

export default useCategory;
