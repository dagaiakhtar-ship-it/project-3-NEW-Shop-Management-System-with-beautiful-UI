import React from 'react';

interface CreditStatusBadgeProps {
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled' | string;
}

export const CreditStatusBadge: React.FC<CreditStatusBadgeProps> = ({ status }) => {
  const normalized = status?.trim() || 'Unpaid';

  let classes = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

  switch (normalized) {
    case 'Paid':
      classes = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      break;
    case 'Partial':
      classes = 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400';
      break;
    case 'Unpaid':
      classes = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      break;
    case 'Overdue':
      classes = 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 animate-pulse';
      break;
    case 'Cancelled':
      classes = 'bg-slate-200/50 text-slate-550 dark:bg-slate-800/40 dark:text-slate-500 line-through';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${classes}`} id={`status-badge-${normalized.toLowerCase()}`}>
      {normalized}
    </span>
  );
};

export default CreditStatusBadge;
