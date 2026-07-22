import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Award,
  DollarSign,
  Activity,
  ShoppingBag,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Percent,
  TrendingDown
} from 'lucide-react';
import { type Sale, type CreditPayment, type SaleItem } from '../../../database/db';
import Card from '../../ui/Card';

interface CustomerStatisticsTabProps {
  customer: any;
  sales: Sale[];
  payments: CreditPayment[];
  saleItemsMap: Record<number, SaleItem[]>;
}

export const CustomerStatisticsTab: React.FC<CustomerStatisticsTabProps> = ({
  customer,
  sales,
  payments,
  saleItemsMap
}) => {
  const nonDeletedSales = useMemo(() => {
    return sales.filter((s) => !s.isDeleted);
  }, [sales]);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // KPI Calculations
  const statsSummary = useMemo(() => {
    const totalInvoices = nonDeletedSales.length;
    const totalPurchased = nonDeletedSales.reduce((sum, s) => sum + (s.grandTotal ?? s.total ?? 0), 0);
    const totalPaidAtCheckout = nonDeletedSales.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
    const totalCreditPayments = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalPaid = totalPaidAtCheckout + totalCreditPayments;
    const outstanding = customer.currentBalance ?? 0;

    let largestPurchase = 0;
    nonDeletedSales.forEach(s => {
      const g = s.grandTotal ?? s.total ?? 0;
      if (g > largestPurchase) largestPurchase = g;
    });

    const averagePurchase = totalInvoices > 0 ? totalPurchased / totalInvoices : 0;

    // Last visit (last sale or payment)
    const dates = [
      ...nonDeletedSales.map(s => new Date(s.saleDate || s.createdAt).getTime()),
      ...payments.map(p => new Date(p.paymentDate || p.createdAt).getTime())
    ];
    const lastVisit = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    return {
      totalInvoices,
      totalPurchased,
      totalPaid,
      outstanding,
      largestPurchase,
      averagePurchase,
      lastVisit
    };
  }, [nonDeletedSales, payments, customer]);

  // Chart 1: Monthly Purchases
  const monthlyPurchasesData = useMemo(() => {
    const groups: Record<string, number> = {};
    nonDeletedSales.forEach((sale) => {
      const d = new Date(sale.saleDate || sale.createdAt);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      groups[label] = (groups[label] || 0) + (sale.grandTotal ?? sale.total ?? 0);
    });

    return Object.entries(groups).map(([month, total]) => ({
      month,
      total
    })).reverse();
  }, [nonDeletedSales]);

  // Chart 2: Monthly Credit Extended
  const monthlyCreditData = useMemo(() => {
    const groups: Record<string, number> = {};
    nonDeletedSales.forEach((sale) => {
      const isCredit = sale.saleType === 'Credit Sale' || sale.saleType === 'Partial Payment Sale';
      if (isCredit) {
        const d = new Date(sale.saleDate || sale.createdAt);
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        const creditExtended = (sale.grandTotal ?? sale.total ?? 0) - (sale.paidAmount ?? 0);
        if (creditExtended > 0) {
          groups[label] = (groups[label] || 0) + creditExtended;
        }
      }
    });

    return Object.entries(groups).map(([month, credit]) => ({
      month,
      credit
    })).reverse();
  }, [nonDeletedSales]);

  // Chart 3: Monthly Credit Recovery
  const monthlyRecoveryData = useMemo(() => {
    const groups: Record<string, number> = {};
    payments.forEach((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      groups[label] = (groups[label] || 0) + p.amount;
    });

    return Object.entries(groups).map(([month, recovered]) => ({
      month,
      recovered
    })).reverse();
  }, [payments]);

  // Chart 4: Outstanding Balance Trend
  const balanceTrendData = useMemo(() => {
    // Collect all chronological credit charges and credit repayments
    interface BalanceEvent {
      date: Date;
      amount: number;
      type: 'charge' | 'payment';
    }

    const events: BalanceEvent[] = [];

    // Opening Balance
    if ((customer.openingBalance ?? 0) > 0) {
      events.push({
        date: new Date(customer.createdAt || Date.now() - 365 * 24 * 3600000),
        amount: customer.openingBalance,
        type: 'charge'
      });
    }

    // Sales (Charges)
    nonDeletedSales.forEach((sale) => {
      const isCredit = sale.saleType === 'Credit Sale' || sale.saleType === 'Partial Payment Sale';
      if (isCredit) {
        events.push({
          date: new Date(sale.saleDate || sale.createdAt),
          amount: sale.grandTotal ?? sale.total ?? 0,
          type: 'charge'
        });
      }
      // Immediate Downpayments are payments
      if (sale.paidAmount > 0) {
        events.push({
          date: new Date(sale.saleDate || sale.createdAt),
          amount: sale.paidAmount,
          type: 'payment'
        });
      }
    });

    // Credit Payments (Repayments)
    payments.forEach((p) => {
      events.push({
        date: new Date(p.paymentDate || p.createdAt),
        amount: p.amount,
        type: 'payment'
      });
    });

    // Sort chronologically
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBal = 0;
    return events.map((ev) => {
      if (ev.type === 'charge') {
        runningBal += ev.amount;
      } else {
        runningBal -= ev.amount;
      }
      return {
        date: ev.date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        balance: runningBal
      };
    });
  }, [nonDeletedSales, payments, customer]);

  // Chart 5: Purchase Frequency (invoice counts per month)
  const purchaseFrequencyData = useMemo(() => {
    const groups: Record<string, number> = {};
    nonDeletedSales.forEach((sale) => {
      const d = new Date(sale.saleDate || sale.createdAt);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      groups[label] = (groups[label] || 0) + 1;
    });

    return Object.entries(groups).map(([month, count]) => ({
      month,
      count
    })).reverse();
  }, [nonDeletedSales]);

  // Chart 6: Top Purchased Products
  const topProductsData = useMemo(() => {
    const totals: Record<string, number> = {};
    nonDeletedSales.forEach((sale) => {
      const items = saleItemsMap[sale.id!] || [];
      items.forEach((item) => {
        if (item.productName) {
          totals[item.productName] = (totals[item.productName] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(totals)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [nonDeletedSales, saleItemsMap]);

  // Colors for multi-colored charts
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 text-xs font-semibold">
      {/* Overview Cards Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
            Total Purchases
          </span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(statsSummary.totalPurchased)}</p>
          <span className="text-[10px] text-slate-450 font-semibold">{statsSummary.totalInvoices} total checkout invoices</span>
        </Card>

        {/* Average Ticket Size */}
        <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Average Invoice
          </span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(statsSummary.averagePurchase)}</p>
          <span className="text-[10px] text-slate-450 font-semibold">Mean value of customer checkouts</span>
        </Card>

        {/* Largest Ticket Checkout */}
        <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            Largest Invoice
          </span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(statsSummary.largestPurchase)}</p>
          <span className="text-[10px] text-slate-450 font-semibold">Highest single ticket bill</span>
        </Card>

        {/* Last Customer Activity */}
        <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-2">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-rose-500" />
            Last Customer Activity
          </span>
          <p className="text-xl font-black text-slate-850 dark:text-slate-100">{formatDate(statsSummary.lastVisit)}</p>
          <span className="text-[10px] text-slate-450 font-semibold">Most recent sale or repayment date</span>
        </Card>
      </div>

      {/* Main Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Purchases Line */}
        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-500" />
            Monthly Purchases ($)
          </h4>
          <div className="h-[220px] w-full">
            {monthlyPurchasesData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400">
                <p>No monthly purchase trends logged.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPurchasesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="total" name="Purchases" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 2: Outstanding Balance Trend Line */}
        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            Outstanding Balance Trend ($)
          </h4>
          <div className="h-[220px] w-full">
            {balanceTrendData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400">
                <p>No active credit ledger balance history.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="balance" name="Outstanding Balance" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 3: Monthly Credit Extended vs. Recoveries */}
        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-purple-500" />
            Credit extended vs. Recoveries
          </h4>
          <div className="h-[220px] w-full">
            {monthlyCreditData.length === 0 && monthlyRecoveryData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400">
                <p>No credit or recovery activities registered.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCreditData.map((c) => {
                    const rec = monthlyRecoveryData.find((r) => r.month === c.month);
                    return {
                      month: c.month,
                      Extended: c.credit,
                      Recovered: rec ? rec.recovered : 0
                    };
                  })}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="Extended" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 4: Purchase Frequency (Invoices Count) */}
        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            Purchase Frequency (Invoices Count)
          </h4>
          <div className="h-[220px] w-full">
            {purchaseFrequencyData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400">
                <p>No purchase frequency trends logged.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" name="Invoices" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chart 5: Top Products Horizontal Bar */}
        <Card className="p-5 border border-slate-150/60 shadow-xs md:col-span-2 flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Most Purchased Products (By units sold)
          </h4>
          <div className="h-[220px] w-full">
            {topProductsData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400">
                <p>No product checkouts yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 10, right: 15, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} />
                  <Tooltip />
                  <Bar dataKey="quantity" name="Units Purchased" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
