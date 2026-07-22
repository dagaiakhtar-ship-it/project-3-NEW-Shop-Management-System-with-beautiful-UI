import React from 'react';
import { Database } from 'lucide-react';

interface NoDataProps {
  message?: string;
  className?: string;
}

/**
 * NoData Component
 * Lightweight placeholder when list data yields 0 results.
 */
export const NoData: React.FC<NoDataProps> = ({
  message = 'No records found in database.',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 ${className}`}>
      <Database className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-2.5" />
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {message}
      </p>
    </div>
  );
};

export default NoData;
