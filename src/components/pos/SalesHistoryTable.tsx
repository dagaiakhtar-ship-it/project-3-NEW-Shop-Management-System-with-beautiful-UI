import React from 'react';
import { Eye, Printer, Copy, Trash2, RotateCcw, Calendar, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { type Sale } from '../../database/db';
import { WhatsAppService } from '../../services/whatsappService';

interface SalesHistoryTableProps {
  sales: any[];
  onViewDetails: (sale: Sale) => void;
  onPrintReceipt: (sale: Sale, items: any[], customer: any, format: 'thermal' | 'a4') => void;
  onDuplicateSale: (items: any[]) => void;
  onSoftDelete: (id: number) => void;
  onRestore: (id: number) => void;
  isLoading: boolean;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({
  sales,
  onViewDetails,
  onPrintReceipt,
  onDuplicateSale,
  onSoftDelete,
  onRestore,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-52 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 animate-pulse">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-650" />
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-3">Fetching transaction records...</span>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 text-slate-400 p-6 shadow-xs">
        <div className="h-14 w-14 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-3">
          <FileSpreadsheet className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">No transaction entries found</p>
        <p className="text-[10px] text-slate-450 mt-1 max-w-xs leading-relaxed">
          Try expanding your date range filters, checking invoice ID typing, or selecting different customer accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm text-left">
      <table className="w-full pos-table-text text-xs text-left border-collapse min-w-[750px]">
        <thead>
          <tr className="bg-slate-50/55 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-850 pos-table-text text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
            <th className="py-4 px-4.5">Invoice #</th>
            <th className="py-4 px-4.5">Date</th>
            <th className="py-4 px-4.5">Customer</th>
            <th className="py-4 px-4.5 text-right">Total</th>
            <th className="py-4 px-4.5 text-right">Paid</th>
            <th className="py-4 px-4.5 text-right">Remaining</th>
            <th className="py-4 px-4.5 text-center">Status</th>
            <th className="py-4 px-4.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-650 dark:text-slate-350">
          {sales.map((sale) => {
            const isSaleDeleted = sale.isDeleted === true;
            const itemsList = sale.items || [];
            const totalVal = sale.grandTotal ?? sale.total ?? 0;
            const paidVal = sale.paidAmount ?? (sale.paymentStatus === 'Paid' ? totalVal : 0);
            const remainingVal = sale.remainingAmount ?? (sale.paymentStatus === 'Paid' ? 0 : totalVal);
            
            return (
              <tr
                key={sale.id}
                className={`hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition-colors ${
                  isSaleDeleted ? 'bg-rose-50/10 dark:bg-rose-950/5 opacity-80' : ''
                }`}
              >
                {/* Invoice Number */}
                <td className="py-3.5 px-4.5 font-mono font-black text-slate-850 dark:text-slate-100">
                  {sale.invoiceNumber || sale.invoiceNo}
                  {isSaleDeleted && (
                    <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-500 uppercase tracking-wider border border-rose-100 dark:border-rose-900/10">
                      Voided
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="py-3.5 px-4.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-550 dark:text-slate-450 font-mono text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()} {new Date(sale.saleDate || sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>

                {/* Customer name */}
                <td className="py-3.5 px-4.5 truncate max-w-[150px] pos-normal-text text-slate-800 dark:text-slate-200">
                  {sale.customerName || 'Walk-in Customer'}
                </td>

                {/* Grand Total */}
                <td className="py-3.5 px-4.5 font-mono font-black pos-price text-slate-900 dark:text-slate-100 text-right">
                  ${totalVal.toFixed(2)}
                </td>

                {/* Paid Amount */}
                <td className="py-3.5 px-4.5 font-mono font-bold pos-price text-emerald-600 dark:text-emerald-400 text-right">
                  ${paidVal.toFixed(2)}
                </td>

                {/* Remaining Amount */}
                <td className="py-3.5 px-4.5 font-mono font-bold pos-price text-slate-700 dark:text-slate-350 text-right">
                  ${remainingVal.toFixed(2)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4.5 text-center text-[9px]">
                  <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                    sale.paymentStatus === 'Paid'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : sale.paymentStatus === 'Partial'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                  }`}>
                    {sale.paymentStatus || 'Paid'}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View */}
                    <button
                      onClick={() => onViewDetails(sale)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/20 shadow-xs"
                      title="Inspect Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Send WhatsApp */}
                    {!isSaleDeleted && (
                      <button
                        onClick={() => WhatsAppService.sendWhatsApp(sale, itemsList)}
                        className="p-2 rounded-xl text-emerald-500 hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/20 shadow-xs"
                        title="Send via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}

                    {/* Print */}
                    {!isSaleDeleted && (
                      <>
                        <button
                          onClick={() => onPrintReceipt(sale, itemsList, null, 'thermal')}
                          className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition cursor-pointer border border-transparent hover:border-teal-100 dark:hover:border-teal-900/20 shadow-xs"
                          title="Thermal 80mm Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateSale(itemsList)}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/20 shadow-xs"
                          title="Copy Items to Active Cart"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Void / Restore */}
                    {isSaleDeleted ? (
                      <button
                        onClick={() => onRestore(sale.id!)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/20 shadow-xs"
                        title="Restore voided invoice"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onSoftDelete(sale.id!)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/20 shadow-xs"
                        title="Void Transaction Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalesHistoryTable;
