import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options = [],
      error,
      helperText,
      placeholder = 'Select an option',
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`w-full text-sm py-2 pl-3.5 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border rounded-lg outline-none transition-all duration-150 appearance-none cursor-pointer
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
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <p className="text-xs text-red-500 font-medium mt-0.5" id={`${inputId}-error`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" id={`${inputId}-helper`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
