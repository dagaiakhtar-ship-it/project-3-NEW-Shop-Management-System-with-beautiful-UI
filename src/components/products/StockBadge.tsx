import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  currentStock: number;
  minimumStock: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ currentStock, minimumStock }) => {
  let status: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';
  if (currentStock <= 0) {
    status = 'Out Of Stock';
  } else if (currentStock <= minimumStock) {
    status = 'Low Stock';
  }

  const badges = {
    'In Stock': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-150/60 dark:border-emerald-900/40',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    },
    'Low Stock': {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-150/60 dark:border-amber-900/40',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    },
    'Out Of Stock': {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-150/60 dark:border-rose-900/40',
      icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
    },
  };

  const active = badges[status];

  return (
    <span
      id={`stock-badge-${status.toLowerCase().replace(/ /g, '-')}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${active.bg} ${active.text} ${active.border}`}
    >
      {active.icon}
      <span>{status}</span>
    </span>
  );
};

export default StockBadge;
