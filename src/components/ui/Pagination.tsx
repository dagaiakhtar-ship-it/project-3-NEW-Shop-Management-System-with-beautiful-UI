import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <nav
      className={`flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 px-4 py-3.5 sm:px-6 ${className}`}
      aria-label="Pagination"
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Showing Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-xs gap-1" aria-label="Pagination grid">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`relative inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border
                  ${
                    page === currentPage
                      ? 'z-10 bg-indigo-650 border-indigo-600 text-white dark:bg-indigo-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-350'
                  }
                `}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;
