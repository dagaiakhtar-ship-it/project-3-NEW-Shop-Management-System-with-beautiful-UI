import React from 'react';
import Card, { CardContent } from '../ui/Card';
import TrendIndicator from './TrendIndicator';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  isPositiveGood?: boolean;
  isLoading?: boolean;
  accentColor?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'slate';
  id?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  isPositiveGood = true,
  isLoading = false,
  accentColor = 'primary',
  id,
}) => {
  const accentClasses = {
    primary: 'border-l-4 border-indigo-500',
    success: 'border-l-4 border-emerald-500',
    danger: 'border-l-4 border-rose-500',
    warning: 'border-l-4 border-amber-500',
    info: 'border-l-4 border-sky-500',
    purple: 'border-l-4 border-purple-500',
    slate: 'border-l-4 border-slate-500',
  };

  return (
    <Card id={id} className={`overflow-hidden transition-all duration-300 hover:shadow-md ${accentClasses[accentColor]}`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1.5 text-left w-full">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          
          {isLoading ? (
            <div className="h-7 w-2/3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {value}
              </span>
              {trend !== undefined && (
                <TrendIndicator value={trend} isPositiveGood={isPositiveGood} />
              )}
            </div>
          )}

          {description && !isLoading && (
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-450 rounded-xl">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
