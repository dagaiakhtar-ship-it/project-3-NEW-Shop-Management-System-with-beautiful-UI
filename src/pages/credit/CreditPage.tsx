import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Coins,
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  BookOpen,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CloudLightning,
  MessageCircle
} from 'lucide-react';
import { db, type Customer } from '../../database/db';
import {
  useCredit,
  useCustomerLedger,
  useCreditSummary
} from '../../hooks/useCredit';
import { syncToGoogleSheetsPlaceholder } from '../../database/creditHelper';
import CreditSummaryCard from '../../components/credit/CreditSummaryCard';
import ReminderPanel from '../../components/credit/ReminderPanel';
import ReceivePaymentModal from '../../components/credit/ReceivePaymentModal';
import LedgerTable from '../../components/credit/LedgerTable';
import PaymentHistoryTable from '../../components/credit/PaymentHistoryTable';
import CustomerCreditProfile from '../../components/credit/CustomerCreditProfile';
import OutstandingInvoices from '../../components/credit/OutstandingInvoices';
import CreditStatusBadge from '../../components/credit/CreditStatusBadge';
import Button from '../../components/ui/Button';
import showToast from '../../utils/toast';
import { usePrintSystem } from '../../contexts/PrintContext';
import { WhatsAppService } from '../../services/whatsappService';

