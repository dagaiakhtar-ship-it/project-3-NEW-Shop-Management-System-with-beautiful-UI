import React from 'react';
import { CreditCard, DollarSign, Wallet, FileText } from 'lucide-react';

interface PaymentCardProps {
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
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
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
}) => {
  const isCashSale = saleType === 'Cash Sale';
  const isCreditSale = saleType === 'Credit Sale';
  const isPartialSale = saleType === 'Partial Payment Sale';

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-sm text-left flex flex-col gap-3.5"
      id="pos-payment-card"
    >
      {/* Header Title */}
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
        <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <span>Billing & Payment details</span>
      </h3>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-2 gap-3" id="pos-payment-fields">
        {/* 1. Sale Type Selection */}
        <div className="flex flex-col gap-1 text-left col-span-2">
          <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sale Type
          </label>
          <select
            value={saleType}
            onChange={(e) => setSaleType(e.target.value as any)}
            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[13.5px] font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Cash Sale">💵 Cash Sale (Immediate Full Pay)</option>
            <option value="Credit Sale">💳 Credit Sale (Buy on Loan)</option>
            <option value="Partial Payment Sale">🌗 Partial Payment & Loan</option>
          </select>
        </div>

        {/* 2. Payment Method Selector */}
        {!isCreditSale && (
          <div className="flex flex-col gap-1 text-left col-span-2">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[13.5px] font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Cash">💵 Cash</option>
              <option value="Card">💳 Debit / Credit Card</option>
              <option value="EasyPaisa">📱 EasyPaisa Mobile Wallet</option>
              <option value="JazzCash">📲 JazzCash Mobile Wallet</option>
              <option value="Bank">🏦 Direct Bank Transfer</option>
            </select>
          </div>
        )}

        {/* 3. Cash Received Input (Only enabled when not Credit Sale) */}
        {!isCreditSale && (
          <div className="flex flex-col gap-1 text-left col-span-2">
            <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
              <span>{isPartialSale ? 'Partial Amount Received' : 'Cash Received / Given'}</span>
              {isCashSale && (
                <button
                  type="button"
                  onClick={() => setCashReceived(grandTotal)}
                  className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold lowercase hover:underline cursor-pointer"
                >
                  Exact Amount
                </button>
              )}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-455 text-[13px] font-bold font-mono">
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
                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[14px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* 4. Real-time Breakdown metrics */}
        <div className="grid grid-cols-2 gap-3 col-span-2 text-[12.5px] font-semibold border-t border-b border-slate-200/50 dark:border-slate-800/50 py-3 my-1">
          {/* Amount Paid indicator */}
          <div className="text-left flex flex-col justify-between">
            <span className="text-slate-500 dark:text-slate-400">Rec'd Amount:</span>
            <span className="font-mono text-[#22C55E] font-bold text-[14.5px]">
              ${paidAmount.toFixed(2)}
            </span>
          </div>

          {/* Change or Loan Balance indicator */}
          {isCashSale ? (
            <div className="text-right flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">Change Returned:</span>
              <span className="font-mono text-[#F59E0B] font-bold text-[14.5px]">
                ${changeReturned.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="text-right flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400">Outstanding Loan:</span>
              <span className="font-mono text-[#EF4444] font-bold text-[14.5px]">
                ${remainingAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* 5. Transaction notes input */}
        <div className="flex flex-col gap-1 text-left col-span-2 mt-0.5">
          <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Staff Transaction Notes</span>
          </label>
          <textarea
            rows={1.5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal details, delivery code, references..."
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[12.5px] text-slate-900 dark:text-slate-100 placeholder-slate-455 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PaymentCard);
