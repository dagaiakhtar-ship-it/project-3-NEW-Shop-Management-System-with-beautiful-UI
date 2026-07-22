import React, { forwardRef } from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', containerClassName = '', id, checked, onChange, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex items-center gap-3 ${containerClassName}`}>
        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={switchId}
            className="block overflow-hidden h-6 rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer peer-checked:bg-indigo-600 transition-colors duration-200"
          />
          <span
            className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform cursor-pointer pointer-events-none peer-checked:translate-x-4 shadow-sm"
          />
        </div>
        {label && (
          <label htmlFor={switchId} className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
export default Switch;
