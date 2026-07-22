import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import {
  User,
  X,
  Plus,
  DollarSign,
  CreditCard,
  Notebook,
  TrendingUp,
  Receipt,
  FileText,
  Percent,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Lock,
  Smartphone
} from 'lucide-react';
import { type Customer, db, type Sale, type SaleItem } from '../../database/db';
import CustomerAvatar from './CustomerAvatar';
import CustomerStatusBadge from './CustomerStatusBadge';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import { usePDF } from '../../hooks/usePDF';
import { PDFPreviewDialog } from '../common/PDFComponents';
import { useAuthStore } from '../../store/authStore';
import { receiveCreditPayment } from '../../database/creditHelper';
import showToast from '../../utils/toast';
import { WhatsAppService } from '../../services/whatsappService';

// Subcomponents
import { CustomerOverviewTab } from './profile/CustomerOverviewTab';
import { CustomerBillingTab } from './profile/CustomerBillingTab';
import { CustomerCreditTab } from './profile/CustomerCreditTab';
import { CustomerPaymentTab } from './profile/CustomerPaymentTab';
import { CustomerLedgerTab } from './profile/CustomerLedgerTab';
import { CustomerStatisticsTab } from './profile/CustomerStatisticsTab';
import { SaleDetailsModal } from '../pos/SaleDetailsModal';

