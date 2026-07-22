import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullscreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  fullscreen = false,
}) => {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-t-indigo-600 border-r-indigo-200 border-b-indigo-200 border-l-indigo-200 dark:border-r-slate-800 dark:border-b-slate-800 dark:border-l-slate-800 ${sizes[size]} ${className}`}
      id="custom-spinner"
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-slate-50/85 dark:bg-slate-950/85 flex flex-col items-center justify-center gap-3 z-50 animate-fade-in">
        {spinner}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse tracking-wider uppercase">
          Loading Shop Data...
        </p>
      </div>
    );
  }

  return spinner;
};

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  count = 1,
}) => {
  const baseClasses = 'bg-slate-100 dark:bg-slate-800/80 animate-pulse';
  const variants = {
    text: 'h-4 rounded w-3/4',
    rect: 'h-24 rounded-lg',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variants[variant]} ${className}`}
          id={`skeleton-item-${i}`}
        />
      ))}
    </>
  );
};

export default Loader;
