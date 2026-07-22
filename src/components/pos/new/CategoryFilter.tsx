import React from 'react';

export interface CategoryItem {
  id: string | number;
  name: string;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  activeCategoryId: string | number;
  onChange: (id: string | number) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategoryId,
  onChange,
}) => {
  return (
    <div
      className="w-full overflow-x-auto scrollbar-none flex items-center gap-3 py-1 select-none scroll-smooth"
      id="pos-category-filter-container"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        // Map 'All' to 'All Products' label as specified, but preserve 'All' value for existing state filter logic
        const label = cat.id === 'All' ? 'All Products' : cat.name;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 border ${
              isActive
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs dark:bg-indigo-600 dark:border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
            }`}
            id={`category-filter-btn-${cat.id}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(CategoryFilter);
