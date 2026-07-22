import { useState, useCallback } from 'react';

export type CategoryStatusFilter = 'Active' | 'Inactive' | 'Archived' | 'All';

/**
 * Hook to manage category filtering states.
 */
export function useCategoryFilter() {
  const [status, setStatus] = useState<CategoryStatusFilter>('All');
  const [parentCategory, setParentCategory] = useState<string | number | null>('all_parents');

  const resetFilters = useCallback(() => {
    setStatus('All');
    setParentCategory('all_parents');
  }, []);

  return {
    status,
    setStatus,
    parentCategory,
    setParentCategory,
    resetFilters,
  };
}

export default useCategoryFilter;
