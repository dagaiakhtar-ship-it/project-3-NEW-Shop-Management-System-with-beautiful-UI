import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'circle' | 'rectangle' | 'card' | 'table';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  animate = true,
  className = '',
  ...props
}) => {
  const baseClass = 'bg-slate-200 dark:bg-slate-800 rounded-md';
  const animClass = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'h-3 w-full my-1',
    title: 'h-5 w-2/3 my-2',
    circle: 'h-10 w-10 rounded-full',
    rectangle: 'h-24 w-full',
    card: 'h-40 w-full p-5 border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl flex flex-col gap-3',
    table: 'w-full flex flex-col gap-2 p-3',
  }[variant];

  if (variant === 'card') {
    return (
      <div className={`${baseClass} ${animClass} ${variantClasses} ${className}`} {...props}>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/3 rounded-lg" />
        <div className="h-8 bg-slate-100 dark:bg-slate-800 w-1/2 rounded-lg mt-1" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 w-2/3 rounded-lg mt-auto" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`${variantClasses} ${className}`} {...props}>
        <div className={`h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-lg ${animClass}`} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 w-full py-1.5 border-b border-slate-50 dark:border-slate-900">
            <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1 ${animClass}`} />
            <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1 ${animClass}`} />
            <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1 ${animClass}`} />
            <div className={`h-4 bg-slate-100 dark:bg-slate-850 rounded-lg w-16 ${animClass}`} />
          </div>
        ))}
      </div>
    );
  }

  return <div className={`${baseClass} ${animClass} ${variantClasses} ${className}`} {...props} />;
};

export default Skeleton;
