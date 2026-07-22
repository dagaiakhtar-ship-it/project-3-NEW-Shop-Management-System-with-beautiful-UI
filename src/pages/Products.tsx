import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Package, RefreshCw, SlidersHorizontal, ArrowUpDown, Download, Upload, AlertCircle, Sparkles } from 'lucide-react';

// Custom Hooks
import { useProductSearch } from '../hooks/useProductSearch';
import { useProductFilter } from '../hooks/useProductFilter';
import { useProductSort } from '../hooks/useProductSort';
import { useProducts } from '../hooks/useProducts';
import { useProduct } from '../hooks/useProduct';

// UI Reusable Components
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import showToast from '../utils/toast';

// Custom Product Components
import ProductTable from '../components/products/ProductTable';
import ProductCard from '../components/products/ProductCard';
import ProductModal from '../components/products/ProductModal';
import SearchToolbar from '../components/products/SearchToolbar';
import FilterBar from '../components/products/FilterBar';

// Seed support
import { seedDemoData } from '../database/dbSeeder';
import { db } from '../database/db';
import { usePDF } from '../hooks/usePDF';
import { PDFPreviewDialog } from '../components/common/PDFComponents';
import { usePrintSystem } from '../contexts/PrintContext';

export const Products: React.FC = () => {
  const { openPrintPreview } = usePrintSystem();
  // 1. Filtering & Sorting states
  const { searchQuery, setSearchQuery, debouncedQuery } = useProductSearch();
  const {
    categoryId,
    setCategoryId,
    status,
    setStatus,
    stockStatus,
    setStockStatus,
    brand,
    setBrand,
    resetFilters,
  } = useProductFilter();
  const { sortBy, setSortBy } = useProductSort();

  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // 2. Main products query hook
  const {
    products,
    brands: brandsList,
    total,
    totalPages,
    isLoading,
    error,
    refetch,
    softDelete,
    restore,
    bulkDelete,
    bulkStatusUpdate,
  } = useProducts({
    searchQuery: debouncedQuery,
    categoryId,
    status,
    stockStatus,
    brand,
    sortBy,
    page,
    pageSize: 10,
  });

  // 3. Hook for single product details and mutations
  const {
    product: activeProduct,
    isLoading: isItemLoading,
    error: itemError,
    fetchProduct,
    createNewProduct,
    updateExistingProduct,
    duplicateExistingProduct,
  } = useProduct();

  const { isGenerating, previewUrl, currentTitle, closePreview, generateProductCatalog } = usePDF();

  // 4. Modal state managers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('view');
  const [activeId, setActiveId] = useState<number | null>(null);

  // 5. Confirms states
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<number | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Reset to page 1 whenever active queries/filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedQuery, categoryId, status, stockStatus, brand, sortBy]);

  // Load single product details into modal when active
  useEffect(() => {
    if (activeId !== null && (modalMode === 'view' || modalMode === 'edit') && isModalOpen) {
      fetchProduct(activeId);
    }
  }, [activeId, modalMode, isModalOpen, fetchProduct]);

  // Action Click Handlers
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

  const handleDuplicateClick = async (id: number) => {
    try {
      await duplicateExistingProduct(id);
      showToast.success('Product replicated successfully! New unique SKU & Barcode generated.');
      refetch();
    } catch (err: any) {
      showToast.error(err.message || 'Duplication failed.');
    }
  };

  // Checkbox Selection Logic
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allIdsOnPage = products.map((p) => p.id).filter((id): id is number => id !== undefined);
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

  // Submit/Confirmation Handlers
  const handleModalFormSubmit = async (formData: any) => {
    try {
      if (modalMode === 'add') {
        await createNewProduct(formData);
        showToast.success('New product listed successfully!');
      } else if (modalMode === 'edit' && activeId !== null) {
        await updateExistingProduct(activeId, formData);
        showToast.success('Product specifications updated successfully!');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      // Errors are caught and passed into modal's inline error prop as well
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId === null) return;
    try {
      await softDelete(confirmDeleteId);
      showToast.success('Product archived successfully.');
      setConfirmDeleteId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
    } catch (err: any) {
      showToast.error(err.message || 'Operation failed.');
    }
  };

  const handleRestoreConfirm = async () => {
    if (confirmRestoreId === null) return;
    try {
      await restore(confirmRestoreId);
      showToast.success('Product listing restored to Active status!');
      setConfirmRestoreId(null);
    } catch (err: any) {
      showToast.error(err.message || 'Operation failed.');
    }
  };

  const handleBulkStatusUpdate = async (ids: number[], newStatus: 'Active' | 'Inactive') => {
    try {
      await bulkStatusUpdate(ids, newStatus);
      showToast.success(`Successfully set ${ids.length} products to ${newStatus}.`);
      setSelectedIds([]);
    } catch (err: any) {
      showToast.error('Batch status update failed.');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDelete(selectedIds);
      showToast.success(`Successfully archived ${selectedIds.length} products.`);
      setSelectedIds([]);
      setConfirmBulkDeleteOpen(false);
    } catch (err: any) {
      showToast.error('Batch archiving failed.');
    }
  };

  // Pre-seed Demo system
  const handleSeedProducts = async () => {
    try {
      const seeded = await seedDemoData(true);
      if (seeded) {
        showToast.success('Successfully loaded professional seed inventory list!');
        refetch();
      }
    } catch (err) {
      showToast.error('Database pre-seeding failed.');
    }
  };

  // Import / Export Placeholders
  const handleImportPlaceholder = () => {
    showToast.info('CSV Import Wizard ready. Please select your standardized inventory list.');
  };

  const handleExportProducts = async (mode: 'download' | 'preview' | 'print') => {
    try {
      // Fetch suppliers to build lookup map
      const suppliers = await db.suppliers.toArray();
      const supplierMap = new Map(suppliers.map(s => [s.id, s.companyName]));

      const mappedProducts = products.map(p => ({
        sku: p.sku,
        name: p.name,
        categoryName: p.categoryName || 'General',
        supplierName: p.supplierId ? supplierMap.get(p.supplierId) || 'General' : 'General',
        costPrice: p.purchasePrice ?? p.cost ?? 0,
        sellingPrice: p.sellingPrice ?? p.price ?? 0,
        stockQuantity: p.currentStock ?? p.stock ?? 0,
        alertQuantity: p.minimumStock ?? p.alertQuantity ?? 5,
      }));

      if (mode === 'download') {
        await generateProductCatalog(mappedProducts, mode);
      } else {
        const headers = ['SKU', 'Product Name', 'Category', 'Cost Price', 'Selling Price', 'Stock Qty', 'Status'];
        const dataRows = mappedProducts.map(p => [
          p.sku,
          p.name,
          p.categoryName,
          `$${p.costPrice.toFixed(2)}`,
          `$${p.sellingPrice.toFixed(2)}`,
          String(p.stockQuantity),
          p.stockQuantity <= p.alertQuantity ? 'Low Stock' : 'In Stock'
        ]);

        const totalCostValuation = mappedProducts.reduce((sum, p) => sum + (p.costPrice * p.stockQuantity), 0);
        const totalRetailValuation = mappedProducts.reduce((sum, p) => sum + (p.sellingPrice * p.stockQuantity), 0);
        
        const summaryCards = [
          { label: 'Unique SKUs', value: String(mappedProducts.length) },
          { label: 'Stock Valuation (Cost)', value: `$${totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Asset Retail Value', value: `$${totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Low Stock Warnings', value: String(mappedProducts.filter(p => p.stockQuantity <= p.alertQuantity).length) }
        ];

        const reportData = {
          title: 'Product Inventory Catalog',
          summaryCards,
          headers,
          filters: [
            { label: 'Status', value: 'Active Catalog' },
            { label: 'Generated Date', value: new Date().toLocaleDateString() }
          ]
        };

        openPrintPreview('Product Inventory Catalog', 'report', reportData, dataRows, 'A4_Portrait');
      }
    } catch (err) {
      console.error('Failed to export product catalog:', err);
      showToast.error('Failed to export product catalog PDF.');
    }
  };

  // Dynamic state checks
  const isSearchEmpty = products.length === 0 && searchQuery !== '';
  const isFilteredEmpty =
    products.length === 0 &&
    (categoryId !== 'all' || status !== 'All' || stockStatus !== 'All' || brand !== 'all');
  const isTableEmpty = products.length === 0 && !isLoading;
  const isLowStockFilterEmpty = products.length === 0 && stockStatus === 'Low Stock' && !isLoading;

  const hasActiveFilters =
    categoryId !== 'all' || status !== 'All' || stockStatus !== 'All' || brand !== 'all';

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="h-5.5 w-5.5 text-indigo-500" />
            Products Catalog
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
            View, track, and manage retail inventory items, barcode scanner assets, and cost-margins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Pre-Seed (Only visible if database looks empty) */}
          {products.length === 0 && !isLoading && !hasActiveFilters && searchQuery === '' && (
            <Button variant="outline" size="sm" onClick={handleSeedProducts} className="border-indigo-200/60 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>Load Seed Stock</span>
            </Button>
          )}

          {/* Create Product Button */}
          <Button variant="primary" size="sm" onClick={handleAddClick} className="shadow-sm">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 2. Custom Search Toolbar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkDelete={() => setConfirmBulkDeleteOpen(true)}
        onRefresh={refetch}
        onImportPlaceholder={handleImportPlaceholder}
        onExport={handleExportProducts}
        isGenerating={isGenerating}
        showFilters={showFiltersPanel}
        onToggleFilters={() => setShowFiltersPanel(!showFiltersPanel)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3. Conditional filter bar dropdown panel */}
      {showFiltersPanel && (
        <FilterBar
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          status={status}
          setStatus={setStatus}
          stockStatus={stockStatus}
          setStockStatus={setStockStatus}
          brand={brand}
          setBrand={setBrand}
          brandsList={brandsList}
          onReset={resetFilters}
        />
      )}

      {/* Dynamic sort and count summary */}
      <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-950/20 px-4.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span>Sort catalog by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-slate-700 dark:text-slate-350 font-black focus:ring-0 cursor-pointer outline-none text-xs"
          >
            <option value="newest">Recently Listed (Newest)</option>
            <option value="oldest">Listed Date (Oldest)</option>
            <option value="name_asc">Product Name (A - Z)</option>
            <option value="name_desc">Product Name (Z - A)</option>
            <option value="purchase_price_asc">Purchase Cost (Low to High)</option>
            <option value="purchase_price_desc">Purchase Cost (High to Low)</option>
            <option value="selling_price_asc">Selling Price (Low to High)</option>
            <option value="selling_price_desc">Selling Price (High to Low)</option>
            <option value="profit_asc">Gross Profit (Low to High)</option>
            <option value="profit_desc">Gross Profit (High to Low)</option>
            <option value="stock_asc">Available Stock (Low to High)</option>
            <option value="stock_desc">Available Stock (High to Low)</option>
          </select>
        </div>
        <div>
          Displaying: <span className="text-slate-700 dark:text-slate-300 font-black">{total} stock items</span>
        </div>
      </div>

      {/* 4. Loader, Table or Card Grid, Empty States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl min-h-[350px]">
          <div className="w-10 h-10 rounded-full border-3 border-slate-100 border-t-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Querying inventory indexes...</span>
        </div>
      ) : isTableEmpty ? (
        /* Empty State rendering */
        <EmptyState
          icon="Package"
          title={
            isSearchEmpty
              ? 'No Search Results Match'
              : isLowStockFilterEmpty
              ? 'Excellent! No Low Stock Warnings'
              : isFilteredEmpty
              ? 'No Inventory Matches Selected Filters'
              : 'Your Products Catalog is Empty'
          }
          description={
            isSearchEmpty
              ? 'We couldn\'t find any products matching your query text. Check spelling or try resetting the search filter.'
              : isLowStockFilterEmpty
              ? 'Congratulations! All items in your store are sufficiently stocked above minimum alert quantities.'
              : isFilteredEmpty
              ? 'There are currently no products that match the selected filter presets. Try resetting filters to view all listings.'
              : 'Add your store\'s retail items to start scanning barcodes, tracking profit margins, monitoring stock alerts, and logging sales.'
          }
          actionText={
            isSearchEmpty || isFilteredEmpty
              ? 'Reset All Filters'
              : isLowStockFilterEmpty
              ? 'View All Stock'
              : 'Create First Product'
          }
          onAction={
            isSearchEmpty
              ? () => setSearchQuery('')
              : isLowStockFilterEmpty
              ? () => setStockStatus('All')
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
          {/* A. Responsive Desktop Table */}
          <ProductTable
            products={products}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onDuplicate={handleDuplicateClick}
            onDelete={setConfirmDeleteId}
            onRestore={setConfirmRestoreId}
          />

          {/* B. Responsive Mobile Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {products.map((p, idx) => (
              <ProductCard
                key={p.id || idx}
                product={p}
                isSelected={p.id ? selectedIds.includes(p.id) : false}
                onToggleSelect={handleToggleSelect}
                onView={handleViewClick}
                onEdit={handleEditClick}
                onDuplicate={handleDuplicateClick}
                onDelete={setConfirmDeleteId}
                onRestore={setConfirmRestoreId}
                index={idx}
              />
            ))}
          </div>

          {/* C. Pagination control */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-2.5 shadow-sm"
          />
        </div>
      )}

      {/* 5. Central Product Management Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        product={
          modalMode === 'add'
            ? null
            : activeProduct || (products.find((p) => p.id === activeId) ?? null)
        }
        onSubmit={handleModalFormSubmit}
        error={itemError}
      />

      {/* 6. Operation Confirmation Alerts */}
      {/* Soft delete confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive Stock Listing?"
        message="Are you sure you want to soft-delete this product? This will label its display status as Archived. It will be hidden from normal reports and POS lookups but can be restored back to Active status anytime."
        confirmText="Archive Product"
        type="danger"
      />

      {/* Restore confirm */}
      <ConfirmDialog
        isOpen={confirmRestoreId !== null}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={handleRestoreConfirm}
        title="Restore Product Listing?"
        message="Are you sure you want to restore this product listing back to Active status? This will immediately enable it for checkout registers and purchase orders."
        confirmText="Restore Product"
        type="info"
      />

      {/* Bulk Delete confirm */}
      <ConfirmDialog
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Archive Selected Listings?"
        message={`Are you sure you want to soft-delete the ${selectedIds.length} selected products? Their listing status will be updated to Archived.`}
        confirmText="Archive Selected"
        type="danger"
      />

      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={currentTitle || "Product Catalog & Price Sheet"}
      />
    </div>
  );
};

export default Products;
