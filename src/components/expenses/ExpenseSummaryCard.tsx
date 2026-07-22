import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Calendar, Sparkles } from 'lucide-react';

interface ExpenseSummaryCardProps {
  title: string;
  value: number;
  change?: number; // percentage change (optional)
  iconType: 'today' | 'month' | 'year';
  description?: string;
  id?: string;
}

export const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({
  title,
  value,
  change,
  iconType,
  description,
  id,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getIcon = () => {
    switch (iconType) {
      case 'today':
        return (
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'month':
        return (
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'year':
        return (
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        );
    }
  };

  const isPositiveChange = change !== undefined && change > 0;
  const isZeroChange = change !== undefined && change === 0;

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
      id={id || `summary-card-${iconType}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1.5">
            {formatCurrency(value)}
          </h3>
        </div>
        {getIcon()}
      </div>

      {description && (
        <div className="mt-4 flex items-center gap-1.5">
          {change !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isPositiveChange
                  ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  : isZeroChange
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              }`}
            >
              {isPositiveChange ? (
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {description}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExpenseSummaryCard;
