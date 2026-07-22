import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FolderTree, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

// Custom Hooks
import { useCategorySearch } from '../hooks/useCategorySearch';
import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { useCategorySort } from '../hooks/useCategorySort';
import { useCategories } from '../hooks/useCategories';
import { useCategory } from '../hooks/useCategory';

// UI Reusable Components
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import showToast from '../utils/toast';

// Custom Category Components
import CategoryTable from '../components/categories/CategoryTable';
import CategoryCard from '../components/categories/CategoryCard';
import CategoryModal from '../components/categories/CategoryModal';
import SearchToolbar from '../components/categories/SearchToolbar';
import FilterBar from '../components/categories/FilterBar';

export const Categories: React.FC = () => {
  // 1. Hooks for listing state
  const { searchQuery, setSearchQuery, debouncedQuery } = useCategorySearch();
  const { status, setStatus, parentCategory, setParentCategory, resetFilters } = useCategoryFilter();
  const { sortBy, setSortBy } = useCategorySort();
  
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // 2. Fetch categories with active query parameters
  const {
    categories,
    allParents,
    total,
    totalPages,
    isLoading,
    error,
    refetch,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  } = useCategories({
    searchQuery: debouncedQuery,
    status,
    parentCategory,
    sortBy,
    page,
    pageSize: 10,
  });

  // 3. Hook for single category state mutations
  const {
    category: activeCategory,
    isLoading: isItemLoading,
    error: itemError,
    fetchCategory,
    createNewCategory,
    updateExistingCategory,
  } = useCategory();

  // 4. Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('view');
  const [activeId, setActiveId] = useState<number | null>(null);

  // 5. Delete and restore confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Reset page to 1 when filters or query changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedQuery, status, parentCategory, sortBy]);

  // Load single category details when modal becomes active
  useEffect(() => {
    if (activeId !== null && (modalMode === 'view' || modalMode === 'edit') && isModalOpen) {
      fetchCategory(activeId);
    }
  }, [activeId, modalMode, isModalOpen, fetchCategory]);

  // Handle modal openings
  const handleAddClick = () => {
    setActiveId(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleViewClick = (id: number) => {
    setActiveId(id);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditClick = (id: number) => {
    setActiveId(id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // 6. Bulk Action Selectors
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allIdsOnPage = categories.map((c) => c.id).filter(Boolean) as number[];
    const isAllSelected = allIdsOnPage.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIdsOnPage.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIdsOnPage])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // 7. Core Mutation Execution Handlers
  const handleModalFormSubmit = async (formData: any) => {
    try {
      if (modalMode === 'add') {
        await createNewCategory(formData);
        showToast.success('Product category added successfully!');
      } else if (modalMode === 'edit' && activeId !== null) {
        await updateExistingCategory(activeId, formData);
        showToast.success('Category details updated successfully!');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast.error(err.message || 'Operation failed.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId === null) return;
    try {
      await softDelete(confirmDeleteId);
      showToast.success('Category archived successfully.');
      setConfirmDeleteId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
    } catch (err: any) {
      showToast.error(err.message || 'Archiving failed.');
    }
  };

  const handleRestoreConfirm = async () => {
    if (confirmRestoreId === null) return;
    try {
      await restore(confirmRestoreId);
      showToast.success('Category restored successfully!');
      setConfirmRestoreId(null);
    } catch (err: any) {
      showToast.error(err.message || 'Restoration failed.');
    }
  };

  const handleBulkStatusUpdate = async (ids: number[], newStatus: 'Active' | 'Inactive') => {
    try {
      await bulkStatusUpdate(ids, newStatus);
      showToast.success(`Successfully updated ${ids.length} categories to ${newStatus}.`);
      setSelectedIds([]);
    } catch (err: any) {
      showToast.error('Batch status update failed.');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDelete(selectedIds);
      showToast.success(`Successfully archived ${selectedIds.length} categories.`);
      setSelectedIds([]);
      setConfirmBulkDeleteOpen(false);
    } catch (err: any) {
      showToast.error('Batch delete failed.');
    }
  };

  // Determine current display status context
  const isSearchEmpty = categories.length === 0 && searchQuery !== '';
  const isFilteredEmpty = categories.length === 0 && (status !== 'All' || parentCategory !== 'all_parents');
  const isTableEmpty = categories.length === 0 && !isLoading;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderTree className="h-5.5 w-5.5 text-indigo-500" />
            Product Categories
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Structure your retail stock into distinct departments, lines, or shelves.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters Toggle Button */}
          <Button
            variant={showFiltersPanel ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters {status !== 'All' || parentCategory !== 'all_parents' ? '•' : ''}
          </Button>

          {/* Create Category Trigger */}
          <Button variant="primary" size="sm" onClick={handleAddClick} className="shadow-sm">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* 2. Interactive Search & Sync Toolbar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkDelete={() => setConfirmBulkDeleteOpen(true)}
        onRefresh={refetch}
      />

      {/* 3. Dropdowns Filters Panel */}
      {showFiltersPanel && (
        <FilterBar
          status={status}
          setStatus={setStatus}
          parentCategory={parentCategory}
          setParentCategory={setParentCategory}
          allParents={allParents}
          onReset={resetFilters}
        />
      )}

      {/* Sorting indicators summary */}
      <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-950/20 px-4.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-slate-700 dark:text-slate-350 font-black focus:ring-0 cursor-pointer outline-none text-xs"
          >
            <option value="display_order">Display Order</option>
            <option value="name_asc">Name (A - Z)</option>
            <option value="name_desc">Name (Z - A)</option>
            <option value="newest">Created Date (Newest)</option>
            <option value="oldest">Created Date (Oldest)</option>
          </select>
        </div>
        <div>
          Total count: <span className="text-slate-700 dark:text-slate-300 font-black">{total} categories</span>
        </div>
      </div>

      {/* 4. Loader, Table or Card Grid, Empty States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl min-h-[300px]">
          <div className="w-10 h-10 rounded-full border-3 border-slate-100 border-t-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Querying database indices...</span>
        </div>
      ) : isTableEmpty ? (
        // Render Empty States dynamically
        <EmptyState
          icon="FolderTree"
          title={
            isSearchEmpty
              ? 'No Categories Match Search'
              : isFilteredEmpty
              ? 'No Categories Match Filters'
              : 'No Product Categories Found'
          }
          description={
            isSearchEmpty
              ? 'We couldn\'t find any categories matching your query string. Check spelling or try resetting active search filters.'
              : isFilteredEmpty
              ? 'There are currently no product categories that match the active filters. Try clearing status or parent category constraints.'
              : 'Organize your shop stock by departments (e.g. Beverages, Electronics, Groceries). Category groupings are necessary for clean inventory reporting and POS checkouts.'
          }
          actionText={isSearchEmpty || isFilteredEmpty ? 'Reset All Filters' : 'Create Initial Category'}
          onAction={
            isSearchEmpty
              ? () => setSearchQuery('')
              : isFilteredEmpty
              ? () => {
                  resetFilters();
                  setSearchQuery('');
                }
              : handleAddClick
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Main Desktop/Tablet Table Grid */}
          <CategoryTable
            categories={categories}
            allParents={allParents}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onDelete={setConfirmDeleteId}
            onRestore={setConfirmRestoreId}
          />

          {/* Main Mobile Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {categories.map((c, idx) => (
              <CategoryCard
                key={c.id || idx}
                category={c}
                allParents={allParents}
                isSelected={c.id ? selectedIds.includes(c.id) : false}
                onToggleSelect={handleToggleSelect}
                onView={handleViewClick}
                onEdit={handleEditClick}
                onDelete={setConfirmDeleteId}
                onRestore={setConfirmRestoreId}
                index={idx}
              />
            ))}
          </div>

          {/* 5. Pagination component */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-2.5 shadow-sm"
          />
        </div>
      )}

      {/* 6. Unified Category Modal Dialog (View Details, Add, Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        category={
          modalMode === 'add'
            ? null
            : activeCategory || (categories.find((c) => c.id === activeId) ?? null)
        }
        allParents={allParents}
        onSubmit={handleModalFormSubmit}
        error={itemError}
      />

      {/* 7. Action Confirmation Dialogs */}
      {/* Soft Delete confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive Category?"
        message="Are you sure you want to soft-delete this category? Active items inside this category will remain, but the category status will show as Archived and cannot be selected for new products unless restored."
        confirmText="Archive"
        type="danger"
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        isOpen={confirmRestoreId !== null}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={handleRestoreConfirm}
        title="Restore Category Segment?"
        message="Are you sure you want to restore this category to Active status? This category will become available again during product creation and segment filters."
        confirmText="Restore"
        type="info"
      />

      {/* Bulk Delete confirmation */}
      <ConfirmDialog
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Archive Selected Categories?"
        message={`Are you sure you want to soft-delete the ${selectedIds.length} selected categories? Their status will be set to Archived, and they can be restored later.`}
        confirmText="Archive Batch"
        type="danger"
      />
    </div>
  );
};

export default Categories;
