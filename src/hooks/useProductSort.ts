import { useState } from 'react';

export type ProductSortBy =
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest'
  | 'purchase_price_asc'
  | 'purchase_price_desc'
  | 'selling_price_asc'
  | 'selling_price_desc'
  | 'profit_asc'
  | 'profit_desc'
  | 'stock_asc'
  | 'stock_desc';

export function useProductSort() {
  const [sortBy, setSortBy] = useState<ProductSortBy>('newest');

  return {
    sortBy,
    setSortBy,
  };
}
