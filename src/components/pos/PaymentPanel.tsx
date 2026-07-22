import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Check, Printer, AlertTriangle, ArrowRight, Pause, Ban, FolderOpen } from 'lucide-react';
import { type Customer } from '../../database/db';
import Button from '../ui/Button';
import showToast from '../../utils/toast';

interface PaymentPanelProps {
  grandTotal: number;
  customer: Customer | null;
  onCheckout: (billing: {
    paidAmount: number;
    remainingAmount: number;
    cashReceived: number;
    changeReturned: number;
    paymentMethod: string;
    saleType: 'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale';
    notes?: string;
    printFormat: 'thermal' | 'a4' | 'none';
  }) => void;
  isProcessing: boolean;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  grandTotal,
  customer,
  onCheckout,
  isProcessing,
}) => {
  const [saleType, setSaleType] = useState<'Cash Sale' | 'Credit Sale' | 'Partial Payment Sale'>('Cash Sale');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4' | 'none'>('thermal');

  // Sync paidAmount with grandTotal if Cash Sale
  useEffect(() => {
    if (saleType === 'Cash Sale') {
      setPaidAmount(grandTotal);
      if (cashReceived < grandTotal) {
        setCashReceived(grandTotal);
      }
    } else if (saleType === 'Credit Sale') {
      setPaidAmount(0);
      setCashReceived(0);
    }
  }, [saleType, grandTotal]);

  // Calculations
  const remainingAmount = Math.max(0, grandTotal - paidAmount);
  const changeReturned = cashReceived > paidAmount ? cashReceived - paidAmount : 0;

  // Quick cash additions ( Pakistan/South Asia/Global premium cash denominations)
  const handleQuickCash = (amount: number) => {
    setCashReceived((prev) => prev + amount);
    showToast.success(`Added $${amount} to cash received`);
  };

  const handleSetExactCash = () => {
    setCashReceived(paidAmount);
  };

  const handleClearCash = () => {
    setCashReceived(0);
  };

  const handleSubmit = () => {
    onCheckout({
      paidAmount,
      remainingAmount,
      cashReceived,
      changeReturned,
      paymentMethod,
      saleType,
      notes,
      printFormat,
    });
  };

  // Mock actions for POS Suspend/Draft flows
  const handleSuspendSale = () => {
    if (grandTotal <= 0) {
      showToast.error("Cannot suspend an empty transaction.");
      return;
    }
    showToast.success("Sale suspended successfully and synced to drafts queue.");
  };

  const handleHoldSale = () => {
    if (grandTotal <= 0) {
      showToast.error("Cannot hold an empty transaction.");
      return;
    }
    showToast.success("Sale placed on hold. Ticket #POS-HOLD-092 is printed.");
  };

  const handleCancelSale = () => {
    if (grandTotal <= 0) {
      showToast.error("No active sale to cancel.");
      return;
    }
    window.location.reload(); // simple force restart / reload page state
  };

  const isCheckoutDisabled =
    isProcessing ||
    grandTotal <= 0 ||
    // Credit requires a registered customer
    ((saleType === 'Credit Sale' || saleType === 'Partial Payment Sale') && !customer) ||
    // Credit limit check
    (saleType === 'Credit Sale' && customer && (customer.creditLimit ?? 0) > 0 && remainingAmount > (customer.creditLimit ?? 0));

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-950 p-4 border border-slate-200/70 dark:border-slate-800/80 rounded-xl shadow-xs text-left h-full justify-between transition-all">
      <div className="flex flex-col gap-3.5">
        
        {/* Header */}
        <h3 className="text-xs font-bold text-slate-855 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2.5">
          <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
          Checkout & Payment
        </h3>

        {/* 1. Sale Term Picker */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Payment Term</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'Cash Sale', label: 'Cash Full', icon: '💵' },
              { value: 'Credit Sale', label: 'Credit Full', icon: '💳' },
              { value: 'Partial Payment Sale', label: 'Partial', icon: '📝' },
            ].map((term) => (
              <button
                key={term.value}
                type="button"
                onClick={() => setSaleType(term.value as any)}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                  saleType === term.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-[13px] mb-0.5">{term.icon}</div>
                <div>{term.label}</div>
              </button>
            ))}
          </div>
          
          {/* Registered customer warning for credit sales */}
          {(saleType === 'Credit Sale' || saleType === 'Partial Payment Sale') && !customer && (
            <div className="flex items-start gap-2 p-2 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-lg mt-2 text-[10px] font-medium text-rose-650 dark:text-rose-400 leading-normal">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>Requires registered customer profile.</span>
            </div>
          )}
        </div>

        {/* 2. Payment Channel cards */}
        {saleType !== 'Credit Sale' && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'Cash', label: 'Cash', icon: '💵' },
                { value: 'Card', label: 'Card', icon: '💳' },
                { value: 'EasyPaisa', label: 'Paisa', icon: '📱' },
                { value: 'JazzCash', label: 'Jazz', icon: '📲' },
                { value: 'Bank', label: 'Bank', icon: '🏦' },
                { value: 'Other', label: 'Other', icon: '⚙️' },
              ].map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`py-1.5 px-0.5 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentMethod === pm.value
                      ? 'bg-emerald-605 border-emerald-600 dark:bg-emerald-600/90 text-white shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-105 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="mr-1">{pm.icon}</span>
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Numeric input fields */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Paid amount field */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Paid Amount ($)</span>
            <input
              id="paid-amount-input"
              type="number"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(Math.min(grandTotal, Math.max(0, Number(e.target.value))))}
              disabled={saleType === 'Cash Sale' || saleType === 'Credit Sale'}
              className="w-full py-2 px-3 text-xs font-bold font-mono rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-100 transition-all"
              placeholder="0.00"
            />
          </div>

          {/* Remaining Debt field */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Outstanding Debt ($)</span>
            <div className="w-full py-2 px-3 text-xs font-bold font-mono rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950 text-slate-650 dark:text-slate-400">
              ${remainingAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Cash received calculator */}
        {saleType !== 'Credit Sale' && (
          <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cash Received ($)</span>
              
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase">
                <button onClick={handleSetExactCash} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Exact Total</button>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <button onClick={handleClearCash} className="text-rose-500 hover:underline cursor-pointer">Reset</button>
              </div>
            </div>
            
            <input
              type="number"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(Math.max(0, Number(e.target.value)))}
              className="w-full py-2 px-3.5 text-sm font-bold font-mono rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 transition-all"
              placeholder="0.00"
            />

            {/* Quick cash Denomination Buttons */}
            <div className="grid grid-cols-5 gap-1">
              {[10, 20, 50, 100, 500].map((denom) => (
                <button
                  key={denom}
                  type="button"
                  onClick={() => handleQuickCash(denom)}
                  className="py-1 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  +{denom}
                </button>
              ))}
            </div>

            {/* Change returned details */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/15 mt-1 transition-all">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">Change to Return</span>
              <span className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400 font-mono leading-none">
                ${changeReturned.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* 4. Receipt templates */}
        <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-0.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Receipt Output Template</label>
          <select
            value={printFormat}
            onChange={(e) => setPrintFormat(e.target.value as any)}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer transition-all"
          >
            <option value="thermal">🖨️ Thermal 80mm</option>
            <option value="a4">📄 Standard A4</option>
            <option value="none">🚫 Skip Receipt</option>
          </select>
        </div>

        {/* Transaction remarks */}
        <div className="mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Transaction Notes / Reference</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 bg-slate-55/30 dark:bg-slate-900 rounded-lg resize-none h-11 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400"
            placeholder="Reference code, spec..."
          />
        </div>
      </div>

      {/* Primary Action Submit button & Secondary Suspends */}
      <div className="border-t border-slate-100 dark:border-slate-850 pt-2 mt-1 flex flex-col gap-2 w-full">
        {/* Secondary holds & suspends */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleSuspendSale}
            className="py-1 text-[9px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
          >
            <Pause className="h-3 w-3 text-indigo-500" />
            Suspend
          </button>
          <button
            type="button"
            onClick={handleHoldSale}
            className="py-1 text-[9px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
          >
            <FolderOpen className="h-3 w-3 text-amber-500" />
            Hold
          </button>
          <button
            type="button"
            onClick={handleCancelSale}
            className="py-1 text-[9px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-650 dark:text-slate-400 flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
          >
            <Ban className="h-3 w-3 text-rose-500" />
            Cancel
          </button>
        </div>

         <Button
          id="checkout-submit-btn"
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={isCheckoutDisabled}
          isLoading={isProcessing}
          className="w-full flex items-center justify-center gap-1 font-bold uppercase text-[10.5px] tracking-wider py-2 shadow-sm shadow-indigo-650/10"
        >
          <Check className="h-4 w-4" />
          Complete POS Checkout
        </Button>
      </div>
    </div>
  );
};

export default PaymentPanel;
