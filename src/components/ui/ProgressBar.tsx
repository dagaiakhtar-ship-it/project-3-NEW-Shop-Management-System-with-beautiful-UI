import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  size = 'sm',
  showLabel = false,
  className = '',
  ...props
}) => {
  const clampedValue = Math.min(Math.max(0, value), 100);

  const colors = {
    primary: 'bg-indigo-600',
    secondary: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const trackColors = {
    primary: 'bg-indigo-100/40 dark:bg-indigo-950/20',
    secondary: 'bg-sky-100/40 dark:bg-sky-950/20',
    success: 'bg-emerald-100/40 dark:bg-emerald-950/20',
    warning: 'bg-amber-100/40 dark:bg-amber-950/20',
    danger: 'bg-red-100/40 dark:bg-red-950/20',
  };

  const heightClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span className="font-bold">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={`w-full rounded-full overflow-hidden ${trackColors[variant]} ${heightClasses[size]}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colors[variant]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
