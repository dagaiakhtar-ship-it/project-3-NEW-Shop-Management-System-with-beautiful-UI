import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, User, DollarSign, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react';
import { type Customer } from '../../../database/db';

interface LoanConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer | null;
  totals: {
    grandTotal: number;
  };
  paidAmount: number;
  remainingAmount: number;
  isProcessing: boolean;
}

export const LoanConfirmationDialog: React.FC<LoanConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customer,
  totals,
  paidAmount,
  remainingAmount,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const previousLoan = customer ? (customer.currentBalance ?? customer.balance ?? 0) : 0;
  const totalOutstanding = previousLoan + remainingAmount;
  const creditLimit = customer ? (customer.creditLimit ?? 0) : 0;
  const limitBreached = creditLimit > 0 && totalOutstanding > creditLimit;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isProcessing ? undefined : onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
        />

        {/* Dialog Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.25 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-[20px] shadow-2xl border border-rose-100 dark:border-rose-950/40 overflow-hidden flex flex-col z-10 text-left"
          id="loan-confirm-dialog"
        >
          {/* Header */}
          <div className="p-6 bg-rose-50/50 dark:bg-rose-950/10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center border border-rose-200 dark:border-rose-900/30">
                <ShieldAlert className="h-5.5 w-5.5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-[19px] font-black text-slate-900 dark:text-slate-100 tracking-tight">Save Remaining as Loan</h2>
                <p className="text-[12.5px] font-bold text-rose-700 dark:text-rose-450">Outstanding credit confirmation</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Customer Header Info */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Customer</p>
                <p className="text-[15px] font-black text-slate-900 dark:text-slate-100">{customer?.fullName || 'N/A'}</p>
              </div>
            </div>

            {/* Financial Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Current Total Bill:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">${totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-l border-slate-200 dark:border-slate-850 pl-4">
                <span>Previous Loan:</span>
                <span className="font-mono text-[#EF4444]">${previousLoan.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-850 pt-3">
                <span>Current Cash Paid:</span>
                <span className="font-mono text-[#16A34A]">${paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-l border-slate-200 dark:border-slate-850 pt-3 pl-4">
                <span className="text-[#EF4444] font-bold">Remaining Loan:</span>
                <span className="font-mono text-[#EF4444] font-black">+${remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Summary Banner */}
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center text-[14px]">
              <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#F59E0B]" />
                New Total Balance:
              </span>
              <span className="text-[18px] font-black text-[#EF4444] font-mono">${totalOutstanding.toFixed(2)}</span>
            </div>

            {/* Credit Limit Watchout */}
            {creditLimit > 0 && (
              <div className="flex justify-between items-center text-[12px] px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold">
                <span className="text-slate-500">Customer Credit Limit:</span>
                <span className={`font-mono font-bold ${limitBreached ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                  ${creditLimit.toFixed(2)} {limitBreached && '(EXCEEDED)'}
                </span>
              </div>
            )}

            {/* Warning Box */}
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[12px] font-bold text-rose-800 space-y-1 text-left leading-relaxed">
                <p className="uppercase tracking-wide text-[10px] font-black">Warning Account Modification</p>
                <p>
                  This will record <span className="font-mono text-[13px] font-black">${remainingAmount.toFixed(2)}</span> as a loan inside IndexedDB for 
                  Customer <span className="font-black text-slate-900 dark:text-slate-100">{customer?.fullName}</span>.
                </p>
                <p>Ensure payment forms and permissions are validated before booking this entry.</p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3 rounded-b-[20px]">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-5 h-11 border border-slate-200 dark:border-slate-700 rounded-xl text-[12.5px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              disabled={isProcessing}
              onClick={onConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 max-w-[200px] h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-[12.5px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Save as Loan</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(LoanConfirmationDialog);
