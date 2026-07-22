import React from 'react';
import { type Expense } from '../../database/db';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import { Eye, Edit, Copy, Trash2, Tag, Calendar, Landmark, Sparkles, CheckCircle2 } from 'lucide-react';

interface ExpenseTableProps {
  expenses: (Expense & { categoryName: string; categoryColor: string; categoryIcon: string })[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  selectedIds: number[];
  onSelect: (id: number, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  id?: string;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  selectedIds,
  onSelect,
  onSelectAll,
  id = 'expense-table',
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

  const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-2xl shadow-sm" id={id}>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
              <th className="px-5 py-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 bg-slate-100 border-slate-200 rounded focus:ring-indigo-500 cursor-pointer"
                  id={`${id}-select-all`}
                />
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Exp No.
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider min-w-[200px]">
                Expense Detail
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                Amount (USD)
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                    <p className="text-sm">No expenses matched your current criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const isSelected = selectedIds.includes(exp.id!);
                return (
                  <tr
                    key={exp.id}
                    className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                    }`}
                    id={`expense-row-${exp.id}`}
                  >
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(exp.id!, e.target.checked)}
                        className="w-4.5 h-4.5 text-indigo-600 bg-slate-100 border-slate-200 rounded focus:ring-indigo-500 cursor-pointer"
                        id={`select-row-${exp.id}`}
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        {exp.expenseNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {exp.title}
                        </p>
                        {exp.vendorName && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            To: {exp.vendorName}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${getCategoryColorClass(exp.categoryColor)}`}>
                        {exp.categoryName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(exp.expenseDate)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-black text-rose-500 tracking-tight">
                        {formatCurrency(exp.amount)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" />
                        {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <ExpenseStatusBadge status={exp.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onView(exp.id!)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-lg transition-all"
                          title="View Details"
                          id={`btn-view-${exp.id}`}
                        >
                          <Eye className="w-4.5 h-4.5 stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => onEdit(exp.id!)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
                          title="Edit"
                          id={`btn-edit-${exp.id}`}
                        >
                          <Edit className="w-4.5 h-4.5 stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => onDuplicate(exp.id!)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-all"
                          title="Duplicate"
                          id={`btn-dup-${exp.id}`}
                        >
                          <Copy className="w-4.5 h-4.5 stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => onDelete(exp.id!)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 text-slate-400 dark:text-slate-600 rounded-lg transition-all"
                          title="Archive"
                          id={`btn-del-${exp.id}`}
                        >
                          <Trash2 className="w-4.5 h-4.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
