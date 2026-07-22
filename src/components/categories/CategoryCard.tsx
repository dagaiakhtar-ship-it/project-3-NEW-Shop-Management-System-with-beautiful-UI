import React from 'react';
import { motion } from 'motion/react';
import { Eye, Edit2, Trash2, RotateCcw, Image as ImageIcon, Layers } from 'lucide-react';
import { type Category } from '../../database/db';
import CategoryStatusBadge from './CategoryStatusBadge';
import { formatDate } from '../../utils/helpers';

interface CategoryCardProps {
  category: Category & { productCount: number };
  allParents: Category[];
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  index: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  allParents,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onRestore,
  index,
}) => {
  const getParentName = (parentId?: number | string | null) => {
    if (!parentId) return null;
    const id = Number(parentId);
    const parent = allParents.find((p) => p.id === id);
    return parent ? parent.name : null;
  };

  const parentName = getParentName(category.parentCategory);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`block md:hidden border rounded-3xl p-4.5 text-left transition-all ${
        isSelected
          ? 'bg-indigo-50/20 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900/50'
          : 'bg-white border-slate-150/65 dark:bg-slate-900 dark:border-slate-800/80 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and Image Block */}
        <div className="flex items-center gap-3">
          {category.id && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(category.id!)}
              className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
            />
          )}

          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center shrink-0">
            {category.categoryImage ? (
              <img
                src={category.categoryImage}
                alt={category.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <CategoryStatusBadge status={category.status} />
      </div>

      {/* Text Info */}
      <div className="mt-3.5 space-y-1">
        <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 tracking-tight">
          {category.name}
        </h4>
        
        {category.description ? (
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-2 font-semibold">
            {category.description}
          </p>
        ) : (
          <p className="text-xs text-slate-300 dark:text-slate-650 italic font-medium">
            No description provided.
          </p>
        )}
      </div>

      {/* Meta details grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-50 dark:border-slate-800/50 text-[11px] font-bold text-slate-450 dark:text-slate-500">
        <div>
          <span className="block text-[9px] uppercase font-black text-slate-400 dark:text-slate-600">
            Parent Segment
          </span>
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
            <Layers className="h-3 w-3 text-slate-400" />
            {parentName || 'Root Level'}
          </span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-black text-slate-400 dark:text-slate-600">
            Products Count
          </span>
          <span className="text-slate-800 dark:text-white mt-0.5 block font-black">
            {category.productCount} unit{category.productCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="col-span-2">
          <span className="block text-[9px] uppercase font-black text-slate-400 dark:text-slate-600">
            Created Date
          </span>
          <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">
            {formatDate(category.createdAt)}
          </span>
        </div>
      </div>

      {/* Interactive Actions bar */}
      <div className="mt-4.5 pt-3.5 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-end gap-1.5">
        {category.status === 'Archived' ? (
          <button
            onClick={() => category.id && onRestore(category.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 text-xs font-black rounded-2xl border border-transparent transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>Restore</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => category.id && onView(category.id)}
              className="p-2 bg-slate-55 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              <Eye className="h-4.5 w-4.5 stroke-[2]" />
            </button>
            <button
              onClick={() => category.id && onEdit(category.id)}
              className="p-2 bg-slate-55 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              <Edit2 className="h-4.5 w-4.5 stroke-[2]" />
            </button>
            <button
              onClick={() => category.id && onDelete(category.id)}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2]" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CategoryCard;
