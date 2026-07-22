import React, { forwardRef } from 'react';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className = '', containerClassName = '', id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        <label htmlFor={radioId} className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={`w-4.5 h-4.5 rounded-full text-indigo-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:ring-offset-0 focus:outline-hidden transition-all duration-150 cursor-pointer ${className}`}
            {...props}
          />
          {label && <span>{label}</span>}
        </label>
        {error && (
          <p className="text-xs text-red-500 font-medium ml-7" id={`${radioId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
export default Radio;
