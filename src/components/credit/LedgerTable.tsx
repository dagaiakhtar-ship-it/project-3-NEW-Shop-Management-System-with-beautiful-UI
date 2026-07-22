import React from 'react';
import { FileText, Printer, ArrowDownCircle, ArrowUpRight } from 'lucide-react';

interface LedgerEntry {
  date: Date;
  reference: string;
  description: string;
  type: 'Debit' | 'Credit' | 'Opening' | 'Adjustment';
  debit: number;
  credit: number;
  balance: number;
  notes?: string;
}

interface LedgerTableProps {
  openingBalance: number;
  ledgerEntries: LedgerEntry[];
  closingBalance: number;
  customerName: string;
  onPrint: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  openingBalance,
  ledgerEntries,
  closingBalance,
  customerName,
  onPrint,
}) => {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-xs">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-900 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-500" />
            Customer Statement Ledger
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Chronological statement ledger for <span className="text-slate-700 dark:text-slate-200 font-bold">{customerName}</span>
          </p>
        </div>

        <button
          onClick={onPrint}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-350 border border-slate-150 dark:border-slate-800 cursor-pointer transition"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Ledger Statement
        </button>
      </div>

      {/* Ledger Table Container */}
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Debit (Owed +)</th>
              <th className="py-3 px-4 text-right">Credit (Paid -)</th>
              <th className="py-3 px-4 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-semibold text-slate-700 dark:text-slate-300">
            {/* Opening Balance Row */}
            <tr className="bg-slate-50/30 dark:bg-slate-950/20 text-slate-500">
              <td className="py-2.5 px-4 text-[10px] italic">Initial Setup</td>
              <td className="py-2.5 px-4 font-mono font-bold">OP-BAL</td>
              <td className="py-2.5 px-4">Customer Account Opening Balance</td>
              <td className="py-2.5 px-4 text-right font-mono">${openingBalance.toFixed(2)}</td>
              <td className="py-2.5 px-4 text-right font-mono">$0.00</td>
              <td className="py-2.5 px-4 text-right font-mono font-bold">${openingBalance.toFixed(2)}</td>
            </tr>

            {ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No subsequent transactions (Sales or Payments) recorded.
                </td>
              </tr>
            ) : (
              ledgerEntries.map((entry, idx) => {
                const isDebit = entry.debit > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10">
                    <td className="py-3 px-4 text-[10px] text-slate-400 font-medium">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {entry.reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {isDebit ? (
                            <ArrowUpRight className="h-3 w-3 text-rose-500 shrink-0" />
                          ) : (
                            <ArrowDownCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          )}
                          {entry.description}
                        </span>
                        {entry.notes && (
                          <span className="text-[9px] text-slate-400 font-medium max-w-[280px] truncate">
                            Rem: {entry.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      ${entry.balance.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-xl font-black uppercase tracking-wider text-[10px] text-slate-400">
        <div className="flex flex-col gap-0.5">
          <span>Starting Balance</span>
          <span className="text-xs font-black font-mono text-slate-850 dark:text-slate-100 mt-1">
            ${openingBalance.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span>Total Outstanding (Sales)</span>
          <span className="text-xs font-black font-mono text-rose-500 mt-1">
            ${ledgerEntries.reduce((sum, e) => sum + e.debit, 0).toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span>Closing Running Balance</span>
          <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1.5 leading-none">
            ${closingBalance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LedgerTable;
