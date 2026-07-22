import React, { forwardRef } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  containerClassName?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', containerClassName = '', id, checked, onChange, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`flex items-center gap-3 ${containerClassName}`}>
        <label htmlFor={switchId} className="relative inline-flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-650 peer-checked:after:bg-white border border-slate-200/20" />
          {label && (
            <span className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">
              {label}
            </span>
          )}
        </label>
      </div>
    );
  }
);

Switch.displayName = 'Switch';
export default Switch;
