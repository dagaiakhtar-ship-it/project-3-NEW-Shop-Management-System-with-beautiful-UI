import React from 'react';
import { type Purchase } from '../../database/db';
import Badge from '../ui/Badge';
import { Eye, Edit, Copy, Trash2, RotateCcw, Printer, ArrowUpDown, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface PurchaseTableProps {
  purchases: (Purchase & { supplierName: string; itemCount: number })[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  onPrint: (id: number) => void;
  sortBy: string;
  onSortChange: (field: string) => void;
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
  purchases,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  onPrint,
  sortBy,
  onSortChange,
}) => {
  const getPaymentStatusBadge = (status: 'Paid' | 'Partial' | 'Unpaid') => {
    if (status === 'Paid') return <Badge variant="success">Paid</Badge>;
    if (status === 'Partial') return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="danger">Unpaid</Badge>;
  };

  const getRecordStatusBadge = (status: string) => {
    if (status === 'Archived') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
          Soft Deleted
        </span>
      );
    }
    return null;
  };

  const handleHeaderClick = (field: string) => {
    onSortChange(field);
  };

  return (
    <div className="border border-slate-150/65 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-150/65 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="p-3 text-left">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('purchaseNumber')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  PO Number
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="p-3 text-left">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('supplierName')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  Supplier
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="p-3 text-left">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('newest')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  Purchase Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="p-3 text-center">Items</th>
              <th className="p-3 text-right">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('grandTotal')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white ml-auto"
                >
                  Grand Total
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 text-center">Payment Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length > 0 ? (
              purchases.map((p) => {
                const dateObj = new Date(p.purchaseDate);
                const formattedDate = isNaN(dateObj.getTime())
                  ? 'N/A'
                  : dateObj.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors text-left"
                  >
                    {/* PO Number */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {p.purchaseNumber}
                        </span>
                        {getRecordStatusBadge(p.status)}
                        {p.invoiceNumber && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            Inv: {p.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p.supplierName}
                    </td>

                    {/* Purchase Date */}
                    <td className="p-3 text-xs text-slate-550 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formattedDate}
                      </div>
                    </td>

                    {/* Item Count */}
                    <td className="p-3 text-center font-mono text-xs font-bold text-slate-550">
                      {p.itemCount}
                    </td>

                    {/* Grand Total */}
                    <td className="p-3 text-right font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      ${Number(p.grandTotal ?? p.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Paid */}
                    <td className="p-3 text-right font-mono text-xs font-bold text-green-600 dark:text-green-400">
                      ${Number(p.paidAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Remaining */}
                    <td className="p-3 text-right font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      ${Number(p.remainingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Payment Status */}
                    <td className="p-3 text-center">
                      {getPaymentStatusBadge(p.paymentStatus)}
                    </td>

                    {/* Actions Column */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => p.id && onView(p.id)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {p.status !== 'Archived' ? (
                          <>
                            {/* Edit Purchase */}
                            <button
                              type="button"
                              onClick={() => p.id && onEdit(p.id)}
                              title="Edit Purchase"
                              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 transition-all"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            {/* Duplicate Purchase */}
                            <button
                              type="button"
                              onClick={() => p.id && onDuplicate(p.id)}
                              title="Duplicate Purchase"
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Soft Delete */}
                            <button
                              type="button"
                              onClick={() => p.id && onDelete(p.id)}
                              title="Soft Delete"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          /* Restore Archived Record */
                          <button
                            type="button"
                            onClick={() => p.id && onRestore(p.id)}
                            title="Restore Record"
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 transition-all animate-pulse"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Print Invoice */}
                        <button
                          type="button"
                          onClick={() => p.id && onPrint(p.id)}
                          title="Print Purchase Invoice"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white transition-all"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs font-semibold text-slate-400">
                  No purchases found matching current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseTable;
