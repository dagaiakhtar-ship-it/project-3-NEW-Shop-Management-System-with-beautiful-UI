import React, { useState, useEffect } from 'react';
import { type Category } from '../../database/db';
import Modal from '../ui/Modal';
import CategoryForm from './CategoryForm';
import CategoryStatusBadge from './CategoryStatusBadge';
import { formatDate } from '../../utils/helpers';
import { Eye, Edit2, Layers, Calendar, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'add' | 'edit';
  category: (Category & { productCount?: number }) | null;
  allParents: Category[];
  onSubmit: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  error?: string | null;
}

interface FieldChange {
  label: string;
  oldVal: string;
  newVal: string;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  mode,
  category,
  allParents,
  onSubmit,
  error,
}) => {
  const [editFormData, setEditFormData] = useState<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    parentCategory: null,
    categoryImage: '',
    status: 'Active',
    displayOrder: 0,
  });

  const [changesList, setChangesList] = useState<FieldChange[]>([]);
  const [showConfirmChanges, setShowConfirmChanges] = useState<boolean>(false);

  // Reset confirm state whenever modal opens/closes or changes mode
  useEffect(() => {
    setShowConfirmChanges(false);
    setChangesList([]);
  }, [isOpen, mode]);

  const getParentName = (parentId?: number | string | null) => {
    if (!parentId) return 'None (Root)';
    const id = Number(parentId);
    const parent = allParents.find((p) => p.id === id);
    return parent ? parent.name : 'None (Root)';
  };

  const handleEditSubmit = (formData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!category) return;

    // Detect modified fields
    const changes: FieldChange[] = [];

    if (category.name !== formData.name) {
      changes.push({ label: 'Name', oldVal: category.name, newVal: formData.name });
    }
    if ((category.description || '') !== (formData.description || '')) {
      changes.push({
        label: 'Description',
        oldVal: category.description || '[Empty]',
        newVal: formData.description || '[Empty]',
      });
    }
    if (category.parentCategory !== formData.parentCategory) {
      changes.push({
        label: 'Parent Category',
        oldVal: getParentName(category.parentCategory),
        newVal: getParentName(formData.parentCategory),
      });
    }
    if (category.categoryImage !== formData.categoryImage) {
      changes.push({
        label: 'Image',
        oldVal: category.categoryImage ? 'Present' : 'None',
        newVal: formData.categoryImage ? 'New Image' : 'Removed',
      });
    }
    if (category.status !== formData.status) {
      changes.push({
        label: 'Status',
        oldVal: category.status || 'Active',
        newVal: formData.status,
      });
    }
    if (category.displayOrder !== formData.displayOrder) {
      changes.push({
        label: 'Display Order',
        oldVal: String(category.displayOrder ?? 0),
        newVal: String(formData.displayOrder ?? 0),
      });
    }

    if (changes.length === 0) {
      // No changes, we can just submit or close
      onSubmit(formData);
      return;
    }

    setEditFormData(formData);
    setChangesList(changes);
    setShowConfirmChanges(true);
  };

  const confirmAndSave = () => {
    onSubmit(editFormData);
  };

  const getModalTitle = () => {
    if (mode === 'add') return 'Add New Product Category';
    if (mode === 'edit') {
      return showConfirmChanges
        ? 'Confirm Modified Fields'
        : `Edit Category: ${category?.name || ''}`;
    }
    return 'Category Details';
  };

  const getModalSize = () => {
    if (mode === 'view') return 'md';
    return 'lg';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size={getModalSize()}>
      {/* 1. VIEW MODE */}
      {mode === 'view' && category && (
        <div className="space-y-6 text-left">
          {/* Header Visual with Image */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 flex items-center justify-center shrink-0">
              {category.categoryImage ? (
                <img
                  src={category.categoryImage}
                  alt={category.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {category.name}
                </h2>
                <CategoryStatusBadge status={category.status} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-sm">
                {category.description || 'No description provided for this category.'}
              </p>
            </div>
          </div>

          {/* Key details list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center gap-3">
              <Layers className="h-4.5 w-4.5 text-indigo-500 stroke-[2]" />
              <div>
                <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-650">
                  Parent Category
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {getParentName(category.parentCategory)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center gap-3">
              <Eye className="h-4.5 w-4.5 text-emerald-500 stroke-[2]" />
              <div>
                <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-650">
                  Display Position
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Index {category.displayOrder ?? 0}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center gap-3 col-span-1 md:col-span-2">
              <Calendar className="h-4.5 w-4.5 text-blue-500 stroke-[2]" />
              <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                  <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-650">
                    Created Date
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatDate(category.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-650">
                    Last Updated
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatDate(category.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Close Action */}
          <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800/50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-black rounded-2xl transition-all cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* 2. ADD MODE */}
      {mode === 'add' && (
        <CategoryForm
          parentCategories={allParents}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel="Create Category"
          error={error}
        />
      )}

      {/* 3. EDIT MODE */}
      {mode === 'edit' && category && (
        <>
          {!showConfirmChanges ? (
            <CategoryForm
              initialValues={category}
              parentCategories={allParents}
              onSubmit={handleEditSubmit}
              onCancel={onClose}
              submitLabel="Save Changes"
              error={error}
            />
          ) : (
            // Confirmation view showing tracked modifications
            <div className="space-y-5 text-left">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 stroke-[2]" />
                <div className="space-y-1">
                  <p className="font-black text-sm">Please Review Tracked Modifications</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-450">
                    Review and confirm the exact fields that have been modified before updating the database record.
                  </p>
                </div>
              </div>

              {/* List of Changes */}
              <div className="border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
                <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <div>Field</div>
                  <div>Old Value</div>
                  <div>New Value</div>
                </div>
                {changesList.map((chg, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 items-center"
                  >
                    <div className="font-black text-slate-900 dark:text-white">{chg.label}</div>
                    <div className="truncate pr-2 text-rose-500 line-through font-bold">{chg.oldVal}</div>
                    <div className="truncate pr-2 text-emerald-500 font-black">{chg.newVal}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowConfirmChanges(false)}
                  className="px-4.5 py-2.5 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition-all cursor-pointer"
                >
                  Go Back & Edit
                </button>
                <button
                  type="button"
                  onClick={confirmAndSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm & Save Record</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default CategoryModal;
