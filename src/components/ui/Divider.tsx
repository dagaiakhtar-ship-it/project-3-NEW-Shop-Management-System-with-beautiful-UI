import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  className = '',
  ...props
}) => {
  const borderStyle = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  }[variant];

  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block h-full border-l border-slate-100 dark:border-slate-800 ${borderStyle} ${className}`}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  return (
    <div
      className={`flex items-center w-full my-4 text-xs ${className}`}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    >
      {label ? (
        <>
          <div
            className={`flex-1 border-t border-slate-100 dark:border-slate-800 ${borderStyle} ${
              labelPosition === 'left' ? 'max-w-10' : ''
            }`}
          />
          <span className="px-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none shrink-0">
            {label}
          </span>
          <div
            className={`flex-1 border-t border-slate-100 dark:border-slate-800 ${borderStyle} ${
              labelPosition === 'right' ? 'max-w-10' : ''
            }`}
          />
        </>
      ) : (
        <div className={`w-full border-t border-slate-100 dark:border-slate-800 ${borderStyle}`} />
      )}
    </div>
  );
};

export default Divider;
