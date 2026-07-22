import { useState, useEffect } from 'react';

/**
 * Hook to manage category search query and debounce it.
 */
export function useCategorySearch(initialQuery = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250); // Fast responsive instant search

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
  };
}

export default useCategorySearch;
