import React from 'react';
import { RefreshCw, Calendar, Clock } from 'lucide-react';

interface RecurringSettingsProps {
  isRecurring: boolean;
  recurringType?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextRecurringDate?: string;
  onChangeRecurring: (val: boolean) => void;
  onChangeType: (val: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly') => void;
  onChangeDate: (val: string) => void;
  id?: string;
}

export const RecurringSettings: React.FC<RecurringSettingsProps> = ({
  isRecurring,
  recurringType = 'Monthly',
  nextRecurringDate,
  onChangeRecurring,
  onChangeType,
  onChangeDate,
  id = 'recurring-settings',
}) => {
  return (
    <div
      className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-4"
      id={id}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isRecurring
              ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <RefreshCw className={`w-4 h-4 ${isRecurring ? 'animate-spin-slow' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recurring Expense
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Enable notifications for scheduled recurring costs
            </p>
          </div>
        </div>

        {/* Custom iOS-style Switch */}
        <button
          type="button"
          onClick={() => onChangeRecurring(!isRecurring)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/15 ${
            isRecurring ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
          }`}
          id={`${id}-toggle`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isRecurring ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Billing Interval
            </label>
            <div className="relative">
              <select
                value={recurringType}
                onChange={(e) => onChangeType(e.target.value as any)}
                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 appearance-none cursor-pointer"
                id={`${id}-interval`}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Clock className="w-4 h-4" />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Next Bill Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={nextRecurringDate || ''}
                onChange={(e) => onChangeDate(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                id={`${id}-date`}
                required={isRecurring}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringSettings;
