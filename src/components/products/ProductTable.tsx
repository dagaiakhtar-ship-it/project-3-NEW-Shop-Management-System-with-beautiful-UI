import React from 'react';
import { Eye, Edit, Copy, Trash2, RotateCcw, Package } from 'lucide-react';
import { type Product } from '../../database/db';
import StockBadge from './StockBadge';

interface ProductTableProps {
  products: (Product & {
    categoryName: string;
    stockStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  })[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
}) => {
  const allIdsOnPage = products.map((p) => p.id).filter((id): id is number => id !== undefined);
  const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id) => selectedIds.includes(id));

  return (
    <div
      id="product-table-wrapper"
      className="hidden md:block bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60">
              {/* Checkbox column */}
              <th className="py-3.5 px-4.5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
              </th>
              {/* Columns */}
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Image
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Product Details
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Barcode & SKU
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                Cost & Price
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                Net Profit
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
                Stock Level
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3.5 px-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                Created
              </th>
              <th className="py-3.5 px-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right w-36">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {products.map((p) => {
              const pId = p.id!;
              const isSelected = selectedIds.includes(pId);
              const isArchived = p.status === 'Archived';

              // Margin calculations
              const markup = p.purchasePrice! > 0 ? ((p.profit! / p.purchasePrice!) * 100).toFixed(0) : '0';

              return (
                <tr
                  key={pId}
                  className={`group hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition duration-150 ${
                    isSelected ? 'bg-indigo-50/15 dark:bg-indigo-950/5' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3 px-4.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(pId)}
                      className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail Image */}
                  <td className="py-3 px-3">
                    <div className="h-10 w-10 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="h-4.5 w-4.5 text-slate-400" />
                      )}
                    </div>
                  </td>

                  {/* Name and Brand */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-150 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                        {p.name}
                      </span>
                      {p.brand && (
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-0.5">
                          Brand: {p.brand}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Codes (Barcode & SKU) */}
                  <td className="py-3 px-3 font-mono">
                    <div className="flex flex-col text-[10px] font-bold">
                      <span className="text-slate-800 dark:text-slate-200">SKU: {p.sku}</span>
                      {p.barcode && (
                        <span className="text-slate-450 dark:text-slate-500 mt-0.5">
                          BC: {p.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {p.categoryName}
                    </span>
                  </td>

                  {/* Prices */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col text-xs font-black">
                      <span className="text-slate-800 dark:text-slate-200">
                        ${p.sellingPrice?.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5">
                        Cost: ${p.purchasePrice?.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Net Profit & Margin markup */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col text-xs font-black">
                      <span
                        className={
                          p.profit! < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        ${p.profit?.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-0.5">
                        {markup}% markup
                      </span>
                    </div>
                  </td>

                  {/* Inventory alert quantity badge */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <StockBadge currentStock={p.currentStock!} minimumStock={p.minimumStock!} />
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 mt-0.5">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </td>

                  {/* Listing display status */}
                  <td className="py-3 px-3 text-center">
                    {isArchived ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                        Archived
                      </span>
                    ) : p.status === 'Inactive' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-3 text-right text-[10px] font-bold text-slate-450 dark:text-slate-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                  </td>

                  {/* Operation Actions */}
                  <td className="py-3 px-4.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isArchived ? (
                        <button
                          type="button"
                          onClick={() => onRestore(pId)}
                          title="Restore Product Listing"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onView(pId)}
                            title="View Full Product Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(pId)}
                            title="Edit Product Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(pId)}
                            title="Duplicate Stock Listing"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(pId)}
                            title="Archive Product Listing"
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-450 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
