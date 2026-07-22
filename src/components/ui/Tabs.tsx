import React from 'react';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'line' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  const containerClasses = {
    line: 'border-b border-slate-100 dark:border-slate-800/80 flex space-x-6',
    pill: 'bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl inline-flex space-x-1.5 border border-slate-100/50 dark:border-slate-800/30',
  }[variant];

  return (
    <div className={`${containerClasses} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        const buttonClasses = {
          line: `pb-3 text-xs font-bold transition-all relative border-b-2 cursor-pointer flex items-center gap-2
            ${
              isActive
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350'
            }`,
          pill: `px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2
            ${
              isActive
                ? 'bg-white dark:bg-slate-950 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-100/40 dark:border-slate-800/20'
                : 'text-slate-450 hover:bg-slate-100/50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900/40 dark:hover:text-slate-350'
            }`,
        }[variant];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={buttonClasses}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
