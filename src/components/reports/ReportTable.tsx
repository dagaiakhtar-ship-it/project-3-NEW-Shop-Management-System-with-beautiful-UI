import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Eye, EyeOff, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export interface TableColumn<T> {
  key: string & keyof T;
  label: string;
  render?: (val: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface ReportTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: string & keyof T; // Specific key to search, or empty for full row search
  isLoading?: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  id?: string;
}

export const ReportTable = <T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchKey,
  isLoading = false,
  emptyStateTitle = 'No Records Found',
  emptyStateMessage = 'There is no data matching the selected criteria.',
  id,
}: ReportTableProps<T>) => {
  // Sorting State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility State
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    new Set(columns.map((col) => col.key))
  );
  const [showConfigMenu, setShowConfigMenu] = useState(false);

  const toggleColumn = (key: string) => {
    const updated = new Set(visibleKeys);
    if (updated.has(key)) {
      if (updated.size > 1) { // Guard to keep at least 1 column
        updated.delete(key);
      }
    } else {
      updated.add(key);
    }
    setVisibleKeys(updated);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Filter & Sort Data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        if (searchKey) {
          const val = row[searchKey];
          return String(val ?? '').toLowerCase().includes(query);
        } else {
          // Full-row search
          return Object.values(row).some((val) =>
            String(val ?? '').toLowerCase().includes(query)
          );
        }
      });
    }

    // 2. Apply Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortKey, sortDirection, searchKey]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const activeColumns = useMemo(() => {
    return columns.filter((col) => visibleKeys.has(col.key));
  }, [columns, visibleKeys]);

  return (
    <div id={id} className="w-full flex flex-col gap-4 text-left">
      {/* Table Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            id="report-table-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Show</span>
            <select
              id="report-table-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>Entries</span>
          </div>

          {/* Columns Visibility Trigger */}
          <div className="relative">
            <button
              type="button"
              id="report-table-col-visibility-trigger"
              onClick={() => setShowConfigMenu(!showConfigMenu)}
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Column Customizer"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {showConfigMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 flex flex-col gap-2 animate-fade-in">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Toggle Columns
                </span>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {columns.map((col) => {
                    const isVisible = visibleKeys.has(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleColumn(col.key)}
                        className="flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate mr-2">{col.label}</span>
                        {isVisible ? (
                          <Eye className="h-3.5 w-3.5 text-indigo-500" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured Table Container */}
      <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                {activeColumns.map((col) => {
                  const isSortable = col.sortable !== false;
                  return (
                    <th
                      key={col.key}
                      onClick={() => isSortable && handleSort(col.key)}
                      className={`px-5 py-3.5 text-xs font-black text-slate-500 dark:text-slate-450 select-none ${
                        isSortable ? 'cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-800/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.label}</span>
                        {isSortable && sortKey === col.key && (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                          )
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                // Table Skeleton Loader Rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800/40 animate-pulse">
                    {activeColumns.map((col) => (
                      <td key={col.key} className="px-5 py-4">
                        <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty Table view
                <tr>
                  <td colSpan={activeColumns.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 select-none text-slate-450 dark:text-slate-500">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{emptyStateTitle}</span>
                      <p className="text-xs max-w-sm mx-auto leading-relaxed">{emptyStateMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Live table row mapping
                paginatedData.map((row, rIndex) => (
                  <tr 
                    key={row.id || rIndex} 
                    className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    {activeColumns.map((col) => {
                      const value = row[col.key];
                      return (
                        <td key={col.key} className="px-5 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {col.render ? col.render(value, row) : (value === null || value === undefined ? '-' : String(value))}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Pagination Controls */}
      {!isLoading && processedData.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 px-1">
          {/* Metadata counts */}
          <span className="text-xs text-slate-500 dark:text-slate-450 font-semibold">
            Showing <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, processedData.length)}</span> to{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, processedData.length)}</span> of{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">{processedData.length}</span> entries
          </span>

          {/* Page numbers */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Only show current, first, last, and immediate surrounding pages
                const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;
                
                if (!shouldShow) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={`ell-${pageNum}`} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-sm font-black'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportTable;
