import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Tag, Percent, Truck, Plus } from 'lucide-react';

export interface BillSummaryCardProps {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  otherCharges: number;
  grandTotal: number;
  
  // Modifiers
  orderDiscount: number;
  setOrderDiscount: (val: number) => void;
  orderTax: number;
  setOrderTax: (val: number) => void;
  shippingCharge: number;
  setShipping: (val: number) => void;
  otherChargesCharge: number;
  setOtherCharges: (val: number) => void;
}

export const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
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
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-sm text-left flex flex-col gap-3"
      id="pos-bill-summary-card"
    >
      {/* Header title with toggle button for adjustments */}
      <div className="flex justify-between items-center shrink-0">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Order Summary</h3>
        <button
          type="button"
          id="cart-adjustments-tab-btn"
          onClick={() => setShowAdjustments(!showAdjustments)}
          className="text-[12.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Adjust Order</span>
          {showAdjustments ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expandable Order Adjustments Form Panel */}
      {showAdjustments && (
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-1 duration-150 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {/* Order Discount */}
          <div className="flex flex-col gap-1 text-left">
            <span className="flex items-center gap-0.5 font-bold uppercase tracking-wide">
              <Tag className="h-3 w-3" />
              Discount ($)
            </span>
            <input
              type="number"
              min="0"
              step="any"
              id="order-discount-input"
              value={orderDiscount || ''}
              onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-full h-8.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[12.5px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
            />
          </div>

          {/* Order Tax Rate */}
          <div className="flex flex-col gap-1 text-left">
            <span className="flex items-center gap-0.5 font-bold uppercase tracking-wide">
              <Percent className="h-3 w-3" />
              Tax rate (%)
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={orderTax || ''}
              onChange={(e) => setOrderTax(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              placeholder="0%"
              className="w-full h-8.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[12.5px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
            />
          </div>

          {/* Shipping Fees */}
          <div className="flex flex-col gap-1 text-left">
            <span className="flex items-center gap-0.5 font-bold uppercase tracking-wide">
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
              className="w-full h-8.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[12.5px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
            />
          </div>

          {/* Other charges */}
          <div className="flex flex-col gap-1 text-left">
            <span className="flex items-center gap-0.5 font-bold uppercase tracking-wide">
              <Plus className="h-3 w-3" />
              Other charges ($)
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={otherChargesCharge || ''}
              onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-full h-8.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[12.5px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Bill summary Breakdown List */}
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-3" id="pos-bill-breakdown">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-[13.5px]">
          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-slate-500 dark:text-slate-400">Total Discount</span>
            <span className="font-bold text-[#EF4444] font-mono">
              -${discount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Tax */}
        {tax > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-slate-500 dark:text-slate-400">Order Tax (GST)</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              +${tax.toFixed(2)}
            </span>
          </div>
        )}

        {/* Shipping */}
        {shipping > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-slate-500 dark:text-slate-400">Shipping Fee</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              +${shipping.toFixed(2)}
            </span>
          </div>
        )}

        {/* Other Charges */}
        {otherCharges > 0 && (
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="text-slate-500 dark:text-slate-400">Other Charges</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              +${otherCharges.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="flex items-center justify-between mt-1 shrink-0" id="pos-bill-grand-total">
        <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Grand Total</span>
        <span className="text-[20px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
          ${grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default React.memo(BillSummaryCard);
