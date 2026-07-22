import React from 'react';

interface ExpenseStatusBadgeProps {
  status: 'Paid' | 'Pending' | 'Voided' | string;
}

export const ExpenseStatusBadge: React.FC<ExpenseStatusBadgeProps> = ({ status }) => {
  const normalized = status?.trim() || 'Paid';

  let classes = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

  switch (normalized) {
    case 'Paid':
      classes = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      break;
    case 'Pending':
      classes = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      break;
    case 'Voided':
      classes = 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 line-through';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${classes}`}
      id={`expense-status-${normalized.toLowerCase()}`}
    >
      {normalized}
    </span>
  );
};

export default ExpenseStatusBadge;
