import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', containerClassName = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full text-sm py-2 pl-3.5 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border rounded-lg outline-none appearance-none transition-all duration-150 cursor-pointer
              ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30'
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30'
              }
              disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100
              dark:disabled:bg-slate-950 dark:disabled:text-slate-600 dark:disabled:border-slate-900
              ${className}
            `}
            {...props}
          >
            {options.map((opt, index) => (
              <option key={index} value={opt.value} disabled={opt.disabled} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-150 py-1 font-medium">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <p className="text-xs text-red-500 font-medium mt-0.5" id={`${selectId}-error`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" id={`${selectId}-helper`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
