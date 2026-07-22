import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number; // Percentage or difference value
  isPositiveGood?: boolean; // If true, positive values are green, negative red. If false (like expenses), positive is red.
  className?: string;
  showIcon?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  isPositiveGood = true,
  className = '',
  showIcon = true,
}) => {
  const isZero = value === 0;
  const isPositive = value > 0;

  let colorClass = 'text-slate-400';
  let Icon = Minus;

  if (!isZero) {
    if (isPositive) {
      colorClass = isPositiveGood ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20';
      Icon = TrendingUp;
    } else {
      colorClass = isPositiveGood ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20';
      Icon = TrendingDown;
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${colorClass} ${className}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
    </div>
  );
};

export default TrendIndicator;
