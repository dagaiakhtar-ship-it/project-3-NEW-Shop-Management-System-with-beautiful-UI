import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, CreditCard, DollarSign, Calendar, FileText, 
  ArrowRight, ShieldCheck, ShoppingCart, Percent, Tag, Truck, Plus
} from 'lucide-react';
import { type Customer } from '../../../database/db';
import { type CartItem } from '../../../hooks/useCart';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer | null;
  cartItems: CartItem[];
  totals: {
    subtotal: number;
    totalDiscount: number;
    tax: number;
    shipping: number;
    otherCharges: number;
    grandTotal: number;
  };
  paymentDetails: {
    cashReceived: number;
    paidAmount: number;
    changeReturned: number;
    paymentMethod: string;
    saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
    notes?: string;
  };
  isProcessing: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customer,
  cartItems,
  totals,
  paymentDetails,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const previousLoan = customer ? (customer.currentBalance ?? customer.balance ?? 0) : 0;
  const remainingLoan = paymentDetails.saleType === 'Cash Sale' ? 0 : Math.max(0, totals.grandTotal - paymentDetails.paidAmount);
  const finalOutstanding = previousLoan + remainingLoan;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isProcessing ? undefined : onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Dialog Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-[680px] rounded-[20px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-10 text-left"
          id="checkout-confirm-dialog"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-[22px] font-black text-slate-900 dark:text-slate-100 tracking-tight">Complete Checkout</h2>
                <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Review the transaction before confirming.</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-350 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="p-7 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-none">
            {/* Row 1: Customer Summary & Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Summary */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Customer Summary</span>
                </h3>
                <div className="space-y-1.5">
                  <p className="text-[15px] font-black text-slate-900 dark:text-slate-100">
                    {customer ? customer.fullName : 'Walk-in Customer'}
                  </p>
                  {customer ? (
                    <div className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold space-y-1">
                      <p>Phone: {customer.phone || 'N/A'}</p>
                      <p>Credit Limit: <span className="font-mono">${(customer.creditLimit ?? 0).toFixed(2)}</span></p>
                      <p>Previous Loan: <span className="font-mono text-[#EF4444] font-bold">${previousLoan.toFixed(2)}</span></p>
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium italic">No customer assigned (Cash Sales only).</p>
                  )}
                </div>
              </div>

              {/* Invoice Information */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Invoice Information</span>
                </h3>
                <div className="text-[13px] text-slate-900 dark:text-slate-100 font-semibold space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
                    <span className="font-mono text-right flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Sale Type</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                      paymentDetails.saleType === 'Cash Sale' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
                      paymentDetails.saleType === 'Credit Sale' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {paymentDetails.saleType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Payment Method</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{paymentDetails.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Payment Information & Loan Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Payment Information */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                  <span>Payment Information</span>
                </h3>
                <div className="text-[13.5px] text-slate-900 dark:text-slate-100 space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cash Received</span>
                    <span className="font-mono font-bold">${paymentDetails.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#16A34A] font-bold">Paid / Applied Amount</span>
                    <span className="font-mono font-black text-[#16A34A]">${paymentDetails.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-[12.5px]">
                    <span className="text-slate-500 dark:text-slate-400">Change Returned</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">${paymentDetails.changeReturned.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#EF4444]" />
                  <span>Loan Information</span>
                </h3>
                <div className="text-[13.5px] text-slate-900 dark:text-slate-100 space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Previous Customer Loan</span>
                    <span className="font-mono">${previousLoan.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EF4444] font-bold">New Invoice Loan</span>
                    <span className="font-mono text-[#EF4444] font-black">+${remainingLoan.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-[12.5px]">
                    <span className="text-[#F59E0B] font-extrabold">Final Outstanding</span>
                    <span className="font-mono text-[#F59E0B] font-black">${finalOutstanding.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Items Mini List & Bill Summary */}
            <div className="bg-slate-50/50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-4">
              <h3 className="text-[13px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ShoppingCart className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>Transaction Totals</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-6 text-[13.5px] font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Subtotal</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</span>
                  <span className="font-mono text-[#EF4444] font-bold">-${totals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Percent className="h-3 w-3" /> Tax</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">+${totals.tax.toFixed(2)}</span>
                </div>
                {totals.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">+${totals.shipping.toFixed(2)}</span>
                  </div>
                )}
                {totals.otherCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Plus className="h-3 w-3" /> Other</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">+${totals.otherCharges.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {paymentDetails.notes && (
                <div className="text-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-500 dark:text-slate-400 font-medium italic mt-2 text-left">
                  <span className="font-bold text-slate-900 dark:text-slate-100 not-italic block mb-0.5">Cashier Notes:</span>
                  "{paymentDetails.notes}"
                </div>
              )}

              {/* Grand Total banner */}
              <div className="bg-linear-to-r from-indigo-600 to-indigo-700 rounded-xl p-4 text-white flex justify-between items-center shadow-md">
                <span className="text-[14px] font-black uppercase tracking-wider">Grand Total Amount</span>
                <span className="text-[24px] font-black font-mono leading-none">${totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-6 h-[52px] rounded-[14px] border border-slate-200 dark:border-slate-750 text-[14px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              disabled={isProcessing}
              onClick={onConfirm}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 max-w-[280px] h-[52px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[14px] rounded-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              <span>Complete Checkout</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(CheckoutDialog);
