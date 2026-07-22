import React, { useState, useRef } from 'react';
import { History, Trash2, Printer, CheckCircle, FileText, Calendar, DollarSign, User, X } from 'lucide-react';
import { type CreditPayment } from '../../database/db';
import { useReceivePayment } from '../../hooks/useCredit';
import { usePrint } from '../../hooks/usePrint';
import Button from '../ui/Button';

interface PaymentHistoryTableProps {
  payments: CreditPayment[];
  customerName: string;
  customerPhone?: string;
  onRefresh: () => void;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  customerName,
  customerPhone = '',
  onRefresh,
}) => {
  const { reversePayment, isProcessing } = useReceivePayment();
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<CreditPayment | null>(null);

  const voucherRef = useRef<HTMLDivElement>(null);
  const { triggerPrint } = usePrint(voucherRef, 'Thermal_80mm');

  const handleReverse = async (paymentId: number) => {
    if (confirm('Are you absolutely sure you want to reverse (void) this payment? This will restore the customer’s outstanding debt balances accordingly.')) {
      const ok = await reversePayment(paymentId);
      if (ok) onRefresh();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-xs">
      
      {/* Header bar */}
      <div>
        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <History className="h-4 w-4 text-indigo-500" />
          Receipt & Payment History
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
          List of historic installments and payment vouchers recorded on this customer profile.
        </p>
      </div>

      {/* History table */}
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <th className="py-2.5 px-4">Date Recv</th>
              <th className="py-2.5 px-4">Recpt ID</th>
              <th className="py-2.5 px-4">Payment Method</th>
              <th className="py-2.5 px-4">Ref Number</th>
              <th className="py-2.5 px-4 text-right">Amount Paid</th>
              <th className="py-2.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-semibold text-slate-700 dark:text-slate-300">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No installment payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10">
                  <td className="py-2.5 px-4 text-[10px] text-slate-400">
                    {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    REC-{String(p.id).padStart(5, '0')}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {p.referenceNumber || p.referenceNo || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-600">
                    ${p.amount.toFixed(2)}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Thermal Voucher */}
                      <button
                        onClick={() => setSelectedReceiptPayment(p)}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer text-slate-550 transition duration-150"
                        title="View Thermal Receipt Voucher"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Reverse / Void */}
                      <button
                        onClick={() => handleReverse(p.id!)}
                        disabled={isProcessing}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer text-slate-550 transition duration-150 disabled:opacity-50"
                        title="Reverse Transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Popover Receipt Modal */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200 no-print">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-2xl dark:bg-slate-900 border border-slate-150 dark:border-slate-800 animate-in zoom-in-95 duration-200 font-mono text-xs text-slate-800 dark:text-slate-100">
            
            {/* Thermal Slip outline */}
            <div ref={voucherRef} className="border border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl flex flex-col gap-3 bg-amber-50/15 dark:bg-slate-950/40 relative">
              
              <button 
                onClick={() => setSelectedReceiptPayment(null)} 
                className="absolute right-3.5 top-3.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer no-print"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>

              <div className="text-center flex flex-col gap-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2.5">
                <h4 className="font-black text-slate-950 dark:text-white tracking-widest text-[13px] uppercase">
                  RETAIL SHOP VOUCHER
                </h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Payment Collection Receipt
                </p>
              </div>

              {/* Receipt metadata */}
              <div className="flex flex-col gap-1.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2.5">
                <div className="flex justify-between">
                  <span>VOUCHER ID:</span>
                  <span className="font-bold">REC-{String(selectedReceiptPayment.id).padStart(5, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE & TIME:</span>
                  <span className="font-bold">
                    {new Date(selectedReceiptPayment.paymentDate || selectedReceiptPayment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase">{customerName}</span>
                </div>
                {customerPhone && (
                  <div className="flex justify-between">
                    <span>CONTACT NO:</span>
                    <span className="font-bold">{customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Allocation values */}
              <div className="flex flex-col gap-1.5 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2.5">
                <div className="flex justify-between text-slate-500">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold">{selectedReceiptPayment.paymentMethod}</span>
                </div>
                {selectedReceiptPayment.referenceNumber && (
                  <div className="flex justify-between text-slate-500">
                    <span>REF NUMBER:</span>
                    <span className="font-bold">{selectedReceiptPayment.referenceNumber}</span>
                  </div>
                )}
                {selectedReceiptPayment.receivedBy && (
                  <div className="flex justify-between text-slate-500">
                    <span>CASHIER USER:</span>
                    <span className="font-bold">{selectedReceiptPayment.receivedBy}</span>
                  </div>
                )}
              </div>

              {/* Total block */}
              <div className="flex flex-col gap-1 text-center py-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg">
                <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">
                  Cash Paid & Settled
                </span>
                <span className="text-xl font-black text-emerald-600 tracking-wider">
                  ${selectedReceiptPayment.amount.toFixed(2)}
                </span>
              </div>

              {selectedReceiptPayment.notes && (
                <div className="text-[10px] text-slate-400 italic leading-snug">
                  Remarks: {selectedReceiptPayment.notes}
                </div>
              )}

              <div className="text-center text-[9px] text-slate-400 border-t border-dashed border-slate-300 dark:border-slate-700 pt-2.5 mt-1 uppercase font-bold tracking-widest">
                Thank you for your business!
              </div>

            </div>

            {/* Print button */}
            <div className="flex items-center justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReceiptPayment(null)}
              >
                Close Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1 ml-2"
                onClick={() => {
                  triggerPrint();
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Print Voucher
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentHistoryTable;
