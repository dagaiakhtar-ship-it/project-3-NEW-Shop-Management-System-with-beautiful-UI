import React from 'react';
import CategoryFilter, { CategoryItem } from './CategoryFilter';

export interface Category {
  id: string | number;
  name: string;
}

interface CategoryBarProps {
  categories?: Category[];
  activeCategoryId?: string | number;
  onChange?: (categoryId: string | number) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'All', name: 'All' },
  { id: 'Grocery', name: 'Grocery' },
  { id: 'Beverages', name: 'Beverages' },
  { id: 'Snacks', name: 'Snacks' },
  { id: 'Frozen', name: 'Frozen' },
  { id: 'Dairy', name: 'Dairy' },
  { id: 'Bakery', name: 'Bakery' },
  { id: 'Stationery', name: 'Stationery' },
  { id: 'Medicine', name: 'Medicine' },
  { id: 'Cosmetics', name: 'Cosmetics' },
  { id: 'Electronics', name: 'Electronics' },
  { id: 'Household', name: 'Household' },
  { id: 'Vegetables', name: 'Vegetables' },
  { id: 'Fruits', name: 'Fruits' },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories = DEFAULT_CATEGORIES,
  activeCategoryId = 'All',
  onChange,
}) => {
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <CategoryFilter
      categories={displayCategories as CategoryItem[]}
      activeCategoryId={activeCategoryId}
      onChange={onChange || (() => {})}
    />
  );
};

export default React.memo(CategoryBar);
