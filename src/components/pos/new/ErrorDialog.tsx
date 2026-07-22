import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, ChevronDown, ChevronUp, RefreshCw, LifeBuoy } from 'lucide-react';

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  technicalDetails?: string;
  onRetry?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  title = 'Transaction Failed',
  description = 'An error occurred while processing the checkout. Please check the stock or terminal settings and try again.',
  technicalDetails,
  onRetry,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [supportContacted, setSupportContacted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Dialog card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.25 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-[20px] shadow-2xl border border-rose-100 dark:border-rose-950/40 overflow-hidden flex flex-col z-10 text-left"
          id="checkout-error-dialog"
        >
          {/* Header */}
          <div className="p-6 bg-rose-50/50 dark:bg-rose-950/10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center border border-rose-200 dark:border-rose-900/30">
                <AlertCircle className="h-5.5 w-5.5 text-[#EF4444]" />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
                <p className="text-[12px] font-bold text-[#EF4444]">Terminal Exception Raised</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-150/40 dark:hover:bg-rose-950/30 text-slate-400 hover:text-slate-350 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description Body */}
          <div className="p-6 space-y-4">
            <p className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              {description}
            </p>

            {/* Expandable Technical Details */}
            {technicalDetails && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="w-full px-4 py-2.5 flex justify-between items-center text-[12px] font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Technical Debug Specifications</span>
                  {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <AnimatePresence>
                  {showTechnical && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="px-4 pb-4 pt-1.5 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-450 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-pre-wrap max-h-[140px]">
                        {technicalDetails}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3.5">
            {/* Live Support Placeholder */}
            <button
              type="button"
              disabled={supportContacted}
              onClick={() => setSupportContacted(true)}
              className="px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LifeBuoy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{supportContacted ? 'Ticket Created!' : 'Contact Support'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4.5 h-10 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
              {onRetry && (
                <motion.button
                  type="button"
                  onClick={onRetry}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Checkout</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(ErrorDialog);
