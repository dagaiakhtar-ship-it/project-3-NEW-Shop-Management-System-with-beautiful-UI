import React from 'react';
import { type Expense } from '../../database/db';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import { Eye, Edit, Copy, Trash2, Calendar, Landmark, Sparkles } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense & { categoryName: string; categoryColor: string; categoryIcon: string };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  id?: string;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  id,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColorClass = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      case 'amber': return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'orange': return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'blue': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'indigo': return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400';
      case 'green': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'purple': return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'teal': return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400';
      case 'pink': return 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'red': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/10 dark:border-indigo-500'
          : 'border-slate-200 dark:border-slate-800/80'
      } rounded-2xl p-4 shadow-sm flex flex-col gap-4.5 transition-all hover:shadow-md`}
      id={id || `expense-card-${expense.id}`}
    >
      {/* Header section */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-200 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
            {expense.expenseNumber}
          </span>
        </div>
        <ExpenseStatusBadge status={expense.status} />
      </div>

      {/* Main info */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
          {expense.title}
        </h4>
        {expense.vendorName && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Paid to: <span className="text-slate-600 dark:text-slate-450 font-bold">{expense.vendorName}</span>
          </p>
        )}
      </div>

      {/* Metadata tags */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${getCategoryColorClass(expense.categoryColor)}`}>
          {expense.categoryName}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(expense.expenseDate)}
        </span>
      </div>

      {/* Footer segment: Price and Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-0.5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Disbursed Amount
          </span>
          <span className="text-base font-black text-rose-500 tracking-tight mt-0.5">
            {formatCurrency(expense.amount)}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-xl transition-all"
            title="View Details"
          >
            <Eye className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 text-slate-400 dark:text-slate-600 rounded-xl transition-all"
            title="Archive"
          >
            <Trash2 className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
