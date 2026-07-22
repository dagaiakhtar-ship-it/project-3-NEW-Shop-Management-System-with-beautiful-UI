/**
 * Search Helper
 * Searches an array of objects based on a query and a set of keys.
 */
export const searchCollection = <T,>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): T[] => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase().trim();

  return items.filter((item) =>
    keys.some((key) => {
      const value = item[key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    })
  );
};

/**
 * Sort Helper
 * Sorts an array of objects by field key and direction.
 */
export const sortCollection = <T,>(
  items: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let comparison = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = valA < valB ? -1 : 1;
    }

    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filter Helper
 * Filters an array of objects by matching filter fields.
 */
export const filterCollection = <T,>(
  items: T[],
  filters: Partial<Record<keyof T, any>>
): T[] => {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        return true; // Skip empty filters
      }

      const itemValue = item[key as keyof T];

      if (Array.isArray(filterValue)) {
        return filterValue.includes(itemValue);
      }

      return itemValue === filterValue;
    });
  });
};
