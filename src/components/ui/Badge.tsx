import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30',
    secondary: 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30',
    danger: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center justify-center text-center ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