interface CustomerProfileProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // PDF Generator Hooks
  const {
    isGenerating: isGeneratingPdf,
    previewUrl,
    closePreview,
    generateCustomerStatement,
    generateInvoice,
    generateThermalReceipt
  } = usePDF();

  // Selected Sale for viewing invoice detail
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Payment dialog states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // 1. Reactive Queries using useLiveQuery
  const liveCustomer = useLiveQuery(
    () => db.customers.get(customer.id!),
    [customer.id]
  ) || customer;

  const sales = useLiveQuery(
    () => db.sales.where('customerId').equals(customer.id!).toArray(),
    [customer.id]
  ) || [];

  const creditAccounts = useLiveQuery(
    () => db.creditAccounts.where('customerId').equals(customer.id!).toArray(),
    [customer.id]
  ) || [];

  const payments = useLiveQuery(
    () => db.creditPayments.where('customerId').equals(customer.id!).toArray(),
    [customer.id]
  ) || [];

  // Query saleItems for all invoices
  const saleIds = useMemo(() => sales.map((s) => s.id!).filter(Boolean), [sales]);
  const saleItems = useLiveQuery(
    () => {
      if (saleIds.length === 0) return Promise.resolve([]);
      return db.saleItems.where('saleId').anyOf(saleIds).toArray();
    },
    [saleIds.join(',')]
  ) || [];

  // Map saleId to list of items for easy sub-tab access
  const saleItemsMap = useMemo(() => {
    const map: Record<number, SaleItem[]> = {};
    saleItems.forEach((item) => {
      if (item.saleId) {
        if (!map[item.saleId]) {
          map[item.saleId] = [];
        }
        map[item.saleId].push(item);
      }
    });
    return map;
  }, [saleItems]);

  const nonDeletedSales = useMemo(() => sales.filter((s) => !s.isDeleted), [sales]);

  const headerStats = useMemo(() => {
    const totalPurchases = nonDeletedSales.reduce((sum, s) => sum + (s.grandTotal ?? s.total ?? 0), 0);
    const totalPaidAtCheckout = nonDeletedSales.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
    const totalCreditRecovered = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalPaid = totalPaidAtCheckout + totalCreditRecovered;

    // Total Credit extended: sum of invoice remaining amounts or grandTotal - paidAmount on credit sales
    const totalCredit = nonDeletedSales.reduce((sum, s) => {
      const g = s.grandTotal ?? s.total ?? 0;
      const p = s.paidAmount ?? 0;
      return sum + Math.max(0, g - p);
    }, 0);

    const currentOutstanding = liveCustomer.currentBalance ?? 0;
    const remainingCredit = Math.max(0, (liveCustomer.creditLimit ?? 0) - currentOutstanding);

    // Last Purchase Date
    const lastPurchaseDate = nonDeletedSales.length > 0 
      ? new Date(Math.max(...nonDeletedSales.map(s => new Date(s.saleDate || s.createdAt).getTime())))
      : null;

    // Last Payment Date
    const paymentDates = [
      ...nonDeletedSales.filter(s => (s.paidAmount ?? 0) > 0).map(s => new Date(s.saleDate || s.createdAt).getTime()),
      ...payments.map(p => new Date(p.paymentDate || p.createdAt).getTime())
    ];
    const lastPaymentDate = paymentDates.length > 0 ? new Date(Math.max(...paymentDates)) : null;

    return {
      totalPurchases,
      totalPaid,
      totalCredit,
      totalCreditRecovered,
      remainingCredit,
      lastPurchaseDate,
      lastPaymentDate
    };
  }, [nonDeletedSales, payments, liveCustomer]);

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

  // 2. Tab Actions & Handlers
  const handleExportStatement = async (mode: 'download' | 'preview' | 'print') => {
    try {
      const nonDeletedSales = sales.filter((s) => !s.isDeleted);
      
      const transactions = nonDeletedSales.map((sale) => ({
        date: new Date(sale.saleDate || sale.createdAt),
        reference: sale.invoiceNumber || sale.invoiceNo,
        type: sale.saleType,
        amount: sale.grandTotal ?? sale.total,
        paid: sale.paidAmount,
        balance: (sale.grandTotal ?? sale.total) - sale.paidAmount,
      }));

      const meta = {
        openingBalance: liveCustomer.openingBalance || 0,
        closingBalance: liveCustomer.currentBalance || 0,
        outstanding: liveCustomer.currentBalance || 0,
      };

      await generateCustomerStatement(liveCustomer, transactions, meta, mode);
    } catch (err: any) {
      console.error('Failed to generate statement PDF:', err);
    }
  };

  const handleSendWhatsAppStatement = async () => {
    try {
      const phone = liveCustomer.alternatePhone || liveCustomer.phone;
      if (!phone) {
        showToast.error('No WhatsApp or alternate phone registered on customer file.');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const outstanding = liveCustomer.currentBalance ?? 0;
      
      const message = `Hello ${liveCustomer.fullName},
      
This is a statement of account update from our store.

Customer Code: ${liveCustomer.customerCode}
Current Outstanding Balance: ${formatCurrency(outstanding)}
Total Credit Limit: ${formatCurrency(liveCustomer.creditLimit)}

Thank you for your business. Let us know if you have any questions!`;

      const encoded = encodeURIComponent(message);
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
      window.open(url, '_blank');
      showToast.success('WhatsApp statement message initiated.');
    } catch (err: any) {
      showToast.error('Failed to compose WhatsApp message.');
    }
  };

  // POS Navigation Handler
  const handleNewSale = () => {
    // Navigate to point of sale screen, passing selected customer to the state
    navigate('/sales', { state: { selectedCustomerId: liveCustomer.id } });
    onClose();
  };

  // Submit Credit Payment logic
  const handleOpenPaymentModal = () => {
    setPaymentAmount(String(liveCustomer.currentBalance || ''));
    setPaymentMethod('Cash');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast.error('Please input a valid payment amount.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      
      const res = await receiveCreditPayment({
        customerId: liveCustomer.id!,
        totalAmount: amountNum,
        paymentMethod,
        referenceNumber: paymentRef || undefined,
        notes: paymentNotes || undefined,
        receivedBy: currentUser?.fullName || currentUser?.username || 'Credit Officer',
        allocationType: 'auto',
      });

      if (res.success) {
        showToast.success(res.message || 'Payment received successfully.');
        setIsPaymentModalOpen(false);
      } else {
        showToast.error(res.message || 'Failed to submit payment.');
      }
    } catch (err: any) {
      showToast.error(`Payment processing failed: ${err.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Invoice detailed list actions
  const handleViewInvoice = (sale: Sale) => {
    // Attach items to selected sale
    const fullSale = {
      ...sale,
      items: saleItemsMap[sale.id!] || []
    };
    setSelectedSale(fullSale);
  };

  const handlePrintInvoice = async (sale: Sale, format: 'thermal' | 'a4') => {
    try {
      const items = saleItemsMap[sale.id!] || [];
      if (format === 'thermal') {
        await generateThermalReceipt(sale, items, 'print');
      } else {
        await generateInvoice(sale, items, 'print');
      }
    } catch (err: any) {
      console.error('Failed to print invoice:', err);
    }
  };

  const handleDownloadInvoice = async (sale: Sale) => {
    try {
      const items = saleItemsMap[sale.id!] || [];
      await generateInvoice(sale, items, 'download');
    } catch (err: any) {
      console.error('Failed to download invoice:', err);
    }
  };

  const handleSendInvoiceWhatsApp = async (sale: Sale) => {
    const items = saleItemsMap[sale.id!] || [];
    await WhatsAppService.sendWhatsApp(sale, items, liveCustomer);
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-in fade-in duration-200">
      
      {/* Top Banner Profile Summary (Dossier Cockpit) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-150/60 bg-white p-6 dark:border-slate-800/80 dark:bg-slate-950/40 shadow-xs flex flex-col xl:flex-row gap-6 font-semibold text-xs">
        
        {/* Left Side: Demographics Dossier */}
        <div className="xl:w-[32%] flex flex-col sm:flex-row gap-5 pb-5 xl:pb-0 xl:border-r border-slate-100 dark:border-slate-800/60 pr-0 xl:pr-6 justify-center sm:justify-start">
          <div className="flex flex-col items-center shrink-0 self-center sm:self-start">
            <CustomerAvatar
              profileImage={liveCustomer.profileImage}
              fullName={liveCustomer.fullName}
              size="2xl"
              className="border-4 border-indigo-100 dark:border-indigo-950/60 shadow-md"
            />
            <span className="mt-3 inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
              {liveCustomer.customerType}
            </span>
          </div>

          <div className="space-y-2 flex-1 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-100/50">
                  ID: {liveCustomer.customerCode}
                </span>
                <CustomerStatusBadge status={liveCustomer.status} />
              </div>
              <h2 className="text-lg font-black text-slate-850 dark:text-white tracking-tight">
                {liveCustomer.fullName}
              </h2>
            </div>

            <div className="space-y-1 text-[11px] text-slate-500">
              <p><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Phone:</span> {liveCustomer.phone || 'N/A'}</p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">WhatsApp:</span> {liveCustomer.alternatePhone || liveCustomer.phone || 'N/A'}</p>
              <p className="line-clamp-2"><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Address:</span> {liveCustomer.address || 'N/A'}</p>
              <p><span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Registered:</span> {formatDate(liveCustomer.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Accounts KPIs grid */}
        <div className="flex-1 flex flex-col justify-between gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-4 gap-3">
            {/* Credit Limit */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Credit Limit</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatCurrency(liveCustomer.creditLimit)}</p>
            </div>

            {/* Current Outstanding Balance */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Liability</p>
              <p className={`text-sm font-black mt-0.5 ${
                (liveCustomer.currentBalance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-455' : 'text-slate-800 dark:text-slate-100'
              }`}>{formatCurrency(liveCustomer.currentBalance)}</p>
            </div>

            {/* Remaining Credit */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Remaining Credit</p>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(headerStats.remainingCredit)}</p>
            </div>

            {/* Total Purchases */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Purchases</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatCurrency(headerStats.totalPurchases)}</p>
            </div>

            {/* Total Paid */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Paid</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-450 mt-0.5">{formatCurrency(headerStats.totalPaid)}</p>
            </div>

            {/* Total Credit Extended */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Credit Given</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatCurrency(headerStats.totalCredit)}</p>
            </div>

            {/* Total Credit Recovered */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Credit Recovered</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-450 mt-0.5">{formatCurrency(headerStats.totalCreditRecovered)}</p>
            </div>

            {/* Last Purchase */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Last Purchase</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
                {headerStats.lastPurchaseDate ? headerStats.lastPurchaseDate.toLocaleDateString() : 'Never'}
              </p>
            </div>

            {/* Last Payment */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Last Payment</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
                {headerStats.lastPaymentDate ? headerStats.lastPaymentDate.toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Quick Action Payment Button */}
          <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPaymentModal}
              className="flex items-center gap-1.5 text-[11px] font-bold border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Receive Credit Payment
            </Button>
          </div>
        </div>

      </div>

      {/* Six Tabs Layout */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'billing', label: 'Billing History' },
          { id: 'credit', label: 'Credit History' },
          { id: 'payment', label: 'Payment History' },
          { id: 'ledger', label: 'Ledger' },
          { id: 'statistics', label: 'Statistics' },
        ]}
      />

      {/* Tabs panels render */}
      <div className="mt-2">
        {activeTab === 'overview' && (
          <CustomerOverviewTab
            customer={liveCustomer}
            sales={sales}
            payments={payments}
            creditAccounts={creditAccounts}
            onReceivePayment={handleOpenPaymentModal}
            onNewSale={handleNewSale}
            onExportStatement={handleExportStatement}
            onSendWhatsAppStatement={handleSendWhatsAppStatement}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}

        {activeTab === 'billing' && (
          <CustomerBillingTab
            customer={liveCustomer}
            sales={sales}
            saleItemsMap={saleItemsMap}
            onViewInvoice={handleViewInvoice}
            onPrintInvoice={handlePrintInvoice}
            onDownloadInvoice={handleDownloadInvoice}
            onSendWhatsApp={handleSendInvoiceWhatsApp}
            onRefresh={() => {}}
          />
        )}

        {activeTab === 'credit' && (
          <CustomerCreditTab
            customer={liveCustomer}
            creditAccounts={creditAccounts}
          />
        )}

        {activeTab === 'payment' && (
          <CustomerPaymentTab
            customer={liveCustomer}
            sales={sales}
            payments={payments}
          />
        )}

        {activeTab === 'ledger' && (
          <CustomerLedgerTab
            customer={liveCustomer}
            sales={sales}
            payments={payments}
            onExportStatement={handleExportStatement}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}

        {activeTab === 'statistics' && (
          <CustomerStatisticsTab
            customer={liveCustomer}
            sales={sales}
            payments={payments}
            saleItemsMap={saleItemsMap}
          />
        )}
      </div>

      {/* PDF View Preview Dialog */}
      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={`${liveCustomer.fullName} Account Statement`}
      />

      {/* Receive Credit Payment Modal Form */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Receive Credit Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2 flex items-center justify-between">
                <span>Account Liability Balance:</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-455">
                  {formatCurrency(liveCustomer.currentBalance)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter amount..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Payment">Mobile Payment</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reference No / Receipt No</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. TXN-92818, CHQ-201, etc."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes / Remarks</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Payment remarks..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="border-slate-200 font-bold py-2 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingPayment}
                  className="font-bold py-2 px-4 bg-emerald-600 border-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmittingPayment ? 'Processing...' : 'Submit Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Details Viewer Dialog */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onPrintReceipt={async (sale, items, customer, format) => {
            if (format === 'thermal') {
              await generateThermalReceipt(sale, items, 'print');
            } else {
              await generateInvoice(sale, items, 'print');
            }
          }}
        />
      )}
    </div>
  );
};

export default CustomerProfile;
