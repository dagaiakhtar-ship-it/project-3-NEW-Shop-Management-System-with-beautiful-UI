import React, { useState, useCallback } from 'react';
import { Plus, ShoppingBag, RefreshCw, Layers, ArrowUpDown, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchToolbar from '../components/purchases/SearchToolbar';
import FilterToolbar from '../components/purchases/FilterToolbar';
import PurchaseTable from '../components/purchases/PurchaseTable';
import PurchaseForm from '../components/purchases/PurchaseForm';
import PurchaseDetails from '../components/purchases/PurchaseDetails';
import PurchaseInvoice from '../components/purchases/PurchaseInvoice';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import usePurchases from '../hooks/usePurchases';
import { syncPurchasesToGoogleSheets } from '../database/purchaseHelper';
import showToast from '../utils/toast';

export const Purchases: React.FC = () => {
  // Screen Mode States: 'list' | 'create' | 'edit'
  const [screenMode, setScreenMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | undefined>(undefined);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierId, setSupplierId] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<string>('All'); // maps to Archive status
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'grandTotal_desc' | 'grandTotal_asc' | 'purchaseNumber_asc' | 'purchaseNumber_desc' | 'supplierName_asc'>('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Show / Hide filter controls panel
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal & Print Modal States
  const [activeDetailsId, setActiveDetailsId] = useState<number | null>(null);
  const [activePrintId, setActivePrintId] = useState<number | null>(null);

  // Delete / Soft-delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Hook instance
  const {
    purchases,
    total,
    totalPages,
    isLoading,
    refetch,
    softDelete,
    restore,
  } = usePurchases({
    searchQuery,
    supplierId: supplierId === 'all' ? null : supplierId,
    paymentStatus: paymentStatus as any,
    paymentMethod,
    startDate,
    endDate,
    status: status as any,
    sortBy,
    page,
    pageSize,
  });

  // Reset all filters back to default
  const handleResetFilters = useCallback(() => {
    setSupplierId('all');
    setPaymentStatus('All');
    setPaymentMethod('all');
    setStartDate('');
    setEndDate('');
    setStatus('All');
    setSortBy('newest');
    setPage(1);
    setSearchQuery('');
    showToast.success('Filters reset to default.');
  }, []);

  // Soft delete purchase order handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await softDelete(deleteConfirmId);
      showToast.success('Purchase order soft deleted. Product stock levels and supplier balance updated.');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast.error(err.message || 'Soft delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore archived purchase order handler
  const handleRestore = async (id: number) => {
    try {
      await restore(id);
      showToast.success('Purchase order restored. Product stock levels and supplier balance re-evaluated.');
    } catch (err: any) {
      showToast.error(err.message || 'Restoration failed.');
    }
  };

  // Duplicate purchase order handler
  const handleDuplicate = async (id: number) => {
    try {
      const { duplicatePurchase } = await import('../database/purchaseHelper');
      await duplicatePurchase(id);
      showToast.success('Purchase order duplicated successfully with new invoice reference!');
      refetch();
    } catch (err: any) {
      showToast.error(err.message || 'Duplication failed.');
    }
  };

  // Trigger Mock Backup Sync to Google Sheets
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncPurchasesToGoogleSheets();
      showToast.success('Purchases backup synchronized successfully (Google Sheets Sync placeholder)');
    } catch (err) {
      showToast.error('Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Main UI render switches
  if (screenMode === 'create') {
    return (
      <div className="py-2">
        <PurchaseForm
          onSaveSuccess={() => {
            setScreenMode('list');
            refetch();
          }}
          onCancel={() => setScreenMode('list')}
        />
      </div>
    );
  }

  if (screenMode === 'edit') {
    return (
      <div className="py-2">
        <PurchaseForm
          purchaseId={editingPurchaseId}
          onSaveSuccess={() => {
            setScreenMode('list');
            setEditingPurchaseId(undefined);
            refetch();
          }}
          onCancel={() => {
            setScreenMode('list');
            setEditingPurchaseId(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Page Header banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Purchase Management Module
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
            Record supplier orders, stock updates, financial balance statements, and invoice reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mock Google Sheets Backup Sync Trigger */}
          <Button variant="outline" size="sm" onClick={handleSync} isLoading={isSyncing} className="font-bold">
            <RefreshCw className="h-3.5 w-3.5" />
            Backup Sync
          </Button>
          {/* Main Draft Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setScreenMode('create')}
            className="shadow-sm font-bold flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Draft Purchase
          </Button>
        </div>
      </div>

      {/* Toolbar Search & Toggle Filters card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchToolbar
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
        />
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
          className="font-bold shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          {showFilters ? 'Hide Filters' : 'More Filters'}
        </Button>
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && (
        <FilterToolbar
          supplierId={supplierId}
          onSupplierChange={(val) => {
            setSupplierId(val);
            setPage(1);
          }}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(val) => {
            setPaymentStatus(val);
            setPage(1);
          }}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={(val) => {
            setPaymentMethod(val);
            setPage(1);
          }}
          startDate={startDate}
          onStartDateChange={(val) => {
            setStartDate(val);
            setPage(1);
          }}
          endDate={endDate}
          onEndDateChange={(val) => {
            setEndDate(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          onReset={handleResetFilters}
        />
      )}

      {/* Purchases Data Table Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 border border-slate-150/65 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-xs font-semibold text-slate-450 uppercase animate-pulse">Loading purchase ledger...</p>
          </div>
        </div>
      ) : purchases.length > 0 ? (
        <div className="flex flex-col gap-4">
          <PurchaseTable
            purchases={purchases}
            onView={(id) => setActiveDetailsId(id)}
            onEdit={(id) => {
              setEditingPurchaseId(id);
              setScreenMode('edit');
            }}
            onDuplicate={handleDuplicate}
            onDelete={(id) => setDeleteConfirmId(id)}
            onRestore={handleRestore}
            onPrint={(id) => setActivePrintId(id)}
            sortBy={sortBy}
            onSortChange={(field) => {
              setSortBy(field as any);
              setPage(1);
            }}
          />

          {/* Pagination control footer */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 text-center">
          <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4 animate-bounce" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Purchase Bills Recorded</h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-sm">
            Acquisitions update product inventory automatically, record stock history cards, and keep track of accounts payable liabilities for wholesale suppliers.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4 font-bold"
            onClick={() => setScreenMode('create')}
          >
            Create Purchase Order
          </Button>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={activeDetailsId !== null}
        onClose={() => setActiveDetailsId(null)}
        title="Purchase Order Ledger Details"
        size="xl"
      >
        {activeDetailsId !== null && <PurchaseDetails purchaseId={activeDetailsId} />}
      </Modal>

      {/* Print / Invoice Modal */}
      <Modal
        isOpen={activePrintId !== null}
        onClose={() => setActivePrintId(null)}
        title="Print Purchase Invoice Receipt"
        size="xl"
      >
        {activePrintId !== null && (
          <PurchaseInvoice
            purchaseId={activePrintId}
            onClose={() => setActivePrintId(null)}
          />
        )}
      </Modal>

      {/* Soft Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Soft Delete Purchase Order?"
        message="Are you sure you want to soft-delete this purchase order? Product stock levels will be decremented and supplier accounts payable balance will be re-evaluated."
        confirmText="Archive Purchase"
        cancelText="Keep Order"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Purchases;
