import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination Component
 * Elegant pagination control displaying page increments, active item accent,
 * and next/prev navigations.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate range of visible pages
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-between py-3 px-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>
      {/* Label showing progress */}
      <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-1 px-2.5"
          id="btn-prev-page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer
              ${
                currentPage === pageNum
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }
            `}
          >
            {pageNum}
          </button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-1 px-2.5"
          id="btn-next-page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
