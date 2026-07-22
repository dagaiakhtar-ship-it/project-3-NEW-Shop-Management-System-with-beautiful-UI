import React from 'react';
import Input from '../ui/Input';

interface PurchaseSummaryProps {
  subtotal: number;
  orderDiscount: number;
  onUpdateDiscount: (val: number) => void;
  orderTaxPercentage: number;
  onUpdateTaxPercentage: (val: number) => void;
  shippingCharges: number;
  onUpdateShippingCharges: (val: number) => void;
  otherCharges: number;
  onUpdateOtherCharges: (val: number) => void;
  taxAmount: number;
  grandTotal: number;
}

export const PurchaseSummary: React.FC<PurchaseSummaryProps> = ({
  subtotal,
  orderDiscount,
  onUpdateDiscount,
  orderTaxPercentage,
  onUpdateTaxPercentage,
  shippingCharges,
  onUpdateShippingCharges,
  otherCharges,
  onUpdateOtherCharges,
  taxAmount,
  grandTotal,
}) => {
  return (
    <div className="rounded-xl border border-slate-150/65 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-950 shadow-sm text-left">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-4">
        Purchase Order Adjustments
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discount Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Order Discount ($)
          </label>
          <Input
            type="number"
            min="0"
            className="font-mono text-xs"
            value={orderDiscount}
            onChange={(e) => onUpdateDiscount(Number(e.target.value))}
          />
        </div>

        {/* Tax Percentage Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Order Tax (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            className="font-mono text-xs"
            value={orderTaxPercentage}
            onChange={(e) => onUpdateTaxPercentage(Number(e.target.value))}
          />
        </div>

        {/* Shipping Charges Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Shipping Charges ($)
          </label>
          <Input
            type="number"
            min="0"
            className="font-mono text-xs"
            value={shippingCharges}
            onChange={(e) => onUpdateShippingCharges(Number(e.target.value))}
          />
        </div>

        {/* Other Charges Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Other Charges / Fees ($)
          </label>
          <Input
            type="number"
            min="0"
            className="font-mono text-xs"
            value={otherCharges}
            onChange={(e) => onUpdateOtherCharges(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-2 text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>Items Subtotal:</span>
          <span className="font-mono font-bold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {orderDiscount > 0 && (
          <div className="flex justify-between items-center text-red-500">
            <span>Order Discount:</span>
            <span className="font-mono font-bold">-${orderDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Order Tax ({orderTaxPercentage}%):</span>
            <span className="font-mono font-bold">${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {(shippingCharges > 0 || otherCharges > 0) && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Shipping & Charges:</span>
            <span className="font-mono font-bold">${(shippingCharges + otherCharges).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
          <span>Grand Total:</span>
          <span className="font-mono text-base text-indigo-600 dark:text-indigo-400">
            ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummary;
