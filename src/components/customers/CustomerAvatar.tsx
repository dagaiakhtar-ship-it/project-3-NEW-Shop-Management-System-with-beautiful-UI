import React from 'react';

interface CustomerAvatarProps {
  profileImage?: string;
  fullName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  profileImage,
  fullName,
  size = 'md',
  className = '',
}) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBackgroundColor = (name: string) => {
    const hash = Array.from(name || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-indigo-500 text-white',
      'bg-emerald-500 text-white',
      'bg-amber-500 text-white',
      'bg-rose-500 text-white',
      'bg-sky-500 text-white',
      'bg-violet-500 text-white',
      'bg-teal-500 text-white',
      'bg-pink-500 text-white',
    ];
    return colors[hash % colors.length];
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'h-6 w-6 text-[10px]';
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-14 w-14 text-lg';
      case 'xl':
        return 'h-20 w-20 text-2xl';
      case '2xl':
        return 'h-28 w-28 text-4xl';
      case 'md':
      default:
        return 'h-10 w-10 text-sm';
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full overflow-hidden font-bold select-none shrink-0 border border-slate-200/50 dark:border-slate-800/80 shadow-inner ${getSizeClasses()} ${
        profileImage ? 'bg-slate-100 dark:bg-slate-900' : getBackgroundColor(fullName)
      } ${className}`}
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt={fullName}
          className="h-full w-full object-cover object-center"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails to load, clear it or fall back
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(fullName)}</span>
      )}
    </div>
  );
};

export default CustomerAvatar;
