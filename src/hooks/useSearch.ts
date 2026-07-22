import { useState, useMemo } from 'react';

/**
 * useSearch Custom Hook
 * Provides reactive, client-side searching over any collection of data objects.
 */
export function useSearch<T>(
  initialData: T[],
  searchKeys: (keyof T)[]
) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return initialData;

    const lowerQuery = searchQuery.toLowerCase().trim();

    return initialData.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerQuery);
      });
    });
  }, [initialData, searchKeys, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    clearSearch: () => setSearchQuery(''),
  };
}

export default useSearch;
