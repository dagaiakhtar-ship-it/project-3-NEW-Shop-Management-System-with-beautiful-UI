import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  Filter,
  Trash,
  CheckSquare,
  SlidersHorizontal,
  Download,
  AlertCircle,
  X,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { db, type Supplier } from '../database/db';
import { syncSuppliersToGoogleSheets } from '../database/supplierHelper';
import { useSupplierSearch } from '../hooks/useSupplierSearch';
import { useSupplierFilter } from '../hooks/useSupplierFilter';
import { useSupplierSort } from '../hooks/useSupplierSort';
import { useSuppliers } from '../hooks/useSuppliers';
import { useSupplier } from '../hooks/useSupplier';

// UI components
import Button from '../components/ui/Button';
import SearchBox from '../components/ui/SearchBox';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

// Custom Supplier Components
import FinancialSummaryCard from '../components/suppliers/FinancialSummaryCard';
import SupplierFilterBar from '../components/suppliers/SupplierFilterBar';
import SupplierTable from '../components/suppliers/SupplierTable';
import SupplierCard from '../components/suppliers/SupplierCard';
import SupplierForm from '../components/suppliers/SupplierForm';
import SupplierDetails from '../components/suppliers/SupplierDetails';

import showToast from '../utils/toast';

export const Suppliers: React.FC = () => {
  // 1. Search, Filter, Sort and Pagination states
  const { searchQuery, setSearchQuery, debouncedQuery } = useSupplierSearch();
  const {
    status,
    setStatus,
    city,
    setCity,
    country,
    setCountry,
    paymentTerms,
    setPaymentTerms,
    resetFilters,
  } = useSupplierFilter();
  const { sortBy, setSortBy } = useSupplierSort();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 2. Main data hook
  const {
    suppliers,
    total,
    totalPages,
    isLoading,
    error,
    cities,
    countries,
    paymentTermsList,
    refetch,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  } = useSuppliers({
    searchQuery: debouncedQuery,
    status,
    city,
    country,
    paymentTerms,
    sortBy,
    page,
    pageSize,
  });

  // 3. Single item operation hook
  const {
    createNewSupplier,
    updateExistingSupplier,
    duplicateExistingSupplier,
    isLoading: isSingleSupplierLoading,
  } = useSupplier();

  // 4. Page UI state management
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Stats cards state
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    totalOpeningBalance: 0,
    totalCurrentBalance: 0,
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<Supplier | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [supplierIdToDelete, setSupplierIdToDelete] = useState<number | null>(null);

  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // 5. Load aggregate database statistics for the bento summary cards
  const loadStats = async () => {
    try {
      const allList = await db.suppliers.filter((s) => s.status !== 'Archived').toArray();
      const activeList = allList.filter((s) => s.status === 'Active');
      const totalOpening = allList.reduce((sum, s) => sum + (s.openingBalance || 0), 0);
      
      // Calculate active outstanding balance for each supplier
      const itemsWithLiveBalances = await Promise.all(
        allList.map(async (s) => {
          const purchases = await db.purchases
            .filter((p) => p.supplierId === s.id && p.status !== 'Cancelled')
            .toArray();

          const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
          const totalPayments = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
          return (s.openingBalance || 0) + totalPurchases - totalPayments;
        })
      );
      const totalCurrent = itemsWithLiveBalances.reduce((sum, val) => sum + val, 0);

      setStats({
        totalCount: allList.length,
        activeCount: activeList.length,
        totalOpeningBalance: totalOpening,
        totalCurrentBalance: totalCurrent,
      });
    } catch (err) {
      console.error('Error loading supplier summary stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [suppliers]); // Refreshes stats whenever suppliers are re-fetched

  // Reset page index when search or filter terms change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedQuery, status, city, country, paymentTerms]);

  // Compute number of active filters to show on badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== 'All') count++;
    if (city !== 'all') count++;
    if (country !== 'all') count++;
    if (paymentTerms !== 'all') count++;
    return count;
  }, [status, city, country, paymentTerms]);

  // 6. Bulk Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === suppliers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suppliers.map((s) => s.id!));
    }
  };

  // 7. CRUD / Action Handlers
  const handleOpenAddForm = () => {
    setSelectedSupplierForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (supplier: Supplier) => {
    setSelectedSupplierForEdit(supplier);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedSupplierForEdit?.id) {
        // Update existing record
        await updateExistingSupplier(selectedSupplierForEdit.id, formData);
        showToast.success(`Supplier "${formData.companyName}" successfully updated.`);
      } else {
        // Create new record
        await createNewSupplier(formData);
        showToast.success(`Supplier "${formData.companyName}" successfully added.`);
      }
      setIsFormOpen(false);
      setSelectedSupplierForEdit(null);
      refetch();
    } catch (err: any) {
      console.error('Form submission failed:', err);
      // Errors are toasted inside the form, but let's show one fallback
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const duplicated = await duplicateExistingSupplier(id);
      showToast.success(`Duplicated successfully. New code: ${duplicated.supplierCode}`);
      refetch();
    } catch (err: any) {
      showToast.error(err.message || 'Duplication operation failed.');
    }
  };

  const handleOpenDeleteConfirm = (id: number) => {
    setSupplierIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierIdToDelete) return;
    try {
      await softDelete(supplierIdToDelete);
      showToast.success('Supplier entry archived successfully.');
      setIsDeleteConfirmOpen(false);
      setSupplierIdToDelete(null);
      // Clean selection if deleted item was selected
      setSelectedIds((prev) => prev.filter((item) => item !== supplierIdToDelete));
    } catch (err: any) {
      showToast.error(err.message || 'Archive operation failed.');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restore(id);
      showToast.success('Supplier entry restored successfully.');
    } catch (err: any) {
      showToast.error(err.message || 'Restoration failed.');
    }
  };

  // 8. Bulk action triggers
  const handleBulkStatusChange = async (newStatus: 'Active' | 'Inactive') => {
    if (selectedIds.length === 0) return;
    try {
      await bulkStatusUpdate(selectedIds, newStatus);
      showToast.success(`Successfully set ${selectedIds.length} suppliers to ${newStatus}.`);
      setSelectedIds([]);
    } catch (err: any) {
      showToast.error(err.message || 'Bulk status update failed.');
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDelete(selectedIds);
      showToast.success(`Successfully archived ${selectedIds.length} suppliers.`);
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (err: any) {
      showToast.error(err.message || 'Bulk archive action failed.');
    }
  };

  // 9. Backup Sync Trigger
  const handleSyncBackup = async () => {
    setIsSyncing(true);
    try {
      await syncSuppliersToGoogleSheets();
      showToast.success('Procurement data safely synchronized to Google Sheets backup!');
    } catch (err: any) {
      showToast.error(err.message || 'Synchronization backup failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Suppliers & Vendors
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
            Link wholesale suppliers, manage credit balances, track payment terms, and handle vendor accounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncBackup}
            disabled={isSyncing}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Backup'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddForm}
            className="shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* 2. Live Financial Metrics Summary Cards */}
      <FinancialSummaryCard
        totalCount={stats.totalCount}
        activeCount={stats.activeCount}
        totalOpeningBalance={stats.totalOpeningBalance}
        totalCurrentBalance={stats.totalCurrentBalance}
      />

      {/* 3. Search and Filters Toolbar Card */}
      <div className="p-4 rounded-2xl border border-slate-150/65 bg-white dark:border-slate-800/80 dark:bg-slate-950 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Search Box */}
          <div className="w-full sm:max-w-md">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by company, contact person, phone, or code..."
            />
          </div>

          {/* Filters & Sorter Row */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border
                ${
                  isFilterVisible || activeFiltersCount > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-550 text-[10px] font-bold text-white leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sorter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 h-[38px]">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider hidden lg:inline">
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none cursor-pointer p-0 focus:ring-0"
              >
                <option value="newest">Newest Registered</option>
                <option value="oldest">Oldest Registered</option>
                <option value="companyName_asc">Company (A-Z)</option>
                <option value="companyName_desc">Company (Z-A)</option>
                <option value="openingBalance_asc">Opening Bal. (Low to High)</option>
                <option value="openingBalance_desc">Opening Bal. (High to Low)</option>
                <option value="currentBalance_asc">Outstanding (Low to High)</option>
                <option value="currentBalance_desc">Outstanding (High to Low)</option>
              </select>
            </div>

          </div>
        </div>

        {/* 4. Toggled Filter Drawer Options */}
        {isFilterVisible && (
          <SupplierFilterBar
            status={status}
            setStatus={setStatus}
            city={city}
            setCity={setCity}
            citiesList={cities}
            country={country}
            setCountry={setCountry}
            countriesList={countries}
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            paymentTermsList={paymentTermsList}
            onReset={resetFilters}
          />
        )}
      </div>

      {/* 5. Active Bulk Operations Indicator Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl dark:bg-indigo-950/30 dark:border-indigo-900/40 text-left animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs text-indigo-750 dark:text-indigo-300 font-bold">
            <CheckSquare className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400" />
            <span>
              Selected <span className="font-extrabold text-indigo-700 dark:text-white px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950">{selectedIds.length}</span> suppliers for bulk actions.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleBulkStatusChange('Active')}
              className="bg-white hover:bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 font-bold"
            >
              Set Active
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleBulkStatusChange('Inactive')}
              className="bg-white hover:bg-slate-50 dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-indigo-200 dark:border-indigo-900 font-bold"
            >
              Set Inactive
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="font-bold flex items-center gap-1 shadow-sm"
            >
              <Trash className="h-3 w-3" />
              Archive Selected
            </Button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white ml-2 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* 6. Database Error Message */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 p-4 rounded-xl text-rose-700 dark:text-rose-450 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 7. Main List Display Content */}
      {isLoading ? (
        /* Loading skeleton mock states */
        <div className="space-y-4">
          <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      ) : suppliers.length === 0 ? (
        /* Empty results state */
        <EmptyState
          icon="Truck"
          title={debouncedQuery || activeFiltersCount > 0 ? "No Suppliers Match" : "No Suppliers Saved"}
          description={
            debouncedQuery || activeFiltersCount > 0
              ? "We couldn't find any registered suppliers matching your active search queries or filter settings."
              : "Link wholesale suppliers and company vendors to your shop to track outstanding balances and issue restock purchase orders."
          }
          actionText={debouncedQuery || activeFiltersCount > 0 ? "Clear Filters" : "Add Supplier Entry"}
          onAction={debouncedQuery || activeFiltersCount > 0 ? resetFilters : handleOpenAddForm}
        />
      ) : (
        /* Render Lists split by desktop / mobile screen sizes */
        <div className="space-y-4">
          {/* Desktop Tabular View */}
          <div className="hidden md:block">
            <SupplierTable
              suppliers={suppliers}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onView={(s) => {
                setSelectedSupplierForDetails(s);
                setIsDetailsOpen(true);
              }}
              onEdit={handleOpenEditForm}
              onDelete={handleOpenDeleteConfirm}
              onRestore={handleRestore}
              onDuplicate={handleDuplicate}
            />
          </div>

          {/* Mobile Grid Cards View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {suppliers.map((s) => (
              <SupplierCard
                key={s.id}
                supplier={s}
                isSelected={selectedIds.includes(s.id!)}
                onToggleSelect={handleToggleSelect}
                onView={(item) => {
                  setSelectedSupplierForDetails(item);
                  setIsDetailsOpen(true);
                }}
                onEdit={handleOpenEditForm}
                onDelete={handleOpenDeleteConfirm}
                onRestore={handleRestore}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* 8. MODAL: Create / Edit Supplier Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSupplierForEdit(null);
        }}
        title={selectedSupplierForEdit ? `Edit Supplier Profile: ${selectedSupplierForEdit.companyName}` : 'Register New Vendor / Supplier'}
        size="xl"
      >
        <SupplierForm
          initialData={selectedSupplierForEdit}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedSupplierForEdit(null);
          }}
          isSubmitting={isSingleSupplierLoading}
        />
      </Modal>

      {/* 9. DRAWER / SLIDE-OVER: Detailed Profile Viewer */}
      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSupplierForDetails(null);
        }}
        title="Supplier Comprehensive Details"
        size="lg"
      >
        {selectedSupplierForDetails && (
          <SupplierDetails supplier={selectedSupplierForDetails} />
        )}
      </Drawer>

      {/* 10. CONFIRMATION DIALOG: Archive Single Vendor */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSupplierIdToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Archive Supplier Entry?"
        message="Are you sure you want to archive this supplier? They will be marked as 'Archived' (soft-deleted). You can restore them from the 'Archived' status filter at any time."
        confirmText="Archive Supplier"
        cancelText="Keep Supplier"
        type="danger"
      />

      {/* 11. CONFIRMATION DIALOG: Bulk Archive Vendors */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Archive ${selectedIds.length} Suppliers?`}
        message={`Are you sure you want to archive all ${selectedIds.length} selected suppliers? This will set their statuses to 'Archived' and hide them from active lists. They can be restored individually.`}
        confirmText="Archive Selected"
        cancelText="Cancel"
        type="danger"
      />

    </div>
  );
};

export default Suppliers;
