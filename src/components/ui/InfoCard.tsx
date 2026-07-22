import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import Card from './Card';

export interface InfoCardProps {
  title: string;
  description: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'slate';
  icon?: React.ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  variant = 'info',
  icon,
  className = '',
}) => {
  const styles = {
    primary: 'border-l-4 border-l-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10',
    success: 'border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10',
    warning: 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10',
    danger: 'border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10',
    info: 'border-l-4 border-l-sky-500 bg-sky-50/20 dark:bg-sky-950/10',
    slate: 'border-l-4 border-l-slate-400 bg-slate-50/50 dark:bg-slate-900/40',
  }[variant];

  const iconColors = {
    primary: 'text-indigo-600 dark:text-indigo-400',
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    danger: 'text-red-500 dark:text-red-400',
    info: 'text-sky-500 dark:text-sky-400',
    slate: 'text-slate-400 dark:text-slate-500',
  }[variant];

  return (
    <Card className={`flex gap-4 p-4 items-start ${styles} ${className}`}>
      <div className={`shrink-0 mt-0.5 ${iconColors}`}>
        {icon || <Info className="h-5 w-5" />}
      </div>
      <div className="flex flex-col gap-1 text-left">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-wide uppercase">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
          {description}
        </p>
      </div>
    </Card>
  );
};

export default InfoCard;
