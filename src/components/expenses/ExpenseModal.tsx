import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
  maxWidthClass?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  id = 'expense-modal',
  maxWidthClass = 'max-w-3xl',
}) => {
  // Prevent body scroll when modal is open
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      id={id}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            id={`${id}-btn-close`}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
