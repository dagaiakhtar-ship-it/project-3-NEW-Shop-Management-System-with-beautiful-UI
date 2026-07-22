import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component
 * standard styled top-level layout block for titles and action items.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800/60 ${className}`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
