import React from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Notebook,
  ShoppingCart,
  Send,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import { type Customer } from '../../../database/db';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

interface CustomerOverviewTabProps {
  customer: Customer;
  sales: any[];
  payments: any[];
  creditAccounts: any[];
  onReceivePayment: () => void;
  onNewSale: () => void;
  onExportStatement: (mode: 'download' | 'preview' | 'print') => void;
  onSendWhatsAppStatement: () => void;
  isGeneratingPdf: boolean;
}

export const CustomerOverviewTab: React.FC<CustomerOverviewTabProps> = ({
  customer,
  sales,
  payments,
  creditAccounts,
  onReceivePayment,
  onNewSale,
  onExportStatement,
  onSendWhatsAppStatement,
  isGeneratingPdf
}) => {
  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Not Provided';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculations
  const nonDeletedSales = sales.filter((s) => !s.isDeleted);
  
  // Total purchases: sum of grandTotal for all non-deleted sales
  const totalPurchasesVal = nonDeletedSales.reduce((sum, s) => sum + (s.grandTotal ?? s.total ?? 0), 0);
  
  // Total paid: downpayments / cash payments on sales + credit payments
  const totalPaidAtCheckout = nonDeletedSales.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
  const totalCreditPayments = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalPaidVal = totalPaidAtCheckout + totalCreditPayments;

  const creditLimit = customer.creditLimit ?? 0;
  const outstandingBalance = customer.currentBalance ?? 0;
  const remainingCredit = Math.max(0, creditLimit - outstandingBalance);

  // Dates
  const lastPurchaseDate = nonDeletedSales.length > 0 
    ? new Date(Math.max(...nonDeletedSales.map(s => new Date(s.saleDate || s.createdAt).getTime())))
    : null;

  const paymentDates = [
    ...nonDeletedSales.filter(s => (s.paidAmount ?? 0) > 0).map(s => new Date(s.saleDate || s.createdAt).getTime()),
    ...payments.map(p => new Date(p.paymentDate || p.createdAt).getTime())
  ];
  const lastPaymentDate = paymentDates.length > 0
    ? new Date(Math.max(...paymentDates))
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPI Cards section */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Purchases</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">{formatCurrency(totalPurchasesVal)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{nonDeletedSales.length} Total Invoices</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Paid</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">{formatCurrency(totalPaidVal)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Checkout + Credit Payments</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-lg">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining Credit</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">{formatCurrency(remainingCredit)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Limit: {formatCurrency(creditLimit)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="lg:row-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Share2 className="h-4 w-4 text-indigo-500" />
          Quick Actions Panel
        </h3>

        <div className="flex flex-col gap-2.5 mt-1">
          <Button
            variant="primary"
            onClick={onNewSale}
            className="w-full flex items-center justify-center gap-2 shadow-sm font-bold py-2.5"
          >
            <ShoppingCart className="h-4 w-4" />
            New Sale (POS)
          </Button>

          <Button
            variant="outline"
            onClick={onReceivePayment}
            className="w-full flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 font-bold py-2.5"
          >
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Receive Credit Payment
          </Button>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={() => onExportStatement('print')}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all text-left"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            Print Statement
          </button>

          <button
            onClick={() => onExportStatement('download')}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all text-left"
            disabled={isGeneratingPdf}
          >
            <Download className="h-4 w-4 text-slate-400" />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Statement'}
          </button>

          <button
            onClick={onSendWhatsAppStatement}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-xl transition-all text-left"
          >
            <Send className="h-4 w-4 text-emerald-500" />
            Send WhatsApp Statement
          </button>
        </div>

        {/* Dynamic Timeline dates */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last Purchase:
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">
              {lastPurchaseDate ? formatDate(lastPurchaseDate) : 'Never'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last Payment:
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">
              {lastPaymentDate ? formatDate(lastPaymentDate) : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <User className="h-4 w-4 text-indigo-500" />
            Customer dossier
          </h3>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-400 font-semibold">Customer Name</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{customer.fullName || customer.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-400 font-semibold">Customer ID / Code</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">{customer.customerCode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-400 font-semibold">Phone Number</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{customer.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-400 font-semibold">WhatsApp Number</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{customer.alternatePhone || customer.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-400 font-semibold">Registration Date</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(customer.createdAt)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-150/60 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <MapPin className="h-4 w-4 text-indigo-500" />
            Billing address
          </h3>

          <div className="space-y-4 text-xs pt-1">
            <div className="flex flex-col text-left bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Street Address</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold mt-1 leading-relaxed">
                {customer.address || 'No street address registered.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-slate-400 font-semibold">City</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">{customer.city || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-semibold">Postal / ZIP Code</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">{customer.postalCode || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Administrative notes */}
        <Card className="md:col-span-2 p-5 border border-slate-150/60 shadow-xs flex flex-col gap-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2">
            <Notebook className="h-4 w-4 text-indigo-500" />
            Administrative Notes
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100/60 dark:border-slate-800/80 leading-relaxed min-h-[70px]">
            {customer.notes || 'No administrative notes have been captured for this profile.'}
          </p>
        </Card>
      </div>
    </div>
  );
};
