import React from 'react';
import * as LucideIcons from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: keyof typeof LucideIcons;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'Inbox',
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  // Dynamically resolve icon from Lucide
  const IconComponent = (LucideIcons[icon] || LucideIcons.Inbox) as React.ComponentType<any>;

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
        <IconComponent className="h-8 w-8 stroke-[1.5]" />
      </div>

      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="shadow-sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
