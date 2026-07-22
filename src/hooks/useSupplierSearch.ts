import { useState, useEffect } from 'react';

export function useSupplierSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

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
