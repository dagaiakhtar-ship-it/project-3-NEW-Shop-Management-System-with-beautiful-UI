import React, { useState } from 'react';
import { CreditCard, DollarSign, FileText, Percent, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentPanelProps {
  saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
  setSaleType: (type: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale') => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cashReceived: number;
  setCashReceived: (cash: number) => void;
  paidAmount: number;
  changeReturned: number;
  remainingAmount: number;
  grandTotal: number;
  notes: string;
  setNotes: (notes: string) => void;

  // Optional/Advanced modifiers (from summary) to place in payment/modifiers
  orderDiscount?: number;
  setOrderDiscount?: (val: number) => void;
  orderTax?: number;
  setOrderTax?: (val: number) => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  saleType,
  setSaleType,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  paidAmount,
  changeReturned,
  remainingAmount,
  grandTotal,
  notes,
  setNotes,
  orderDiscount = 0,
  setOrderDiscount,
  orderTax = 0,
  setOrderTax,
}) => {
  const isCreditSale = saleType === 'Credit Sale';
  const isCashSale = saleType === 'Cash Sale';
  const isPartialSale = saleType === 'Partial Payment Sale';

  // State to support Flat vs Percentage discount selection in UI, while writing back flat values to orderDiscount
  const [discountMode, setDiscountMode] = useState<'flat' | 'percent'>('flat');
  const [discountInputValue, setDiscountInputValue] = useState<number>(orderDiscount);

  // Sync internal discount input with parent when it is reset or changes from outside
  React.useEffect(() => {
    if (orderDiscount === 0) {
      setDiscountInputValue((prev) => (prev === 0 ? prev : 0));
    } else if (discountMode === 'flat') {
      setDiscountInputValue((prev) => (prev === orderDiscount ? prev : orderDiscount));
    }
  }, [orderDiscount, discountMode]);

  // Sync internal discount input with parent
  const handleDiscountInputChange = (val: number) => {
    setDiscountInputValue(val);
    if (setOrderDiscount) {
      if (discountMode === 'flat') {
        setOrderDiscount(val);
      } else {
        // percentage, write back calculated absolute flat discount
        const calculatedDiscount = (val / 100) * grandTotal;
        setOrderDiscount(Math.min(grandTotal, calculatedDiscount));
      }
    }
  };

  const toggleDiscountMode = (mode: 'flat' | 'percent') => {
    setDiscountMode(mode);
    setDiscountInputValue(0);
    if (setOrderDiscount) setOrderDiscount(0);
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] p-3.5 shadow-xs text-left flex flex-col gap-3 select-none"
      id="pos-payment-panel"
    >
      {/* Header title */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-600/10 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <CreditCard className="h-4.5 w-4.5 stroke-[2.5]" />
        </div>
        <h3 className="text-[15px] font-black text-slate-900 dark:text-slate-100">
          Billing & Payment Panel
        </h3>
      </div>

      {/* Sale Type Selector */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Sale Type
        </label>
        <select
          value={saleType}
          onChange={(e) => setSaleType(e.target.value as any)}
          className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-[13.5px] font-extrabold text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
        >
          <option value="Cash Sale">💵 Cash Sale (Immediate Full Pay)</option>
          <option value="Credit Sale">💳 Credit Sale (Buy on Loan)</option>
          <option value="Partial Payment Sale">🌗 Partial Payment & Loan</option>
        </select>
      </div>

      {/* Payment Method Selector (Only when not full credit purchase) */}
      {!isCreditSale && (
        <div className="flex flex-col gap-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-[13.5px] font-extrabold text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
          >
            <option value="Cash">💵 Cash</option>
            <option value="Card">💳 Debit / Credit Card</option>
            <option value="EasyPaisa">📱 EasyPaisa Mobile Wallet</option>
            <option value="JazzCash">📲 JazzCash Mobile Wallet</option>
            <option value="Bank">🏦 Direct Bank Transfer</option>
          </select>
        </div>
      )}

      {/* Modifier Row: Discount type, discount value, tax percentage */}
      <div className="grid grid-cols-2 gap-3.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-3.5">
        {/* Discount Value with Flat/Percentage Toggle */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[13px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Discount</span>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => toggleDiscountMode('flat')}
                className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${
                  discountMode === 'flat' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                $
              </button>
              <button
                type="button"
                onClick={() => toggleDiscountMode('percent')}
                className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${
                  discountMode === 'percent' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                %
              </button>
            </div>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              {discountMode === 'flat' ? <Tag className="h-3.5 w-3.5" /> : <Percent className="h-3.5 w-3.5" />}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={discountInputValue || ''}
              onChange={(e) => handleDiscountInputChange(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="w-full h-[40px] pl-8.5 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-[14px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Tax Percentage */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[13px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
            Tax (%)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <Percent className="h-3.5 w-3.5" />
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={orderTax || ''}
              onChange={(e) => setOrderTax && setOrderTax(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              placeholder="0"
              className="w-full h-[40px] pl-8.5 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-[14px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Cash Paid Received Input Box */}
      {!isCreditSale && (
        <div className="flex flex-col gap-1.5 text-left border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
          <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>{isPartialSale ? 'Partial Cash Paid' : 'Cash Paid / Received'}</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-900 dark:text-slate-100 text-[15px] font-black font-mono">
              $
            </span>
            <input
              type="number"
              min="0"
              step="any"
              id="paid-amount-input"
              placeholder="0.00"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-11 pl-8 pr-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 rounded-xl text-[16px] font-black font-mono text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
            />
          </div>

          {/* Quick billing tender hot buttons (100%, 50%, Exact, Clear) */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCashReceived(grandTotal)}
              className="h-8.5 text-[11px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer flex items-center justify-center shadow-3xs"
            >
              100%
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCashReceived(Math.round((grandTotal / 2) * 100) / 100)}
              className="h-8.5 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-600/10 dark:bg-indigo-950/30 hover:bg-indigo-600/15 dark:hover:bg-indigo-900/45 border border-indigo-500/15 rounded-lg cursor-pointer flex items-center justify-center"
            >
              50%
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCashReceived(grandTotal)}
              className="h-8.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700"
            >
              Exact
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCashReceived(0)}
              className="h-8.5 text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/15 border border-[#EF4444]/15 rounded-lg cursor-pointer flex items-center justify-center"
            >
              Clear
            </motion.button>
          </div>
        </div>
      )}

      {/* Real-time read-only change returned, remaining loan breakdowns */}
      <div className="grid grid-cols-2 gap-3 text-[13px] font-bold bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Remaining / Loan Amount indicator */}
        <div className="text-left flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400">Rec'd Amount:</span>
          <span className="font-mono text-[#16A34A] font-black text-[15px] mt-1">
            ${paidAmount.toFixed(2)}
          </span>
        </div>

        {/* Change Return / Remaining Balance indicator */}
        {isCashSale ? (
          <div className="text-right flex flex-col justify-between">
            <span className="text-slate-500 dark:text-slate-400">Change Return:</span>
            <span className="font-mono text-[#F59E0B] font-black text-[15px] mt-1">
              ${changeReturned.toFixed(2)}
            </span>
          </div>
        ) : (
          <div className="text-right flex flex-col justify-between">
            <span className="text-slate-500 dark:text-slate-400">Loan Balance:</span>
            <span className="font-mono text-[#EF4444] font-black text-[15px] mt-1">
              ${remainingAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Transaction Notes textarea */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>Staff Sale Notes</span>
        </label>
        <textarea
          rows={1.5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add memo/customer credit agreements..."
          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-455 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium"
        />
      </div>
    </div>
  );
};

export default React.memo(PaymentPanel);
