import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  borderAccent?: boolean;
  accentColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  borderAccent = false,
  accentColor = 'primary',
  ...props
}) => {
  const accentClasses = {
    primary: 'border-t-4 border-t-indigo-600',
    success: 'border-t-4 border-t-emerald-500',
    warning: 'border-t-4 border-t-amber-500',
    danger: 'border-t-4 border-t-red-500',
    info: 'border-t-4 border-t-sky-500',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 shadow-sm transition-all duration-200
        ${hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
        ${borderAccent ? accentClasses[accentColor] : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 pb-4 mb-4 border-b border-slate-50 dark:border-slate-800/50 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-xs font-medium text-slate-400 dark:text-slate-500 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-end pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/50 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
