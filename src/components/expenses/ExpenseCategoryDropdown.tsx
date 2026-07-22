import React, { useEffect, useState } from 'react';
import { db, type ExpenseCategory } from '../../database/db';
import { Tag } from 'lucide-react';

interface ExpenseCategoryDropdownProps {
  selectedId?: number;
  onChange: (id: number) => void;
  error?: string;
  className?: string;
  id?: string;
}

export const ExpenseCategoryDropdown: React.FC<ExpenseCategoryDropdownProps> = ({
  selectedId,
  onChange,
  error,
  className = '',
  id = 'expense-category-dropdown',
}) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const all = await db.expenseCategories.toArray();
      // Only show active categories for choice
      const active = all.filter(c => c.status === 'Active');
      setCategories(active);
    };
    loadCategories();
  }, []);

  const getCategoryColorBorder = (color: string) => {
    switch (color) {
      case 'rose': return 'border-rose-500';
      case 'amber': return 'border-amber-500';
      case 'orange': return 'border-orange-500';
      case 'blue': return 'border-blue-500';
      case 'indigo': return 'border-indigo-500';
      case 'green': return 'border-emerald-500';
      case 'purple': return 'border-purple-500';
      case 'teal': return 'border-teal-500';
      case 'pink': return 'border-pink-500';
      case 'yellow': return 'border-yellow-500';
      case 'emerald': return 'border-emerald-500';
      case 'red': return 'border-red-500';
      default: return 'border-slate-400';
    }
  };

  const getCategoryColorBg = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-500';
      case 'amber': return 'bg-amber-500';
      case 'orange': return 'bg-orange-500';
      case 'blue': return 'bg-blue-500';
      case 'indigo': return 'bg-indigo-500';
      case 'green': return 'bg-emerald-500';
      case 'purple': return 'bg-purple-500';
      case 'teal': return 'bg-teal-500';
      case 'pink': return 'bg-pink-500';
      case 'yellow': return 'bg-yellow-500';
      case 'emerald': return 'bg-emerald-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedId);

  return (
    <div className={`w-full ${className}`} id={`${id}-wrapper`}>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        Expense Category <span className="text-rose-500">*</span>
      </label>
      
      <div className="relative">
        <select
          id={id}
          value={selectedId || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border ${
            error
              ? 'border-rose-500 ring-2 ring-rose-500/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-500'
          } rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all appearance-none cursor-pointer`}
        >
          <option value="" disabled>Select a Category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Icon slot */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          {selectedCategory ? (
            <span className={`w-2.5 h-2.5 rounded-full ${getCategoryColorBg(selectedCategory.color)}`} />
          ) : (
            <Tag className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Custom Chevron Indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-500 mt-1.5" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default ExpenseCategoryDropdown;
