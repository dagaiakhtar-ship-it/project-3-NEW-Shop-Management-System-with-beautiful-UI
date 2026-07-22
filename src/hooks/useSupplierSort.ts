import { useState } from 'react';

export type SupplierSortBy =
  | 'companyName_asc'
  | 'companyName_desc'
  | 'newest'
  | 'oldest'
  | 'openingBalance_asc'
  | 'openingBalance_desc'
  | 'currentBalance_asc'
  | 'currentBalance_desc';

export function useSupplierSort() {
  const [sortBy, setSortBy] = useState<SupplierSortBy>('newest');

  return {
    sortBy,
    setSortBy,
  };
}
export default useSupplierSort;
