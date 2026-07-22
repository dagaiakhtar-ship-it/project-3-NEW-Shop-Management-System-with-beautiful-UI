import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  X,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Archive,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Trash2,
  Undo
} from 'lucide-react';
import {
  useExpenses,
  useExpense,
  useExpenseSearch,
  useExpenseFilter,
  useExpenseSort,
  useRecurringExpenses,
  useExpenseSummary
} from '../hooks/useExpenses';
import ExpenseSummaryCard from '../components/expenses/ExpenseSummaryCard';
import ExpenseTable from '../components/expenses/ExpenseTable';
import ExpenseCard from '../components/expenses/ExpenseCard';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseDetails from '../components/expenses/ExpenseDetails';
import ExpenseModal from '../components/expenses/ExpenseModal';
import { syncExpensesToSheetsPlaceholder } from '../database/expenseHelper';
import showToast from '../utils/toast';
import Button from '../components/ui/Button';

export const Expenses: React.FC = () => {
  // 1. Custom hook states
  const { searchQuery, setSearchQuery, debouncedQuery } = useExpenseSearch();
  const {
    categoryId,
    paymentMethod,
    status,
    startDate,
    endDate,
    isRecurring,
    setCategoryId,
    setPaymentMethod,
    setStatus,
    setStartDate,
    setEndDate,
    setIsRecurring,
    resetFilters,
    activeFilterCount,
  } = useExpenseFilter();
  const { sortBy, setSortBy } = useExpenseSort();

  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Primary expenses fetching query hook
  const {
    expenses,
    categories,
    total,
    totalPages,
    isLoading,
    refetch: refetchExpenses,
    create: createExpense,
    update: updateExpense,
    softDelete: softDeleteExpense,
    restore: restoreExpense,
    duplicate: duplicateExpense,
    bulkDelete: bulkDeleteExpenses,
    bulkCategoryChange,
    bulkStatusChange,
  } = useExpenses({
    searchQuery: debouncedQuery,
    categoryId,
    paymentMethod,
    status,
    startDate,
    endDate,
    isRecurring,
    sortBy,
    page,
    pageSize,
  });

  // Summary stats hook (Today, Month, Year, categories breakdown)
  const { summary, refetch: refetchSummary } = useExpenseSummary();

  // Recurring reminders hook
  const { reminders, refetch: refetchReminders } = useRecurringExpenses();

  // 2. Local UI states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);

  // Modal Control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [viewingExpenseId, setViewingExpenseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Live selected single expense
  const { expense: currentExpense } = useExpense(viewingExpenseId || editingExpenseId);

  // 3. Handlers
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchExpenses(), refetchSummary(), refetchReminders()]);
      showToast.success('Expenses ledger refreshed successfully.');
    } catch (err) {
      showToast.error('Failed to sync offline tables.');
    }
  };

  const handleSheetsSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncExpensesToSheetsPlaceholder();
      showToast.success(res.message);
    } catch (err) {
      showToast.error('Google Sheets backup sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create
  const handleCreateSubmit = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await createExpense(payload);
      setIsCreateOpen(false);
      showToast.success('Operational expense recorded successfully.');
      refetchSummary();
      refetchReminders();
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit
  const handleEditSubmit = async (payload: any) => {
    if (!editingExpenseId) return;
    setIsSubmitting(true);
    try {
      await updateExpense(editingExpenseId, payload);
      setIsEditOpen(false);
      setEditingExpenseId(null);
      showToast.success('Expense record updated successfully.');
      refetchSummary();
      refetchReminders();
    } catch (err: any) {
      showToast.error(err.message || 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft Delete (Archive)
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to archive/soft-delete this expense record?')) {
      try {
        await softDeleteExpense(id);
        showToast.success('Expense record archived. You can view or restore it in status: Archived.');
        refetchSummary();
        refetchReminders();
        setSelectedIds(prev => prev.filter(x => x !== id));
      } catch (err: any) {
        showToast.error(err.message || 'Archive failed.');
      }
    }
  };

  // Restore Soft-Deleted Item
  const handleRestore = async (id: number) => {
    try {
      await restoreExpense(id);
      showToast.success('Expense record restored successfully.');
      refetchSummary();
      refetchReminders();
    } catch (err: any) {
      showToast.error(err.message || 'Restore failed.');
    }
  };

  // Duplicate
  const handleDuplicate = async (id: number) => {
    try {
      const newId = await duplicateExpense(id);
      showToast.success('Expense duplicated with a new unique Expense Number.');
      refetchSummary();
      refetchReminders();
    } catch (err: any) {
      showToast.error(err.message || 'Duplication failed.');
    }
  };

  // Selection Checkboxes
  const handleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = expenses.map(e => e.id!).filter(id => id !== undefined);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  // Bulk Operations
  const handleBulkArchive = async () => {
    if (confirm(`Are you sure you want to archive the ${selectedIds.length} selected expenses?`)) {
      try {
        await bulkDeleteExpenses(selectedIds);
        showToast.success('Selected expenses archived successfully.');
        setSelectedIds([]);
        refetchSummary();
        refetchReminders();
      } catch (err: any) {
        showToast.error('Bulk archive failed.');
      }
    }
  };

  const handleBulkCategoryChangeSubmit = async (catId: number) => {
    try {
      await bulkCategoryChange(selectedIds, catId);
      showToast.success('Selected expenses updated with new category.');
      setSelectedIds([]);
      setIsBulkCategoryOpen(false);
      refetchSummary();
    } catch (err) {
      showToast.error('Bulk category update failed.');
    }
  };

  const handleBulkStatusChangeSubmit = async (newStatus: 'Paid' | 'Pending' | 'Voided') => {
    try {
      await bulkStatusChange(selectedIds, newStatus);
      showToast.success(`Selected expenses status updated to ${newStatus}.`);
      setSelectedIds([]);
      setIsBulkStatusOpen(false);
      refetchSummary();
    } catch (err) {
      showToast.error('Bulk status update failed.');
    }
  };

  const handleResolveReminder = async (rem: any) => {
    // Quickly populates Create form with details from recurring reminder
    setTitleAndLog(rem);
  };

  const [prefilledTitle, setPrefilledTitle] = useState<any>(null);
  const setTitleAndLog = (rem: any) => {
    setPrefilledTitle({
      title: `${rem.recurringType} Renewal: ${rem.title}`,
      amount: rem.amount,
      categoryId: expenses.find(e => e.title === rem.title)?.categoryId || 13,
      isRecurring: true,
      recurringType: rem.recurringType,
      expenseDate: new Date(),
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 text-left" id="expenses-tracker-module">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Operational Expenses Tracker
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1">
            Log shop utility bills, store rent leases, employee salary wages, transportation delivery fees, and miscellaneous operational costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSheetsSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 cursor-pointer"
            id="btn-sheets-sync"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Sheets Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 cursor-pointer"
            id="btn-refresh-db"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPrefilledTitle(null);
              setIsCreateOpen(true);
            }}
            className="shadow-sm shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
            id="btn-log-expense"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* 2. Interactive Recurring Reminders Panel Banner */}
      {reminders.length > 0 && status !== 'Archived' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in" id="reminders-alert-banner">
          <div className="flex gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl shrink-0 h-fit">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                Impending Scheduled Bill Renewal Reminders ({reminders.length})
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                The following active recurring items are approaching billing or overdue:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {reminders.slice(0, 3).map((rem, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleResolveReminder(rem)}
                    className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/40 hover:bg-white border border-amber-500/10 hover:border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {rem.title} (${rem.amount}) in {rem.daysRemaining}d
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Operational Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" id="expense-widgets">
        <ExpenseSummaryCard
          title="Today's Disbursements"
          value={summary?.todayExpenses || 0}
          iconType="today"
          description="Operational cost logged today"
        />
        <ExpenseSummaryCard
          title="Monthly Expenditures"
          value={summary?.monthExpenses || 0}
          iconType="month"
          description="Cumulative store costs this month"
        />
        <ExpenseSummaryCard
          title="Annual Operational Cost"
          value={summary?.yearExpenses || 0}
          iconType="year"
          description="Financial year overall expenses"
        />
      </div>

      {/* 4. Filter Toolbar & Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by tag, #no, or description..."
              className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-medium text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
              id="expenses-search-input"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <Search className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Right quick filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Category Dropdown Filter */}
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="h-11 pl-4 pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                id="filter-category"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Payment Method dropdown filter */}
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-11 pl-4 pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                id="filter-payment"
              >
                <option value="all">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Mobile Pay">Mobile Pay</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Status Dropdown filter (Including Soft Deleted/Archived Option!) */}
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`h-11 pl-4 pr-9 border hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer ${
                  status === 'Archived'
                    ? 'bg-rose-500/10 text-rose-600 border-rose-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                id="filter-status"
              >
                <option value="all">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Voided">Voided</option>
                <option value="Archived">Archived (Soft Deleted)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Clear filters trigger */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="h-11 px-4 border border-rose-200 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                id="btn-clear-filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Calendar Picker Date Range Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
              Start Date
            </span>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || null)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              id="filter-start-date"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
              End Date
            </span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || null)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              id="filter-end-date"
            />
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
              Order By
            </span>
            <div className="relative w-full">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 pl-3 pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none appearance-none cursor-pointer"
                id="filter-sort"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Cost</option>
                <option value="lowest">Lowest Cost</option>
                <option value="title">A-Z Title</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bulk Multi-Row Operations Drawer Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-600 text-white px-6 py-4.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-600/10 animate-slide-up" id="bulk-disbursement-drawer">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {selectedIds.length} Selected Disbursement Items
              </p>
              <p className="text-xs text-indigo-200">
                Perform rapid batch modifications on indexed operational records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category selection */}
            <div className="relative">
              <button
                onClick={() => setIsBulkCategoryOpen(!isBulkCategoryOpen)}
                className="h-10 px-4 bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                id="bulk-category-trigger"
              >
                Change Category
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isBulkCategoryOpen && (
                <div className="absolute right-0 bottom-12 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 w-52 shadow-xl flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-slate-400 p-2 uppercase tracking-wider">Select Category</p>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleBulkCategoryChangeSubmit(c.id!)}
                      className="text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status selections */}
            <div className="relative">
              <button
                onClick={() => setIsBulkStatusOpen(!isBulkStatusOpen)}
                className="h-10 px-4 bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                id="bulk-status-trigger"
              >
                Change Status
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isBulkStatusOpen && (
                <div className="absolute right-0 bottom-12 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 w-44 shadow-xl flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-slate-400 p-2 uppercase tracking-wider">Select Status</p>
                  {['Paid', 'Pending', 'Voided'].map(statOption => (
                    <button
                      key={statOption}
                      onClick={() => handleBulkStatusChangeSubmit(statOption as any)}
                      className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {statOption}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkArchive}
              className="h-10 px-4 bg-rose-500 hover:bg-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              id="bulk-archive-trigger"
            >
              <Archive className="w-4 h-4" />
              Archive Selected
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="h-10 w-10 bg-white/15 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
            >
              <X className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Main Expenses Ledger (Desktop Table, Mobile Cards) */}
      <div className="w-full">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold uppercase tracking-wider">Syncing Offline Tables...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-12 rounded-3xl text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm">
            <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-3xl mb-4">
              <Database className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 tracking-tight">
              {status === 'Archived' ? 'No Archived Records' : 'No Operational Expenses Recorded'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {status === 'Archived'
                ? 'Your archive/soft-deleted ledger is empty. Any expenses you archive can be reviewed and restored from here.'
                : 'Log shop rental fees, electricity bills, internet invoices, worker salary payrolls, and transportation delivery slips to calculate precise retail store profit.'}
            </p>
            {status !== 'Archived' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-6 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log First Store Cost
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              {status === 'Archived' ? (
                // Render table with RESTORE controls instead of normal actions
                <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 p-1 rounded-2xl shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
                          <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Exp No.</th>
                          <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detail</th>
                          <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount (USD)</th>
                          <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50/40">
                            <td className="px-5 py-4 font-mono text-xs font-extrabold text-slate-500">{exp.expenseNumber}</td>
                            <td className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{exp.title}</td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-600">{exp.categoryName}</td>
                            <td className="px-4 py-4 text-right text-sm font-black text-rose-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(exp.amount)}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleRestore(exp.id!)}
                                className="h-8 px-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ml-auto transition-all cursor-pointer"
                                id={`btn-restore-${exp.id}`}
                              >
                                <Undo className="w-3.5 h-3.5 stroke-[2.5]" />
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <ExpenseTable
                  expenses={expenses}
                  onView={(id) => {
                    setViewingExpenseId(id);
                    setIsViewOpen(true);
                  }}
                  onEdit={(id) => {
                    setEditingExpenseId(id);
                    setIsEditOpen(true);
                  }}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                />
              )}
            </div>

            {/* Mobile Card Grid View */}
            <div className="grid grid-cols-1 gap-4.5 md:hidden">
              {expenses.map((exp) => (
                <ExpenseCard
                  key={exp.id}
                  expense={exp}
                  isSelected={selectedIds.includes(exp.id!)}
                  onSelect={(checked) => handleSelect(exp.id!, checked)}
                  onView={() => {
                    setViewingExpenseId(exp.id!);
                    setIsViewOpen(true);
                  }}
                  onEdit={() => {
                    setEditingExpenseId(exp.id!);
                    setIsEditOpen(true);
                  }}
                  onDuplicate={() => handleDuplicate(exp.id!)}
                  onDelete={() => handleDelete(exp.id!)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-5">
                <p className="text-xs font-semibold text-slate-400">
                  Showing <span className="text-slate-700 dark:text-slate-300 font-extrabold">{expenses.length}</span> of <span className="text-slate-700 dark:text-slate-300 font-extrabold">{total}</span> operational vouchers
                </p>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="h-10 px-4 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
                    id="btn-prev-page"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="h-10 px-4 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
                    id="btn-next-page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. MODALS WORKFLOWS */}

      {/* VIEW DETAILS MODAL */}
      <ExpenseModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewingExpenseId(null);
        }}
        title="Disbursement Voucher Details"
        id="modal-view-expense"
        maxWidthClass="max-w-2xl"
      >
        {currentExpense ? (
          <ExpenseDetails
            expense={currentExpense as any}
            onClose={() => {
              setIsViewOpen(false);
              setViewingExpenseId(null);
            }}
            onEdit={() => {
              setIsViewOpen(false);
              setEditingExpenseId(currentExpense.id!);
              setViewingExpenseId(null);
              setIsEditOpen(true);
            }}
          />
        ) : (
          <div className="py-12 text-center text-slate-400">Loading document...</div>
        )}
      </ExpenseModal>

      {/* RECORD/CREATE MODAL */}
      <ExpenseModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setPrefilledTitle(null);
        }}
        title="Record Store Expense"
        id="modal-create-expense"
      >
        <ExpenseForm
          initialData={prefilledTitle}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setIsCreateOpen(false);
            setPrefilledTitle(null);
          }}
          isSubmitting={isSubmitting}
        />
      </ExpenseModal>

      {/* EDIT MODAL */}
      <ExpenseModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingExpenseId(null);
        }}
        title="Update Operational Expense"
        id="modal-edit-expense"
      >
        {currentExpense ? (
          <ExpenseForm
            initialData={currentExpense}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditOpen(false);
              setEditingExpenseId(null);
            }}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="py-12 text-center text-slate-400">Loading document...</div>
        )}
      </ExpenseModal>
    </div>
  );
};

export default Expenses;