export const CreditPage: React.FC = () => {
  // Navigation active tab: 'overview' or 'statement'
  const [activeTab, setActiveTab] = useState<'overview' | 'statement'>('overview');
  const { openPrintPreview } = usePrintSystem();

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Selected Customer for Statement Ledger tab
  const [selectedCustId, setSelectedCustId] = useState<number | null>(null);
  const [customersList, setCustomersList] = useState<Customer[]>([]);

  // Search/Filters for the Overview list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Trigger to force refresh sub-components
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load active customers list for selectors
  useEffect(() => {
    db.customers
      .filter((c) => !c.isDeleted && c.status === 'Active')
      .toArray()
      .then((list) => {
        setCustomersList(list);
        if (list.length > 0 && !selectedCustId) {
          // pre-select first customer optionally
          setSelectedCustId(list[0].id!);
        }
      });
  }, [refreshCounter]);

  // Hook for global statistics
  const { summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useCreditSummary();

  // Hook for overview accounts list
  const {
    creditAccounts,
    total: totalAccounts,
    totalPages,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useCredit({
    searchQuery,
    status: statusFilter,
    sortBy,
    page: currentPage,
    pageSize: 10,
  });

  // Hook for customer-specific ledger
  const {
    ledgerData,
    isLoading: isLedgerLoading,
    refetch: refetchLedger,
  } = useCustomerLedger(selectedCustId);

  // State to fetch and keep selected customer's payments list
  const [selectedCustPayments, setSelectedCustPayments] = useState<any[]>([]);
  useEffect(() => {
    if (selectedCustId) {
      db.creditPayments
        .where('customerId')
        .equals(selectedCustId)
        .toArray()
        .then((list) => {
          // Sort newest first
          list.sort((a, b) => {
            const dateA = new Date(a.paymentDate || a.createdAt).getTime();
            const dateB = new Date(b.paymentDate || b.createdAt).getTime();
            return dateB - dateA;
          });
          setSelectedCustPayments(list);
        });
    } else {
      setSelectedCustPayments([]);
    }
  }, [selectedCustId, refreshCounter]);

  // Handle refreshing all views
  const handleDataRefresh = () => {
    refetchSummary();
    refetchList();
    refetchLedger();
    setRefreshCounter((prev) => prev + 1);
  };

  // Switch to customer ledger statement from an alert or row click
  const handleViewCustomerLedger = (customerId: number) => {
    setSelectedCustId(customerId);
    setActiveTab('statement');
  };

  // Simulate backing up credit ledger to Google Sheets
  const handleSheetsBackup = async () => {
    try {
      const res = await syncToGoogleSheetsPlaceholder();
      showToast.success(res.message);
    } catch (err) {
      showToast.error('Google Sheets Sync backup failed.');
    }
  };

  const selectedCustomerName = customersList.find((c) => c.id === selectedCustId)?.fullName || 'Select Customer';
  const selectedCustomerPhone = customersList.find((c) => c.id === selectedCustId)?.phone || '';

  // Calculate stats values
  const outstandingSum = summary?.outstandingCredit ?? 0;
  const recoveredSum = summary?.recoveredCredit ?? 0;
  const totalCreditGivenSum = summary?.totalCreditGiven ?? 0;
  const collectionRate = totalCreditGivenSum > 0 ? (recoveredSum / totalCreditGivenSum) * 100 : 0;
  const todaysCollectionsSum = summary?.todaysCollections ?? 0;
  const debtorsCount = summary?.totalCustomersWithCredit ?? 0;
  const overdueCount = summary?.overdueCustomers ?? 0;

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-5 text-left" id="credit-module-page">
      
      {/* Header and top action bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="h-5.5 w-5.5 text-indigo-500" />
            Customer Credit & Loan Ledger
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Offline-first point of sale credit terms, repayment schedules, double-entry statement history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Data */}
          <button
            onClick={handleDataRefresh}
            className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 transition cursor-pointer text-slate-550"
            title="Force recalculate Ledger balances"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Sync Sheets */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSheetsBackup}
            className="flex items-center gap-1.5 border border-slate-150 dark:border-slate-800 text-slate-600 hover:text-slate-900 bg-white dark:bg-slate-950 hover:bg-slate-50"
          >
            <CloudLightning className="h-4 w-4 text-emerald-500" />
            Sheets Sync
          </Button>

          {/* Receive Payment */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPaymentOpen(true)}
            className="flex items-center gap-1.5 shadow-md shadow-indigo-150 dark:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Receive Payment
          </Button>
        </div>
      </div>

      {/* Global Credit dashboard statistics widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <CreditSummaryCard
          title="Total Outstanding Loan"
          value={`$${outstandingSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`${debtorsCount} ACTIVE DEBTORS`}
          icon={AlertTriangle}
          variant={outstandingSum > 10000 ? 'danger' : 'warning'}
        />

        <CreditSummaryCard
          title="Recovered Paid Loans"
          value={`$${recoveredSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`${summary?.pendingPayments ?? 0} LOGGED INVOICES`}
          icon={Coins}
          variant="success"
        />

        <CreditSummaryCard
          title="Collection Rate Ratio"
          value={`${collectionRate.toFixed(1)}%`}
          subtext="RECOVERY PERFORMANCE"
          icon={TrendingUp}
          variant="primary"
        />

        <CreditSummaryCard
          title="Today's Collections"
          value={`$${todaysCollectionsSum.toFixed(2)}`}
          subtext={`${overdueCount} CLIENTS OVERDUE`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Main workspace panels */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left column sidebar for alerts and reminders */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <ReminderPanel
            reminders={summary?.reminders || null}
            onSelectCustomer={handleViewCustomerLedger}
          />

          <div className="bg-white dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/85 rounded-2xl p-4.5 text-left flex flex-col gap-3.5 shadow-xs">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-current" />
              Operational Safeguards
            </h4>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex flex-col gap-2.5">
              <p className="leading-relaxed">
                ● <strong>Automatic Allocation</strong> applies collections to the oldest outstanding bill first to reduce aging credit balances.
              </p>
              <p className="leading-relaxed">
                ● <strong>Credit Limit Safeguards</strong> block transactions in POS checkouts if the projected debt exceeds maximum thresholds.
              </p>
              <p className="leading-relaxed">
                ● Voiding or soft-deleting checkout transactions instantly reverses the ledger and updates credit limits automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Right workspace panel (tab control) */}
        <div className="xl:col-span-3 flex flex-col gap-5">
          
          {/* Tab buttons */}
          <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              Outstanding Accounts Overview
            </button>
            <button
              onClick={() => setActiveTab('statement')}
              className={`pb-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'statement'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Customer Ledger Statements
            </button>
          </div>

          {/* TAB CONTENT: Overview list of all debts */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-xs p-5 flex flex-col gap-4 text-left">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice number or client name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs font-semibold pl-9 pr-4 py-2 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status selection */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-450 uppercase">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:text-slate-200"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Unpaid">Unpaid Only</option>
                      <option value="Partial">Partial Only</option>
                      <option value="Paid">Paid Only</option>
                    </select>
                  </div>

                  {/* Sorting selection */}
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:text-slate-200"
                  >
                    <option value="newest">Newest Invoice</option>
                    <option value="oldest">Oldest Invoice</option>
                    <option value="highest_balance">Highest Outstanding</option>
                    <option value="lowest_balance">Lowest Outstanding</option>
                  </select>
                </div>
              </div>

              {/* Outstanding accounts table list */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                      <th className="py-2.5 px-4">Invoice No</th>
                      <th className="py-2.5 px-4">Customer Client</th>
                      <th className="py-2.5 px-4">Invoice Date</th>
                      <th className="py-2.5 px-4 text-right">Total Invoice</th>
                      <th className="py-2.5 px-4 text-right">Remaining Due</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-semibold text-slate-700 dark:text-slate-300">
                    {isListLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-1" />
                          <span>Searching ledgers...</span>
                        </td>
                      </tr>
                    ) : creditAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No matching outstanding loan or credit accounts found.
                        </td>
                      </tr>
                    ) : (
                      creditAccounts.map((acc: any) => {
                        const isOverdue = acc.status !== 'Paid' && acc.dueDate ? new Date(acc.dueDate) < new Date() : false;

                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10">
                            <td className="py-2.5 px-4 font-mono font-black text-slate-900 dark:text-white">
                              {acc.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex flex-col text-left">
                                <span className="text-slate-800 dark:text-slate-200 font-bold">{acc.customerName}</span>
                                <span className="text-[9px] text-slate-450 font-medium">{acc.customerPhone}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-[10px] text-slate-400 font-medium">
                              {acc.invoiceDate ? new Date(acc.invoiceDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono">${(acc.invoiceAmount ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-rose-500 font-bold">
                              ${(acc.remainingAmount ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-[10px] text-slate-450">
                              {acc.dueDate ? new Date(acc.dueDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <CreditStatusBadge status={isOverdue ? 'Overdue' : acc.status} />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => WhatsAppService.sendWhatsAppByInvoiceNo(acc.invoiceNumber)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 dark:hover:bg-emerald-950/50 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition"
                                  title="Send WhatsApp Invoice"
                                >
                                  <MessageCircle className="h-3 w-3 shrink-0" />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() => handleViewCustomerLedger(acc.customerId)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/25 dark:text-indigo-400 dark:hover:bg-indigo-950/50 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition"
                                >
                                  Statement
                                  <ChevronRight className="h-3 w-3 shrink-0" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination indicators */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 font-semibold text-[10px] text-slate-400">
                  <span>Showing page {currentPage} of {totalPages} ({totalAccounts} total bills)</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB CONTENT: Customer Ledger Statement history */}
          {activeTab === 'statement' && (
            <div className="flex flex-col gap-6">
              
              {/* Customer selection dropdown */}
              <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Selected Ledger Client</span>
                  <select
                    value={selectedCustId || 0}
                    onChange={(e) => setSelectedCustId(Number(e.target.value) || null)}
                    className="text-xs font-black uppercase px-2.5 py-2 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:text-slate-100"
                  >
                    <option value={0}>Choose Customer Profile...</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName.toUpperCase()} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustId && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => setIsPaymentOpen(true)}
                    >
                      Log Payment Received
                    </Button>
                  </div>
                )}
              </div>

              {selectedCustId ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left column: credit stats profile + active bills */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                    <CustomerCreditProfile
                      customerId={selectedCustId}
                      onRefreshTrigger={refreshCounter}
                    />

                    <OutstandingInvoices
                      invoices={creditAccounts.filter((a) => a.customerId === selectedCustId)}
                    />
                  </div>

                  {/* Right column: Ledger Statement and payment records list */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    {isLedgerLoading || !ledgerData ? (
                      <div className="bg-white dark:bg-slate-950 border border-slate-150 p-12 text-center text-slate-400 rounded-2xl">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-2" />
                        <span>Computing statements...</span>
                      </div>
                    ) : (
                      <LedgerTable
                        openingBalance={ledgerData.openingBalance}
                        ledgerEntries={ledgerData.ledgerEntries}
                        closingBalance={ledgerData.closingBalance}
                        customerName={selectedCustomerName}
                        onPrint={() => {
                          const statementData = {
                            clientName: selectedCustomerName,
                            clientType: 'Customer' as const,
                            clientPhone: selectedCustomerPhone || '',
                            openingBalance: ledgerData.openingBalance,
                            closingBalance: ledgerData.closingBalance,
                            outstanding: ledgerData.closingBalance,
                            totalDebits: ledgerData.ledgerEntries.reduce((sum, curr) => sum + curr.debit, 0),
                            totalCredits: ledgerData.ledgerEntries.reduce((sum, curr) => sum + curr.credit, 0),
                          };
                          const items = ledgerData.ledgerEntries.map(e => ({
                            date: e.date,
                            reference: e.reference,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit,
                            runningBalance: e.balance,
                          }));
                          openPrintPreview(`${selectedCustomerName} Statement Ledger`, 'statement', statementData, items, 'A4_Portrait');
                        }}
                      />
                    )}

                    <PaymentHistoryTable
                      payments={selectedCustPayments}
                      customerName={selectedCustomerName}
                      customerPhone={selectedCustomerPhone}
                      onRefresh={handleDataRefresh}
                    />
                  </div>

                </div>
              ) : (
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-16 text-center text-slate-400 shadow-xs">
                  <Users className="h-9 w-9 mx-auto text-slate-300 dark:text-slate-800 mb-2" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    No Customer Selected
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Choose a client from the dropdown or click "Statement" on any invoice in the overview list to analyze active balances.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Receive payment modal */}
      <ReceivePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        customerId={selectedCustId}
        onSuccess={handleDataRefresh}
      />

    </div>
  );
};

export default CreditPage;
