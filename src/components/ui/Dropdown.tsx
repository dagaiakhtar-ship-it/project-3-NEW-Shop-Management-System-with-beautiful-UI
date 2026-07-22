import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  }[align];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignClasses} mt-2 w-56 rounded-xl border border-slate-100 bg-white dark:border-slate-800/80 dark:bg-slate-950 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.disabled) return;
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.className || ''
                }`}
                role="menuitem"
              >
                {item.icon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
