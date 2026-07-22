import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface CreditSummaryCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'slate';
}

export const CreditSummaryCard: React.FC<CreditSummaryCardProps> = ({
  title,
  value,
  subtext,
  icon: IconComponent,
  variant = 'slate',
}) => {
  let accentColor = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/35';
  let cardBorder = 'border-slate-150/50 dark:border-slate-800/80';

  switch (variant) {
    case 'primary':
      accentColor = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/35';
      break;
    case 'success':
      accentColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/35';
      break;
    case 'warning':
      accentColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/35';
      break;
    case 'danger':
      accentColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/35';
      break;
    case 'slate':
      accentColor = 'text-slate-600 dark:text-slate-350 bg-slate-100/70 dark:bg-slate-900';
      break;
  }

  return (
    <div className={`bg-white dark:bg-slate-950 border ${cardBorder} rounded-2xl p-4.5 flex items-center justify-between shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-250 select-none`}>
      <div className="flex flex-col gap-1 text-left">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-lg font-black text-slate-850 dark:text-white font-mono leading-tight">
          {value}
        </span>
        {subtext && (
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            {subtext}
          </span>
        )}
      </div>

      <div className={`p-3 rounded-xl ${accentColor} shrink-0 transition-transform duration-300 hover:rotate-6`}>
        <IconComponent className="h-5 w-5" />
      </div>
    </div>
  );
};

export default CreditSummaryCard;
