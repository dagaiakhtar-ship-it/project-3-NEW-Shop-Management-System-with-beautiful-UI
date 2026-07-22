import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '',
  size = 'md',
  shape = 'circle',
  status = null,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-xl',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-rose-500',
    away: 'bg-amber-500',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-block shrink-0 ${className}`} {...props}>
      <div
        className={`flex items-center justify-center font-bold select-none border border-slate-100 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ${sizeClasses[size]} ${shapeClasses[shape]} overflow-hidden`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

export default Avatar;
