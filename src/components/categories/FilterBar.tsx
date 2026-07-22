import React from 'react';
import { Filter, X } from 'lucide-react';
import { type Category } from '../../database/db';
import { type CategoryStatusFilter } from '../../hooks/useCategoryFilter';

interface FilterBarProps {
  status: CategoryStatusFilter;
  setStatus: (status: CategoryStatusFilter) => void;
  parentCategory: string | number | null;
  setParentCategory: (parent: string | number | null) => void;
  allParents: Category[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  status,
  setStatus,
  parentCategory,
  setParentCategory,
  allParents,
  onReset,
}) => {
  const isFiltered = status !== 'All' || parentCategory !== 'all_parents';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-sm text-left">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Category Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CategoryStatusFilter)}
            className="text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
            <option value="Archived">Archived (Soft Deleted)</option>
          </select>
        </div>

        {/* Parent Category Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Parent Segment
          </label>
          <select
            value={parentCategory === null ? 'none' : String(parentCategory)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all_parents') {
                setParentCategory('all_parents');
              } else if (val === 'none') {
                setParentCategory('none');
              } else {
                setParentCategory(Number(val));
              }
            }}
            className="text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer min-w-[180px]"
          >
            <option value="all_parents">All Categories</option>
            <option value="none">Root Level Only (No Parent)</option>
            {allParents
              .filter((p) => p.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  Sub-categories of {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Reset Button */}
      {isFiltered && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-950/30 transition-all cursor-pointer w-fit sm:mt-4"
        >
          <X className="h-3.5 w-3.5" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;
