import React from 'react';
import { Calendar, DollarSign, FileText, ChevronRight } from 'lucide-react';
import { type CreditAccount } from '../../database/db';
import CreditStatusBadge from './CreditStatusBadge';

interface OutstandingInvoicesProps {
  invoices: CreditAccount[];
  onSelectInvoice?: (invoice: CreditAccount) => void;
}

export const OutstandingInvoices: React.FC<OutstandingInvoicesProps> = ({
  invoices,
  onSelectInvoice,
}) => {
  const activeInvoices = invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled');

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-xs">
      <div>
        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-indigo-500" />
          Outstanding Credit Invoices ({activeInvoices.length})
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
          Breakdown of unpaid or partially paid sales invoices currently accumulating debt.
        </p>
      </div>

      {activeInvoices.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <p className="text-[10px] font-black uppercase tracking-wider">No Outstanding Debts</p>
          <p className="text-[9px] text-slate-400 mt-0.5">This customer has fully settled all invoice accounts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
          {activeInvoices.map((inv) => {
            const isOverdue = inv.dueDate ? new Date(inv.dueDate) < new Date() : false;

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice?.(inv)}
                className={`p-3.5 border rounded-xl flex flex-col gap-2 transition hover:shadow-xs cursor-pointer ${
                  isOverdue
                    ? 'border-rose-100 bg-rose-500/5 hover:bg-rose-500/10 dark:border-rose-950 dark:bg-rose-950/10'
                    : 'border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-700'
                }`}
              >
                {/* Invoice No and status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </span>
                  <CreditStatusBadge status={isOverdue ? 'Overdue' : inv.status || 'Unpaid'} />
                </div>

                {/* Details list */}
                <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex justify-between">
                    <span>Invoice Amount:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${(inv.invoiceAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid to date:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ${(inv.paidAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black border-t border-slate-50 dark:border-slate-800/50 pt-1 mt-1 text-slate-800 dark:text-slate-200">
                    <span>Remaining Due:</span>
                    <span className="font-mono text-rose-500">
                      ${(inv.remainingAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Due Date bar */}
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 mt-0.5 border-t border-slate-50 dark:border-slate-800/40 pt-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>DUE: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OutstandingInvoices;
