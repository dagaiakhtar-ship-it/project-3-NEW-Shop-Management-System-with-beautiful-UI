import { useState, useEffect, useCallback } from 'react';
import { type Category } from '../database/db';
import {
  queryCategories,
  deleteCategory,
  restoreCategory,
  bulkDeleteCategories,
  bulkUpdateCategoryStatus,
  getAllCategories,
} from '../database/categoryHelper';
import { type CategoryStatusFilter } from './useCategoryFilter';
import { type CategorySortOption } from './useCategorySort';

export interface UseCategoriesParams {
  searchQuery?: string;
  status?: CategoryStatusFilter;
  parentCategory?: string | number | null;
  sortBy?: CategorySortOption;
  page?: number;
  pageSize?: number;
}

/**
 * Main hook to manage the list, query state, pagination, and mutations of categories.
 */
export function useCategories(params: UseCategoriesParams = {}) {
  const [categories, setCategories] = useState<(Category & { productCount: number })[]>([]);
  const [allParents, setAllParents] = useState<Category[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    status = 'All',
    parentCategory = 'all_parents',
    sortBy = 'display_order',
    page = 1,
    pageSize = 10,
  } = params;

  // Fetch only eligible parent categories (typically, Active categories with no parent themselves, or any active/inactive non-archived categories)
  const fetchParentCandidates = useCallback(async () => {
    try {
      const list = await getAllCategories(false); // Exclude archived
      setAllParents(list);
    } catch (err) {
      console.error('Failed to load parent category list', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Map 'all_parents' UI string value to undefined for the query helper
      const parentFilter =
        parentCategory === 'all_parents'
          ? undefined
          : parentCategory === 'none'
          ? null
          : parentCategory;

      const result = await queryCategories({
        searchQuery,
        status,
        parentCategory: parentFilter,
        sortBy,
        page,
        pageSize,
      });

      setCategories(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to query categories.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, status, parentCategory, sortBy, page, pageSize]);

  // Load and refresh
  useEffect(() => {
    fetchCategories();
    fetchParentCandidates();
  }, [fetchCategories, fetchParentCandidates]);

  // CRUD operation wrappers that trigger automatic refetch
  const softDelete = useCallback(async (id: number) => {
    try {
      await deleteCategory(id);
      await fetchCategories();
      await fetchParentCandidates();
    } catch (err: any) {
      setError(err.message || 'Deletion failed.');
      throw err;
    }
  }, [fetchCategories, fetchParentCandidates]);

  const restore = useCallback(async (id: number) => {
    try {
      await restoreCategory(id);
      await fetchCategories();
      await fetchParentCandidates();
    } catch (err: any) {
      setError(err.message || 'Restoration failed.');
      throw err;
    }
  }, [fetchCategories, fetchParentCandidates]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    try {
      await bulkDeleteCategories(ids);
      await fetchCategories();
      await fetchParentCandidates();
    } catch (err: any) {
      setError(err.message || 'Bulk deletion failed.');
      throw err;
    }
  }, [fetchCategories, fetchParentCandidates]);

  const bulkStatusUpdate = useCallback(async (ids: number[], newStatus: 'Active' | 'Inactive' | 'Archived') => {
    try {
      await bulkUpdateCategoryStatus(ids, newStatus);
      await fetchCategories();
      await fetchParentCandidates();
    } catch (err: any) {
      setError(err.message || 'Bulk status update failed.');
      throw err;
    }
  }, [fetchCategories, fetchParentCandidates]);

  return {
    categories,
    allParents,
    total,
    totalPages,
    isLoading,
    error,
    refetch: fetchCategories,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  };
}

export default useCategories;
