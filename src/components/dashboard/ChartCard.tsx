import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, FileQuestion } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  id?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  isLoading = false,
  isError = false,
  isEmpty = false,
  children,
  headerActions,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full ${className}`}
    >
      {/* Header section */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              {description}
            </p>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{headerActions}</div>}
      </div>

      {/* Main Content Pane with Loaders, Error and Empty states */}
      <div className="flex-1 relative min-h-[220px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Loading analytics...
            </span>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <AlertCircle className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100">
                Database Error
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-xs leading-normal">
                Failed to aggregate local IndexedDB data records. Please refresh.
              </span>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="p-2 bg-slate-50 dark:bg-slate-850/50 text-slate-400 dark:text-slate-500 rounded-2xl">
              <FileQuestion className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100">
                No Data Available
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-xs leading-normal">
                This report has no checkout logs recorded during the selected period.
              </span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
