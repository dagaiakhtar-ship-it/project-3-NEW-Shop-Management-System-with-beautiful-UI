import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, ArrowUpRight, Barcode as BarcodeIcon, Tag, Folder, Layers, DollarSign, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { type Product, type Category, db } from '../../database/db';
import ProductForm from './ProductForm';
import BarcodeGenerator from './BarcodeGenerator';
import StockBadge from './StockBadge';
import ConfirmDialog from '../ui/ConfirmDialog';
import Button from '../ui/Button';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'add' | 'edit';
  product: (Product & { categoryName?: string }) | null;
  onSubmit: (formData: any) => void;
  error?: string | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  onSubmit,
  error = null,
}) => {
  const [resolvedCategoryName, setResolvedCategoryName] = useState('General');
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Load and resolve category name for VIEW mode
  useEffect(() => {
    if (product && mode === 'view') {
      if (product.categoryName) {
        setResolvedCategoryName(product.categoryName);
      } else {
        db.categories.get(product.categoryId).then((cat) => {
          if (cat) setResolvedCategoryName(cat.name);
        });
      }
    }
  }, [product, mode]);

  if (!isOpen) return null;

  // Handle Form Submission with Change-Tracking Confirmation for Edit mode
  const handleFormSubmit = (formData: any) => {
    if (mode === 'edit' && product) {
      // Compare submitted fields with the original values to track changes
      const origCost = product.purchasePrice ?? product.cost ?? 0;
      const origPrice = product.sellingPrice ?? product.price ?? 0;
      const origStock = product.currentStock ?? product.stock ?? 0;
      const origAlert = product.minimumStock ?? product.alertQuantity ?? 5;

      const hasChanges =
        product.name !== formData.name ||
        product.categoryId !== formData.categoryId ||
        (product.sku || '') !== (formData.sku || '') ||
        (product.barcode || '') !== (formData.barcode || '') ||
        (product.description || '') !== (formData.description || '') ||
        origCost !== formData.purchasePrice ||
        origPrice !== formData.sellingPrice ||
        origStock !== formData.currentStock ||
        origAlert !== formData.minimumStock ||
        (product.unit || 'Pcs') !== formData.unit ||
        (product.brand || '') !== formData.brand ||
        (product.image || '') !== formData.image ||
        (product.status || 'Active') !== formData.status;

      if (hasChanges) {
        setPendingFormData(formData);
        setShowConfirmSave(true); // Triggers change-confirmation dialog
        return;
      }
    }

    // Direct submit for Add mode or if Edit has no changes
    onSubmit(formData);
  };

  const handleConfirmSave = () => {
    if (pendingFormData) {
      onSubmit(pendingFormData);
      setShowConfirmSave(false);
      setPendingFormData(null);
    }
  };

  return (
    <div
      id="product-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      {/* Main Modal Box */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-indigo-500" />
              <span>
                {mode === 'add'
                  ? 'Add New Product Stock'
                  : mode === 'edit'
                  ? 'Edit Product Settings'
                  : 'Product Specification Sheet'}
              </span>
            </h2>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {mode === 'view' ? `ID: #${product?.id || 'N/A'}` : 'Manage inventory listing index'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Database validation errors */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'view' && product ? (
            /* =============================================================
               VIEW SPECIFICATION SHEET (BENTO GRID DESIGN)
               ============================================================= */
            <div className="space-y-6">
              {/* Row 1: Left column is product image, right column is core specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image panel */}
                <div className="md:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 aspect-square overflow-hidden shrink-0">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Package className="h-10 w-10 text-slate-300" />
                      <span className="text-[10px] text-slate-400 font-black">No image uploaded</span>
                    </div>
                  )}
                </div>

                {/* Info specifications column */}
                <div className="md:col-span-2 space-y-4 text-left">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider mb-2">
                      <Folder className="h-3 w-3" /> {resolvedCategoryName}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs font-bold text-slate-450 dark:text-slate-500 mt-0.5">
                        Brand: <span className="text-slate-800 dark:text-slate-300">{product.brand}</span>
                      </p>
                    )}
                  </div>

                  {/* Barcode & SKU bento box */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 font-mono text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        SKU Number
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {product.sku}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Barcode No
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {product.barcode || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Stock Warning & Status badge */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Inventory:</span>
                      <StockBadge
                        currentStock={product.currentStock ?? product.stock ?? 0}
                        minimumStock={product.minimumStock ?? product.alertQuantity ?? 5}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Listing:</span>
                      {product.status === 'Archived' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                          Archived
                        </span>
                      ) : product.status === 'Inactive' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Detail stats: pricing, profit breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cost card */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/60 dark:border-slate-800/40 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
                    <DollarSign className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Purchase Cost
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
                      ${(product.purchasePrice ?? product.cost ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Price card */}
                <div className="p-4 bg-indigo-50/15 dark:bg-indigo-950/5 border border-indigo-100/40 dark:border-indigo-900/10 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
                    <Tag className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">
                      Selling Price
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                      ${(product.sellingPrice ?? product.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Profit card */}
                <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/10 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
                    <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">
                      Markup / Profit
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      +${(product.profit ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Extended stock counts, unit metrics, brand details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/20 dark:bg-slate-950/10 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs">
                {/* Left col: Description & Notes */}
                <div className="space-y-3.5 text-left border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/60 pb-4 md:pb-0 md:pr-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" /> Product Specifications
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-2.5 italic">
                      {product.description || 'No descriptive technical manual or specifications added yet.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-450 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/30">
                    <p>Unit Segment: {product.unit || 'Pcs'}</p>
                    <p>Maker Brand: {product.brand || 'Generic'}</p>
                  </div>
                </div>

                {/* Right col: Stock counts, alert level details & barcode graphic */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-450 uppercase">Current Count</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {product.currentStock ?? product.stock ?? 0} {product.unit || 'Pcs'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-450 uppercase">Alert Quantity</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {product.minimumStock ?? product.alertQuantity ?? 5} {product.unit || 'Pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Live Barcode Render */}
                  {product.barcode && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/30">
                      <BarcodeGenerator value={product.barcode} />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Dates logged */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold text-slate-450 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-950/25 px-4.5 py-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Created: {product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}
                </span>
                {product.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    Last Updated: {new Date(product.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* =============================================================
               MUTATION FORM MODULE (ADD / EDIT FIELDS)
               ============================================================= */
            <ProductForm
              initialData={mode === 'edit' ? product : null}
              onSubmit={handleFormSubmit}
              onCancel={onClose}
              isSubmitting={false}
            />
          )}
        </div>

        {/* View Mode Actions Footer */}
        {mode === 'view' && (
          <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800/50 px-6 py-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Tracked Edit-Changes Confirmation Overlay */}
      <ConfirmDialog
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Setting Adjustments?"
        message="You have modified some of this product's configuration parameters. Saving will update IndexedDB records instantly and recalculate all margins, stock states, and inventory alert parameters."
        confirmText="Confirm Save"
        type="info"
      />
    </div>
  );
};

export default ProductModal;
