import React from 'react';
import { LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../ui/Button';

interface LogoutConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center overflow-hidden"
          id="logout-confirm-dialog"
        >
          {/* Close button icon */}
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Icon Badge */}
          <div className="inline-flex p-3.5 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-2xl mb-4 border border-rose-100/30 dark:border-rose-900/10">
            <LogOut className="h-6 w-6 animate-pulse" />
          </div>

          {/* Heading */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Confirm Sign Out
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
            Are you sure you want to end your active session and sign out? You will need to log back in to access the system.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="slate"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              className="flex-1"
              onClick={onConfirm}
            >
              Sign Out
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LogoutConfirmationDialog;
