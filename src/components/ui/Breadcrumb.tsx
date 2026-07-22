import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex py-1 text-slate-400 dark:text-slate-500 ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2.5">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-bold text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
          >
            <Home className="mr-2 h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index}>
              <div className="flex items-center">
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 mx-1 shrink-0" />
                {isLast || !item.path ? (
                  <span className="ml-1 text-xs font-bold text-slate-900 dark:text-white select-none">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="ml-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
