import { useState } from 'react';

export type CustomerSortBy =
  | 'fullName_asc'
  | 'fullName_desc'
  | 'newest'
  | 'oldest'
  | 'currentBalance_desc'
  | 'currentBalance_asc'
  | 'creditLimit_desc'
  | 'creditLimit_asc';

export function useCustomerSort() {
  const [sortBy, setSortBy] = useState<CustomerSortBy>('newest');

  return {
    sortBy,
    setSortBy,
  };
}

export default useCustomerSort;
