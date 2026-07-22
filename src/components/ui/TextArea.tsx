import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', containerClassName = '', id, ...props }, ref) => {
    const textId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={textId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textId}
          className={`w-full text-sm py-2 px-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border rounded-lg outline-none transition-all duration-150 min-h-24 resize-y
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
        />

        {error ? (
          <p className="text-xs text-red-500 font-medium mt-0.5" id={`${textId}-error`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" id={`${textId}-helper`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;
