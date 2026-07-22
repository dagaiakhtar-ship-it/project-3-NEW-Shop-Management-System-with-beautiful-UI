import React from 'react';
import { Eye, Edit, Copy, Trash2, RotateCcw, Package } from 'lucide-react';
import { type Product } from '../../database/db';
import StockBadge from './StockBadge';

interface ProductCardProps {
  product: Product & {
    categoryName: string;
    stockStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  };
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  index: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  index,
}) => {
  const pId = product.id!;
  const isArchived = product.status === 'Archived';

  return (
    <div
      id={`product-card-${pId}`}
      style={{ animationDelay: `${index * 40}ms` }}
      className={`md:hidden flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm transition animate-in fade-in zoom-in-95 duration-200 ${
        isSelected
          ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/5'
          : 'border-slate-150/60 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700'
      }`}
    >
      {/* Upper Area: Image & Core Details */}
      <div className="flex gap-3">
        {/* Checkbox and image */}
        <div className="flex flex-col items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(pId)}
            className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
          />
          <div className="h-16 w-16 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Package className="h-6 w-6 text-slate-400" />
            )}
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex-1 min-w-0 text-left flex flex-col gap-1">
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2">
              {product.name}
            </span>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
              ${product.sellingPrice?.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-700 dark:text-slate-300">
              {product.categoryName}
            </span>
            {product.brand && (
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                • {product.brand}
              </span>
            )}
          </div>

          <div className="text-[10px] font-bold text-slate-500 font-mono mt-1">
            <p>SKU: {product.sku}</p>
            {product.barcode && <p>BC: {product.barcode}</p>}
          </div>
        </div>
      </div>

      {/* Middle Stock status info */}
      <div className="flex items-center justify-between border-t border-b border-slate-100/70 dark:border-slate-800/60 py-2.5 my-3 text-[10px] font-bold">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400">Total Stock</span>
          <span className="text-slate-800 dark:text-slate-200 font-black">
            {product.currentStock} {product.unit}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400">Net Profit</span>
          <span
            className={`font-black ${
              product.profit! < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            ${product.profit?.toFixed(2)}
          </span>
        </div>
        <StockBadge currentStock={product.currentStock!} minimumStock={product.minimumStock!} />
      </div>

      {/* Footer: Bottom actions drawer */}
      <div className="flex items-center justify-between">
        <div>
          {isArchived ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
              Archived
            </span>
          ) : product.status === 'Inactive' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450">
              Inactive
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
              Active Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore(pId)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onView(pId)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(pId)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(pId)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(pId)}
                className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-450 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
