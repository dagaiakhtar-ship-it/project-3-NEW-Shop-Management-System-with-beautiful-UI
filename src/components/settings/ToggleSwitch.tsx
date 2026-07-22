import React from 'react';
import { motion } from 'motion/react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 py-1.5 select-none ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <div className="flex flex-col text-left">
          <label htmlFor={id} className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </label>
          {description && (
            <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 leading-normal mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm ring-0 transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
