import React, { useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  Calendar,
  CreditCard,
  User,
  ArrowDownCircle,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { type Sale, type CreditPayment } from '../../../database/db';
import Card from '../../ui/Card';

interface CustomerPaymentTabProps {
  customer: any;
  sales: Sale[];
  payments: CreditPayment[];
}

interface DisplayPayment {
  id: string;
  date: Date;
  invoiceNo: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string;
  type: 'Downpayment' | 'Credit Repayment';
  cashier: string;
  notes: string;
  remainingBalance?: number;
}

export const CustomerPaymentTab: React.FC<CustomerPaymentTabProps> = ({
  customer,
  sales,
  payments,
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

  const formatTime = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Compile all payments (Downpayments during POS sales + subsequently received credit payments)
  const allPayments = useMemo((): DisplayPayment[] => {
    const list: DisplayPayment[] = [];

    // 1. Initial downpayments from sales
    sales.forEach((sale) => {
      if (sale.isDeleted) return;
      if ((sale.paidAmount ?? 0) > 0) {
        list.push({
          id: `down-${sale.id}`,
          date: new Date(sale.saleDate || sale.createdAt),
          invoiceNo: sale.invoiceNumber || sale.invoiceNo,
          amount: sale.paidAmount,
          paymentMethod: sale.paymentMethod || 'Cash',
          referenceNo: 'POS Downpayment',
          type: 'Downpayment',
          cashier: String(sale.createdBy || 'Cashier'),
          notes: sale.notes || 'Received during checkout'
        });
      }
    });

    // 2. Subsequent credit payments
    payments.forEach((p) => {
      let invNo = 'Credit Repayment';
      if (p.invoiceId) {
        const matchingSale = sales.find((s) => s.id === p.invoiceId);
        if (matchingSale) {
          invNo = matchingSale.invoiceNumber || matchingSale.invoiceNo;
        }
      }

      list.push({
        id: `credit-pay-${p.id}`,
        date: new Date(p.paymentDate || p.createdAt),
        invoiceNo: invNo,
        amount: p.amount,
        paymentMethod: p.paymentMethod || 'Cash',
        referenceNo: p.referenceNumber || p.referenceNo || 'N/A',
        type: 'Credit Repayment',
        cashier: p.receivedBy || 'Credit Officer',
        notes: p.notes || 'Subsequent account payment'
      });
    });

    // Sort chronologically to compute running balance correctly, then sort reverse chronologically for display
    const sortedChrono = [...list].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Total debit starting with opening balance + each sale invoice grand total (if sale is credit type)
    // But we can also just show the running balance of customer if we track it backwards from current balance, 
    // or just calculate the outstanding balance relative to invoices.
    // Let's compute a running outstanding balance after each payment.
    let outstanding = customer.openingBalance ?? 0;
    
    // Sort sales chronologically to map debits
    const sortedSalesChrono = [...sales].filter(s => !s.isDeleted).sort((a, b) => 
      new Date(a.saleDate || a.createdAt).getTime() - new Date(b.saleDate || b.createdAt).getTime()
    );

    // Let's weave debits and credits in chronological order to find the balance after each payment.
    const timelineEvents: Array<{ date: Date; type: 'debit' | 'credit'; amount: number; refId: string }> = [];
    
    if ((customer.openingBalance ?? 0) > 0) {
      timelineEvents.push({
        date: new Date(customer.createdAt || Date.now() - 365 * 24 * 3600000),
        type: 'debit',
        amount: customer.openingBalance,
        refId: 'opening'
      });
    }

    sortedSalesChrono.forEach(s => {
      const isCreditType = s.saleType === 'Credit Sale' || s.saleType === 'Partial Payment Sale';
      if (isCreditType) {
        timelineEvents.push({
          date: new Date(s.saleDate || s.createdAt),
          type: 'debit',
          amount: s.grandTotal ?? s.total ?? 0,
          refId: `sale-${s.id}`
        });
      }
    });

    sortedChrono.forEach(p => {
      timelineEvents.push({
        date: p.date,
        type: 'credit',
        amount: p.amount,
        refId: p.id
      });
    });

    // Chronological sort
    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBal = 0;
    const paymentBalances: Record<string, number> = {};

    timelineEvents.forEach(ev => {
      if (ev.type === 'debit') {
        runningBal += ev.amount;
      } else {
        runningBal -= ev.amount;
        paymentBalances[ev.refId] = runningBal;
      }
    });

    // Assign the running outstanding balance after payment to our list
    const finalPayments = list.map(p => ({
      ...p,
      remainingBalance: paymentBalances[p.id] ?? 0
    }));

    // Sort newest first for reverse chronological log display
    return finalPayments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sales, payments, customer]);

  // Calculations for summary metrics
  const todayRecovery = useMemo(() => {
    const todayStr = new Date().toDateString();
    return allPayments
      .filter(p => p.type === 'Credit Repayment' && p.date.toDateString() === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [allPayments]);

  const thisMonthRecovery = useMemo(() => {
    const now = new Date();
    return allPayments
      .filter(p => p.type === 'Credit Repayment' && p.date.getMonth() === now.getMonth() && p.date.getFullYear() === now.getFullYear())
      .reduce((sum, p) => sum + p.amount, 0);
  }, [allPayments]);

  const totalRecovery = useMemo(() => {
    return allPayments
      .filter(p => p.type === 'Credit Repayment')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [allPayments]);

  const remainingCreditVal = useMemo(() => {
    return customer.currentBalance ?? 0;
  }, [customer]);

  return (
    <div className="space-y-6 text-xs font-semibold">
      {/* Payment Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's Recovery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Today's Recovery</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{formatCurrency(todayRecovery)}</p>
          </div>
        </div>

        {/* This Month Recovery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">This Month Recovery</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{formatCurrency(thisMonthRecovery)}</p>
          </div>
        </div>

        {/* Total Recovery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
            <ArrowDownCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Total Repayments</p>
            <p className="text-lg font-black text-slate-850 dark:text-slate-100 mt-0.5">{formatCurrency(totalRecovery)}</p>
          </div>
        </div>

        {/* Outstanding Credit */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 rounded-lg">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Remaining Credit (Balance)</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-455 mt-0.5">{formatCurrency(remainingCreditVal)}</p>
          </div>
        </div>
      </div>

      {/* Payments Log List */}
      <Card className="border border-slate-150/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                <th className="py-3 px-4">Recovery Date</th>
                <th className="py-3 px-4">Recovery Time</th>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4 text-right">Recovered Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference Number</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {allPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FileSpreadsheet className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                    <p className="font-bold">No Payments Recorded</p>
                    <p className="text-[11px] text-slate-400 mt-1">This customer has not made any downpayments or subsequent repayments.</p>
                  </td>
                </tr>
              ) : (
                allPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {formatTime(p.date)}
                      </td>
                      <td className="py-3.5 px-4 font-black uppercase font-mono text-indigo-600 dark:text-indigo-400">
                        {p.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-450">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                        {p.referenceNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-450 font-mono text-[10px]">
                        {p.cashier}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-850 dark:text-slate-200">
                        {formatCurrency(p.remainingBalance)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-450 italic truncate max-w-xs">
                        {p.notes}
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
