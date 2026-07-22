import React, { forwardRef } from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', containerClassName = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        <label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:ring-offset-0 focus:outline-hidden transition-all duration-150 cursor-pointer ${className}`}
            {...props}
          />
          {label && <span>{label}</span>}
        </label>
        {error && (
          <p className="text-xs text-red-500 font-medium ml-7" id={`${checkboxId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
