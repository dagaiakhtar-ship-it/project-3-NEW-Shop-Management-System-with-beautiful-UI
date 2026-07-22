import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  position = 'right',
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full w-screen',
  }[size];

  const positionClasses = {
    left: 'left-0 translate-x-0',
    right: 'right-0 translate-x-0',
  }[position];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay with blur */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
        />

        <div className={`fixed inset-y-0 ${position === 'left' ? 'left-0' : 'right-0'} flex max-w-full pl-0`}>
          <div className={`w-screen ${sizeClasses} bg-white dark:bg-slate-950 shadow-2xl transition-all duration-300 border-l border-slate-100 dark:border-slate-800 flex flex-col`}>
            {/* Header banner */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-50 dark:border-slate-800/50">
              {title ? (
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Inner scrollable block */}
            <div className="flex-1 overflow-y-auto p-6 text-left">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
