import React from 'react';
import { Search, Grid, List, RotateCw, Sparkles, Filter } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import SearchBox from '../ui/SearchBox';
import { type CustomerSortBy } from '../../hooks/useCustomerSort';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sortBy: CustomerSortBy;
  onSortChange: (sort: CustomerSortBy) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onToggleFilters: () => void;
  showFilters: boolean;
  totalCount: number;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
  onToggleFilters,
  showFilters,
  totalCount,
}) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/80 shadow-sm">
      
      {/* Search Input Box */}
      <div className="flex-grow max-w-md">
        <SearchBox
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search code, name, phone, email, national ID..."
        />
      </div>

      {/* Control Actions & Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Sorting Dropdown */}
        <div className="w-44 select-container shrink-0">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as CustomerSortBy)}
            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="newest">Sort By: Newest First</option>
            <option value="oldest">Sort By: Oldest First</option>
            <option value="fullName_asc">Sort By: Name A-Z</option>
            <option value="fullName_desc">Sort By: Name Z-A</option>
            <option value="currentBalance_desc">Sort By: Balance High-Low</option>
            <option value="currentBalance_asc">Sort By: Balance Low-High</option>
            <option value="creditLimit_desc">Sort By: Credit Limit High-Low</option>
            <option value="creditLimit_asc">Sort By: Credit Limit Low-High</option>
          </select>
        </div>

        {/* Filters Toggle Button */}
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleFilters}
          className="flex items-center gap-1.5 h-9"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className={`p-2 h-9 w-9 flex items-center justify-center shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
          title="Refresh Directory"
        >
          <RotateCw className="h-3.5 w-3.5 text-slate-500" />
        </Button>

        {/* Visual View Mode Toggles */}
        <div className="flex items-center border border-slate-150 rounded-xl p-0.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-750'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Table View"
          >
            <List className="h-3.5 w-3.5 font-bold" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-750'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Grid View"
          >
            <Grid className="h-3.5 w-3.5 font-bold" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchToolbar;
