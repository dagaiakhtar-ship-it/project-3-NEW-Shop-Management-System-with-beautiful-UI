import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  onNavigate?: (path: string) => void;
}

/**
 * Breadcrumb Component
 * Renders page depth hierarchy with hover behaviors.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
  onNavigate,
}) => {
  return (
    <nav className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${className}`} aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate?.('/')}
        className="flex items-center hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        title="Home"
      >
        <Home className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 stroke-[2.5]" />
            {isLast || !item.path ? (
              <span className="font-bold text-slate-800 dark:text-slate-200 select-none">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => onNavigate?.(item.path!)}
                className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
