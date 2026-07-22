import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle2, Printer, FileDown, MessageSquare, Plus, Check 
} from 'lucide-react';
import { type Sale, type Customer } from '../../../database/db';

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  customer: Customer | null;
  onPrint: () => void;
  onPDF: () => void;
  onWhatsApp: () => void;
  onNewSale: () => void;
}

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  isOpen,
  onClose,
  sale,
  customer,
  onPrint,
  onPDF,
  onWhatsApp,
  onNewSale,
}) => {
  if (!isOpen || !sale) return null;

  const customerName = customer ? customer.fullName : (sale.customerName || 'Walk-in Customer');
  const amountPaid = sale.paidAmount ?? 0;
  const remainingLoan = sale.remainingAmount ?? 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Success Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.35 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-[24px] shadow-2xl border border-emerald-100 dark:border-emerald-950/30 overflow-hidden flex flex-col z-10 text-center p-8"
          id="payment-success-dialog"
        >
          {/* Header Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Animated Success Checkmark Graphic */}
          <div className="mx-auto flex justify-center mb-5 mt-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 10 }}
              className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/25 rounded-full flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30"
            >
              <CheckCircle2 className="h-9 w-9 text-[#22C55E]" />
            </motion.div>
          </div>

          <h2 className="text-[22px] font-black text-slate-900 dark:text-slate-100 tracking-tight">Payment Successful</h2>
          <p className="text-[13.5px] font-bold text-slate-500 dark:text-slate-400 mt-1">
            Invoice has been completed and finalized successfully.
          </p>

          {/* Transaction Metadata Brief */}
          <div className="my-6 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 text-left text-[13px] font-semibold text-slate-900 dark:text-slate-100 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Invoice Number</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{sale.invoiceNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer Name</span>
              <span className="font-bold">{customerName}</span>
            </div>
            <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-850" />
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Amount Paid / Collected</span>
              <span className="font-mono text-[#16A34A] font-black">${amountPaid.toFixed(2)}</span>
            </div>
            {remainingLoan > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Remaining Added Loan</span>
                <span className="font-mono text-[#EF4444] font-black">${remainingLoan.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Multi-action buttons toolbar */}
          <div className="space-y-3.5">
            {/* Start New Sale Action (Height 52px, Rounded 14px) */}
            <motion.button
              type="button"
              onClick={onNewSale}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-black text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Start New Sale</span>
            </motion.button>

            {/* Print, PDF, WhatsApp secondary row */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Print Receipt */}
              <button
                type="button"
                onClick={onPrint}
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[12px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              >
                <Printer className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>Print</span>
              </button>

              {/* Export PDF */}
              <button
                type="button"
                onClick={onPDF}
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[12px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              >
                <FileDown className="h-4.5 w-4.5 text-emerald-600" />
                <span>PDF</span>
              </button>

              {/* Send WhatsApp */}
              <button
                type="button"
                onClick={onWhatsApp}
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[12px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              >
                <MessageSquare className="h-4.5 w-4.5 text-green-600 animate-pulse" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Quick close link */}
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer block mx-auto pt-1"
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(PaymentSuccessDialog);
