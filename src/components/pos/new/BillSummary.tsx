import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Tag, Percent, Truck, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BillSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  otherCharges: number;
  grandTotal: number;

  // Modifiers (for Adjust Order drawer)
  orderDiscount: number;
  setOrderDiscount: (val: number) => void;
  orderTax: number;
  setOrderTax: (val: number) => void;
  shippingCharge: number;
  setShipping: (val: number) => void;
  otherChargesCharge: number;
  setOtherCharges: (val: number) => void;

  // CRM integration values
  previousLoan?: number;
  cashPaid?: number;
  remainingLoan?: number;
  outstandingBalance?: number;
}

export const BillSummary: React.FC<BillSummaryProps> = ({
  subtotal = 0,
  discount = 0,
  tax = 0,
  shipping = 0,
  otherCharges = 0,
  grandTotal = 0,
  orderDiscount,
  setOrderDiscount,
  orderTax,
  setOrderTax,
  shippingCharge,
  setShipping,
  otherChargesCharge,
  setOtherCharges,
  previousLoan = 0,
  cashPaid = 0,
  remainingLoan = 0,
  outstandingBalance = 0,
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[16px] p-3.5 shadow-xs text-left flex flex-col gap-3 select-none"
      id="pos-bill-summary"
    >
      {/* 1. Header with title & Expandable Adjust Order drawer toggle */}
      <div className="flex justify-between items-center shrink-0">
        <h3 className="text-[15px] font-black text-slate-900 dark:text-slate-100">Order Summary</h3>
        <button
          type="button"
          id="cart-adjustments-tab-btn"
          onClick={() => setShowAdjustments(!showAdjustments)}
          className="text-[12.5px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Adjust Charges</span>
          {showAdjustments ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Adjust order drawer panel */}
      <AnimatePresence>
        {showAdjustments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-[#6B7280] dark:text-slate-400"
          >
            {/* Flat Order Discount */}
            <div className="flex flex-col gap-1 text-left">
              <span className="flex items-center gap-0.5 uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                <Tag className="h-3 w-3" />
                Order Discount ($)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                id="order-discount-input"
                value={orderDiscount || ''}
                onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-full h-8.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Global order tax rate */}
            <div className="flex flex-col gap-1 text-left">
              <span className="flex items-center gap-0.5 uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                <Percent className="h-3 w-3" />
                Global Tax (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={orderTax || ''}
                onChange={(e) => setOrderTax(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                placeholder="0"
                className="w-full h-8.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Shipping Fees */}
            <div className="flex flex-col gap-1 text-left">
              <span className="flex items-center gap-0.5 uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                <Truck className="h-3 w-3" />
                Shipping ($)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={shippingCharge || ''}
                onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-full h-8.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Other charges */}
            <div className="flex flex-col gap-1 text-left">
              <span className="flex items-center gap-0.5 uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">
                <Plus className="h-3 w-3" />
                Other Charges ($)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={otherChargesCharge || ''}
                onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-full h-8.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] font-extrabold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Breakdown Vertical rows (Subtotal, Discount, Tax, previous loans, paid amount) */}
      <div className="flex flex-col gap-2.5 text-[14px]" id="pos-bill-breakdown-details">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount Row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Discount Modifiers</span>
          <span className={`font-extrabold font-mono ${discount > 0 ? 'text-[#EF4444]' : 'text-slate-900 dark:text-slate-100'}`}>
            {discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00'}
          </span>
        </div>

        {/* Tax Row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Calculated Tax</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            +${tax.toFixed(2)}
          </span>
        </div>

        {/* Shipping Row */}
        {shipping > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Shipping</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              +${shipping.toFixed(2)}
            </span>
          </div>
        )}

        {/* Other Charges */}
        {otherCharges > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Other Charges</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              +${otherCharges.toFixed(2)}
            </span>
          </div>
        )}

        {/* CRM Previous Customer Loan (If applicable) */}
        {previousLoan > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-[13px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Info className="h-3 w-3 text-[#EF4444]" />
              CRM Previous Loan
            </span>
            <span className="font-extrabold text-[#EF4444] font-mono">
              +${previousLoan.toFixed(2)}
            </span>
          </div>
        )}

        {/* Current Bill Subtotal */}
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Current Transaction Bill</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            ${grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Cash Paid Received */}
        {cashPaid > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-[#16A34A] font-bold">Received Payment</span>
            <span className="font-black text-[#16A34A] font-mono">
              -${cashPaid.toFixed(2)}
            </span>
          </div>
        )}

        {/* Remaining Loan (For current invoice) */}
        {remainingLoan > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-[#DC2626] font-bold">New Invoice Loan</span>
            <span className="font-black text-[#DC2626] font-mono">
              +${remainingLoan.toFixed(2)}
            </span>
          </div>
        )}

        {/* CRM Outstanding Balance after sale */}
        {previousLoan > 0 && (
          <div className="flex items-center justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-2.5 text-[13.5px]">
            <span className="text-[#F59E0B] font-extrabold">Final Outstanding Balance</span>
            <span className="font-black text-[#F59E0B] font-mono">
              ${outstandingBalance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* 3. Horizontal Divider before Grand Total */}
      <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800" />

      {/* 4. Grand Total block with premium blue linear gradient */}
      <div
        className="rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 p-3 text-white flex items-center justify-between shadow-xs select-none"
        id="pos-grand-total-container"
      >
        <span className="text-[14px] font-black uppercase tracking-wider">
          Grand Total
        </span>
        <span className="text-[18px] font-black font-mono leading-none">
          ${grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default React.memo(BillSummary);
