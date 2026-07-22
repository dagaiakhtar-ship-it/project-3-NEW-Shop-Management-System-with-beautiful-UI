import React from 'react';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * SectionHeader Component
 * Subtitle section headers inside modules or cards.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-50 dark:border-slate-800/30 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-3xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
