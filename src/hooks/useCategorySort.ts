import { useState } from 'react';

export type CategorySortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'display_order';

/**
 * Hook to manage category sorting selection.
 */
export function useCategorySort(initialSort: CategorySortOption = 'display_order') {
  const [sortBy, setSortBy] = useState<CategorySortOption>(initialSort);

  return {
    sortBy,
    setSortBy,
  };
}

export default useCategorySort;
