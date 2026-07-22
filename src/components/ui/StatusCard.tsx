import React from 'react';
import Card from './Card';

export interface StatusCardProps {
  label: string;
  value: string | number;
  statusText?: string;
  statusColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  statusText,
  statusColor = 'primary',
  className = '',
}) => {
  const accentClasses = {
    primary: 'border-t-indigo-600 dark:border-t-indigo-400',
    success: 'border-t-emerald-500 dark:border-t-emerald-400',
    warning: 'border-t-amber-500 dark:border-t-amber-400',
    danger: 'border-t-red-500 dark:border-t-red-400',
    info: 'border-t-sky-500 dark:border-t-sky-400',
  }[statusColor];

  const dotClasses = {
    primary: 'bg-indigo-600 dark:bg-indigo-400',
    success: 'bg-emerald-500 dark:bg-emerald-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-500 dark:bg-red-400',
    info: 'bg-sky-500 dark:bg-sky-400',
  }[statusColor];

  return (
    <Card className={`border-t-4 ${accentClasses} overflow-hidden ${className}`}>
      <div className="flex flex-col gap-1 text-left">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {statusText && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClasses}`} />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {statusText}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatusCard;
