import React, { useState } from 'react';
import { Search, RefreshCw, Layers, CheckCircle2, AlertOctagon, Trash2, X } from 'lucide-react';
import showToast from '../../utils/toast';
import { syncCategoriesToGoogleSheets } from '../../database/categoryHelper';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIds: number[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (ids: number[], status: 'Active' | 'Inactive') => void;
  onBulkDelete: (ids: number[]) => void;
  onRefresh: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedIds,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
  onRefresh,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSelection = selectedIds.length > 0;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    showToast.info('Synchronizing categories list to Google Sheets cloud backup...');
    try {
      await syncCategoriesToGoogleSheets();
      showToast.success('Google Sheets Category Backup synchronized successfully!');
      onRefresh();
    } catch (err) {
      showToast.error('Cloud synchronization failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Search and Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4.5 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
        
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-550" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search categories (name, description, status)..."
            className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto md:ml-0">
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer transition-all ${
              isSyncing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Backup Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Floating/Contextual Bulk Action Toolbar when selectedIds > 0 */}
      {hasSelection && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 px-1.5 min-w-[20px] rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-sm">
              {selectedIds.length}
            </span>
            <span className="text-xs font-black text-indigo-900 dark:text-indigo-300">
              categories selected for batch operations
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onBulkStatusUpdate(selectedIds, 'Active')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Mark Active</span>
            </button>
            <button
              onClick={() => onBulkStatusUpdate(selectedIds, 'Inactive')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-amber-500" />
              <span>Mark Inactive</span>
            </button>
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Batch</span>
            </button>
            <button
              onClick={onClearSelection}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchToolbar;
