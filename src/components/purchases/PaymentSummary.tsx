import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Badge from '../ui/Badge';

interface PaymentSummaryProps {
  paidAmount: number;
  onUpdatePaidAmount: (val: number) => void;
  remainingAmount: number;
  paymentMethod: string;
  onUpdatePaymentMethod: (val: string) => void;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  notes: string;
  onUpdateNotes: (val: string) => void;
  grandTotal: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  paidAmount,
  onUpdatePaidAmount,
  remainingAmount,
  paymentMethod,
  onUpdatePaymentMethod,
  paymentStatus,
  notes,
  onUpdateNotes,
  grandTotal,
}) => {
  const methodOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank', label: 'Bank Transfer' },
    { value: 'EasyPaisa', label: 'EasyPaisa' },
    { value: 'JazzCash', label: 'JazzCash' },
    { value: 'Card', label: 'Debit/Credit Card' },
    { value: 'Other', label: 'Other' },
  ];

  const getStatusBadgeVariant = () => {
    if (paymentStatus === 'Paid') return 'success';
    if (paymentStatus === 'Partial') return 'warning';
    return 'danger';
  };

  return (
    <div className="rounded-xl border border-slate-150/65 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-950 shadow-sm text-left">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-4">
        Billing & Payment Information
      </h3>

      <div className="flex flex-col gap-4">
        {/* Paid Amount */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Paid Amount ($)
          </label>
          <Input
            type="number"
            min="0"
            max={grandTotal}
            step="0.01"
            className="font-mono text-xs"
            value={paidAmount}
            onChange={(e) => onUpdatePaidAmount(Number(e.target.value))}
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Payment Method
          </label>
          <Select
            options={methodOptions}
            value={paymentMethod}
            onChange={onUpdatePaymentMethod}
            placeholder="Select payment method..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Purchase Notes / Remarks
          </label>
          <TextArea
            className="text-xs"
            rows={3}
            placeholder="Enter any supplier instructions, order references..."
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
          />
        </div>

        {/* Live Calculation Output Status Panel */}
        <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Auto Calculated Status:</span>
            <Badge variant={getStatusBadgeVariant()} size="sm">
              {paymentStatus}
            </Badge>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="font-semibold text-slate-500">Outstanding Accounts Payable:</span>
            <span className={`font-mono font-black text-sm ${remainingAmount > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-green-600 dark:text-green-400'}`}>
              ${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
