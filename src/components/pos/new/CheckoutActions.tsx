import React from 'react';
import {
  PlayCircle,
  Trash2,
  Printer,
  Loader2,
  Pause,
  FolderLock,
  FileDown,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'motion/react';
import showToast from '../../../utils/toast';

interface CheckoutActionsProps {
  onSubmit: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  isDisabled?: boolean;
  printFormat: 'thermal' | 'a4' | 'none';
  setPrintFormat: (format: 'thermal' | 'a4' | 'none') => void;
  onQuickPrint?: () => void;
}

export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
  onSubmit,
  onCancel,
  isProcessing = false,
  isDisabled = false,
  printFormat,
  setPrintFormat,
  onQuickPrint,
}) => {
  // Mock action helpers for Hold, Suspend, PDF, WhatsApp
  const handleHoldSale = () => {
    showToast.success('Current transaction saved to Held Memory Parking.');
  };

  const handleSuspendSale = () => {
    showToast.success('Sale Suspended. Cashier can resume it from the Dashboard.');
  };

  const handlePDFGeneration = () => {
    showToast.success('Generating high-fidelity PDF invoice...');
    if (onQuickPrint) {
      setTimeout(() => {
        onQuickPrint();
      }, 1000);
    }
  };

  const handleWhatsAppSend = () => {
    showToast.success('Sending receipt payload link via WhatsApp...');
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] p-3.5 shadow-xs text-left flex flex-col gap-3 select-none"
      id="pos-checkout-actions-panel"
    >
      <h3 className="text-[14px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
        Checkout Panel Actions
      </h3>

      {/* 1. Print Format Selector Row */}
      <div className="flex flex-col gap-1.5" id="pos-print-format-selector">
        <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Receipt Print Format</span>
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPrintFormat('thermal')}
            className={`py-1.5 text-[12px] font-bold rounded-lg cursor-pointer transition-all duration-150 text-center ${
              printFormat === 'thermal'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            🔥 Thermal
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('a4')}
            className={`py-1.5 text-[12px] font-bold rounded-lg cursor-pointer transition-all duration-150 text-center ${
              printFormat === 'a4'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            📄 A4 Invoice
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('none')}
            className={`py-1.5 text-[12px] font-bold rounded-lg cursor-pointer transition-all duration-150 text-center ${
              printFormat === 'none'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            ❌ None
          </button>
        </div>
      </div>

      {/* 2. Primary Checkout Button (Height 40px) */}
      <motion.button
        type="button"
        id="checkout-submit-btn"
        disabled={isDisabled || isProcessing}
        onClick={onSubmit}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-[14px] transition-all duration-200 shadow-sm cursor-pointer ${
          isDisabled
            ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-550 cursor-not-allowed'
            : 'bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white hover:shadow-md'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PlayCircle className="h-5 w-5" />
        )}
        <span>{isProcessing ? 'Processing Transaction...' : 'Complete Checkout (F5)'}</span>
      </motion.button>

      {/* 3. Secondary Actions Row: Cancel, Hold, Suspend */}
      <div className="grid grid-cols-3 gap-2">
        {/* Cancel Sale */}
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 text-rose-600 dark:text-rose-450 hover:bg-rose-500/15 text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Cancel Sale"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Cancel</span>
        </motion.button>

        {/* Hold Sale */}
        <motion.button
          type="button"
          onClick={handleHoldSale}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Hold Sale"
        >
          <Pause className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span>Hold</span>
        </motion.button>

        {/* Suspend Sale */}
        <motion.button
          type="button"
          onClick={handleSuspendSale}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Suspend Sale"
        >
          <FolderLock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Suspend</span>
        </motion.button>
      </div>

      {/* 4. Media Actions Row: Print, PDF, WhatsApp */}
      <div className="grid grid-cols-3 gap-2">
        {/* Print Button */}
        <motion.button
          type="button"
          onClick={onQuickPrint}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-indigo-600/10 dark:bg-indigo-950/20 border border-indigo-500/15 hover:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-bold text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Direct Print receipt"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print</span>
        </motion.button>

        {/* PDF Button */}
        <motion.button
          type="button"
          onClick={handlePDFGeneration}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Export receipt as PDF file"
        >
          <FileDown className="h-3.5 w-3.5 text-emerald-600" />
          <span>PDF</span>
        </motion.button>

        {/* WhatsApp Button */}
        <motion.button
          type="button"
          onClick={handleWhatsAppSend}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-[42px] bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[12px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer shadow-3xs"
          title="Forward invoice to WhatsApp number"
        >
          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
          <span>WhatsApp</span>
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(CheckoutActions);
