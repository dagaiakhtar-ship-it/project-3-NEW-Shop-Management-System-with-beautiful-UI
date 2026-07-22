import React, { useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  Clock
} from 'lucide-react';
import { type CreditAccount } from '../../../database/db';
import Card from '../../ui/Card';

interface CustomerCreditTabProps {
  customer: any;
  creditAccounts: CreditAccount[];
}

export const CustomerCreditTab: React.FC<CustomerCreditTabProps> = ({
  customer,
  creditAccounts,
}) => {
  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Filter out cancelled credit accounts
  const activeCreditAccounts = useMemo(() => {
    return creditAccounts.filter((a) => a.status !== 'Cancelled');
  }, [creditAccounts]);

  // Calculations for summary metrics
  const totalCreditGiven = useMemo(() => {
    // Credit Given is the initial amount of credit extended.
    // In our DB schema, `invoiceAmount` is the total invoice cost, and
    // credit given is typically the extended credit portion. Let's calculate
    // the total initial outstanding credit extended.
    return activeCreditAccounts.reduce((sum, a) => sum + (a.invoiceAmount ?? 0), 0);
  }, [activeCreditAccounts]);

  const totalCreditRecovered = useMemo(() => {
    return activeCreditAccounts.reduce((sum, a) => sum + (a.paidAmount ?? 0), 0);
  }, [activeCreditAccounts]);

  const outstandingCredit = useMemo(() => {
    return activeCreditAccounts.reduce((sum, a) => sum + (a.remainingAmount ?? 0), 0);
  }, [activeCreditAccounts]);

  const recoveryPercentage = useMemo(() => {
    if (totalCreditGiven <= 0) return 0;
    return Math.round((totalCreditRecovered / totalCreditGiven) * 100);
  }, [totalCreditGiven, totalCreditRecovered]);

  // Find oldest outstanding invoice
  const oldestDueInvoice = useMemo(() => {
    const pending = activeCreditAccounts.filter(a => a.status !== 'Paid');
    if (pending.length === 0) return null;
    
    // Sort oldest invoice date first
    const sorted = [...pending].sort((a, b) => {
      const dateA = new Date(a.invoiceDate || a.createdAt).getTime();
      const dateB = new Date(b.invoiceDate || b.createdAt).getTime();
      return dateA - dateB;
    });
    return sorted[0];
  }, [activeCreditAccounts]);

  // Oldest due invoice text
  const oldestDueText = useMemo(() => {
    if (!oldestDueInvoice) return 'None (Settle)';
    const invDate = new Date(oldestDueInvoice.invoiceDate || oldestDueInvoice.createdAt);
    const diffTime = Math.abs(Date.now() - invDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${oldestDueInvoice.invoiceNumber || 'INV'} (${diffDays} days)`;
  }, [oldestDueInvoice]);

  return (
    <div className="space-y-6 text-xs font-semibold">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Credit Given */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Total Credit Given</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{formatCurrency(totalCreditGiven)}</p>
          </div>
        </div>

        {/* Total Credit Recovered */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Credit Recovered</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{formatCurrency(totalCreditRecovered)}</p>
          </div>
        </div>

        {/* Outstanding Credit */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 rounded-lg">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Outstanding Credit</p>
            <p className="text-lg font-black text-rose-650 dark:text-rose-455 mt-0.5">{formatCurrency(outstandingCredit)}</p>
          </div>
        </div>

        {/* Recovery Ratio */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Recovery Ratio</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{recoveryPercentage}%</p>
          </div>
        </div>

        {/* Oldest Due Invoice */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Oldest Due Invoice</p>
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mt-1 truncate max-w-[130px]">{oldestDueText}</p>
          </div>
        </div>
      </div>

      {/* Credit Log list */}
      <Card className="border border-slate-150/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                <th className="py-3 px-4">Credit Date</th>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-right">Credit Given</th>
                <th className="py-3 px-4 text-right">Paid Before</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-center">Credit Status</th>
                <th className="py-3 px-4 text-center">Days Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {activeCreditAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                    <p className="font-bold">No Credit Accounts Registered</p>
                    <p className="text-[11px] text-slate-400 mt-1">This customer has no credit transactions logged under their account.</p>
                  </td>
                </tr>
              ) : (
                activeCreditAccounts.map((acc) => {
                  const invoiceVal = acc.invoiceAmount ?? 0;
                  const creditGivenVal = acc.invoiceAmount ?? 0; // Usually equals extended credit portion.
                  const recoveredVal = acc.paidAmount ?? 0;
                  const balanceVal = acc.remainingAmount ?? (creditGivenVal - recoveredVal);

                  // Calculate Days Outstanding
                  const invoiceDate = new Date(acc.invoiceDate || acc.createdAt);
                  const isSettled = acc.status === 'Paid';
                  let daysOutstanding = '-';
                  if (!isSettled) {
                    const diffTime = Math.abs(Date.now() - invoiceDate.getTime());
                    daysOutstanding = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} Days`;
                  }

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(acc.invoiceDate || acc.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-black uppercase font-mono text-indigo-600 dark:text-indigo-400">
                        {acc.invoiceNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(invoiceVal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(creditGivenVal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                        {formatCurrency(recoveredVal)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-black ${balanceVal > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {formatCurrency(balanceVal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          acc.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : acc.status === 'Partial'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                        }`}>
                          {acc.status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                        <span className={daysOutstanding !== '-' ? 'text-rose-500' : 'text-slate-400'}>
                          {daysOutstanding}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
