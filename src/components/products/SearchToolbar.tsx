import React from 'react';
import { Search, Trash2, CheckCircle2, XCircle, RefreshCw, Download, Upload, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import Button from '../ui/Button';
import { ExportDropdown } from '../common/PDFComponents';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIds: number[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (ids: number[], newStatus: 'Active' | 'Inactive') => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  onExport: (mode: 'download' | 'preview' | 'print') => void;
  isGenerating?: boolean;
  onImportPlaceholder: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedIds,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
  onRefresh,
  onExport,
  isGenerating = false,
  onImportPlaceholder,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
}) => {
  const hasSelection = selectedIds.length > 0;

  return (
    <div
      id="product-search-toolbar"
      className="flex flex-col gap-3.5 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm transition"
    >
      {/* Search Input, Actions & Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product name, barcode, SKU, brand, category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Filter Panel */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={onToggleFilters}
            className="text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </Button>

          {/* Import / Export Placeholder triggers */}
          <Button variant="outline" size="sm" onClick={onImportPlaceholder} className="text-xs font-bold">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          <ExportDropdown onExport={onExport} isGenerating={isGenerating} />

          {/* Manual DB Index Reload */}
          <Button variant="outline" size="sm" onClick={onRefresh} title="Reload Indexes" className="text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Conditional Bulk Actions Panel (Triggers only when selections exist) */}
      {hasSelection && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/40 dark:bg-indigo-950/25 border border-indigo-100/50 dark:border-indigo-900/30 px-4 py-3 rounded-xl animate-in fade-in-50 slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 bg-indigo-600 text-white rounded-full text-[10px] font-black">
              {selectedIds.length}
            </span>
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-300">
              items selected for batch action
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition underline underline-offset-2 ml-2"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onBulkStatusUpdate(selectedIds, 'Active')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Active</span>
            </button>
            <button
              type="button"
              onClick={() => onBulkStatusUpdate(selectedIds, 'Inactive')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition shadow-xs"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Mark Inactive</span>
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Archive Selected</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchToolbar;
