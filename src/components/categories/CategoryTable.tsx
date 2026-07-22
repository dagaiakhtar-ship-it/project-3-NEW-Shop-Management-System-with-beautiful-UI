import React from 'react';
import { motion } from 'motion/react';
import { Eye, Edit2, Trash2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { type Category } from '../../database/db';
import CategoryStatusBadge from './CategoryStatusBadge';
import { formatDate } from '../../utils/helpers';

interface CategoryTableProps {
  categories: (Category & { productCount: number })[];
  allParents: Category[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  allParents,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const getParentName = (parentId?: number | string | null) => {
    if (!parentId) return '-';
    const id = Number(parentId);
    const parent = allParents.find((p) => p.id === id);
    return parent ? parent.name : '-';
  };

  const isAllSelected =
    categories.length > 0 && categories.every((c) => c.id && selectedIds.includes(c.id));

  return (
    <div className="hidden md:block overflow-x-auto bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl shadow-sm text-left">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <th className="py-4 pl-5 w-12 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>
            <th className="py-4 pl-3 w-16 text-center">Image</th>
            <th className="py-4 px-4">Category Name</th>
            <th className="py-4 px-4 max-w-xs">Description</th>
            <th className="py-4 px-4">Parent Segment</th>
            <th className="py-4 px-4 text-center">Products</th>
            <th className="py-4 px-4">Status</th>
            <th className="py-4 px-4">Created Date</th>
            <th className="py-4 pr-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {categories.map((c, idx) => {
            const isSelected = c.id ? selectedIds.includes(c.id) : false;

            return (
              <motion.tr
                key={c.id || idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={`group hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all ${
                  isSelected ? 'bg-indigo-50/15 dark:bg-indigo-950/5' : ''
                }`}
              >
                {/* Bulk Checkbox */}
                <td className="py-3.5 pl-5 text-center">
                  {c.id && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(c.id!)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  )}
                </td>

                {/* Category Image */}
                <td className="py-3.5 pl-3">
                  <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center shrink-0 mx-auto">
                    {c.categoryImage ? (
                      <img
                        src={c.categoryImage}
                        alt={c.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
                    )}
                  </div>
                </td>

                {/* Name & Display Order indicator */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {c.name}
                    </span>
                    {c.displayOrder !== undefined && c.displayOrder > 0 && (
                      <span className="text-[9px] font-bold text-indigo-400/80 mt-0.5">
                        Order: {c.displayOrder}
                      </span>
                    )}
                  </div>
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {c.description || <span className="text-slate-300 dark:text-slate-650 font-normal">No description provided</span>}
                </td>

                {/* Parent Category */}
                <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-350">
                  {getParentName(c.parentCategory)}
                </td>

                {/* Products Count */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 text-slate-600 dark:text-slate-350">
                    {c.productCount} item{c.productCount !== 1 ? 's' : ''}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <CategoryStatusBadge status={c.status} />
                </td>

                {/* Created Date */}
                <td className="py-3.5 px-4 text-xs font-bold text-slate-450 dark:text-slate-500 whitespace-nowrap">
                  {formatDate(c.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 pr-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {c.status === 'Archived' ? (
                      // Actions for Soft-Deleted items
                      <button
                        onClick={() => c.id && onRestore(c.id)}
                        title="Restore Category"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all cursor-pointer"
                      >
                        <RotateCcw className="h-4 w-4 stroke-[2.2]" />
                      </button>
                    ) : (
                      // Standard Actions
                      <>
                        <button
                          onClick={() => c.id && onView(c.id)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/15 rounded-lg transition-all cursor-pointer"
                        >
                          <Eye className="h-4 w-4 stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => c.id && onEdit(c.id)}
                          title="Edit Category"
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/15 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => c.id && onDelete(c.id)}
                          title="Soft Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/15 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 stroke-[2.2]" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
