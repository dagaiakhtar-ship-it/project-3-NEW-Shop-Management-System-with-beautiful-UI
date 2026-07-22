import React from 'react';
import Card from '../../ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  className?: string;
}

/**
 * StatisticCard Component
 * Renders key business indicators with elegant typography, soft shadow,
 * icon badge background, and colorful trend indicators.
 */
export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-medium">
          <span
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold
              ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
              }
            `}
          >
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {trend.label || 'from last month'}
          </span>
        </div>
      )}

      {description && !trend && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}
    </Card>
  );
};

export default StatisticCard;
