import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  value: 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_year' | 'custom';
  onChange: (val: 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_year' | 'custom') => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (val: string) => void;
  onEndDateChange?: (val: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
}) => {
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Year', value: 'year' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'Custom Range', value: 'custom' },
  ] as const;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          Reporting Interval
        </label>
        
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              id={`date-preset-${preset.value}`}
              onClick={() => onChange(preset.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                value === preset.value
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {value === 'custom' && onStartDateChange && onEndDateChange && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 animate-fade-in">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              id="custom-start-date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              id="custom-end-date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
