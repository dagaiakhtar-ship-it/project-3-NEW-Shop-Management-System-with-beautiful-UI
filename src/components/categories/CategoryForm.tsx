import React, { useState, useEffect } from 'react';
import { type Category } from '../../database/db';
import CategoryImageUploader from './CategoryImageUploader';
import { validateCategory } from '../../database/categoryHelper';

interface CategoryFormProps {
  initialValues?: Partial<Category>;
  parentCategories: Category[];
  onSubmit: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialValues,
  parentCategories,
  onSubmit,
  onCancel,
  submitLabel = 'Save Category',
  error: apiError,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [parentCategory, setParentCategory] = useState<number | string | null>(
    initialValues?.parentCategory !== undefined ? initialValues.parentCategory : null
  );
  const [categoryImage, setCategoryImage] = useState(initialValues?.categoryImage || '');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Archived'>(
    initialValues?.status || 'Active'
  );
  const [displayOrder, setDisplayOrder] = useState<number>(
    initialValues?.displayOrder !== undefined ? initialValues.displayOrder : 0
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear validation errors on inputs change
  useEffect(() => {
    setValidationError(null);
  }, [name, description, parentCategory, categoryImage, status, displayOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    // Prepare draft category object for validation
    const draftCategory: Partial<Category> = {
      name: trimmedName,
      description: trimmedDescription,
      parentCategory,
      categoryImage,
      status,
      displayOrder,
    };

    // Client-side pre-validation
    const err = await validateCategory(
      draftCategory,
      !!initialValues?.id,
      initialValues?.id
    );

    if (err) {
      setValidationError(err);
      return;
    }

    onSubmit({
      name: trimmedName,
      description: trimmedDescription,
      parentCategory: parentCategory || null,
      categoryImage,
      status,
      displayOrder,
    });
  };

  // Filter out the category itself if editing to prevent selecting itself as a parent (recursion)
  const filteredParents = parentCategories.filter(
    (p) => !initialValues?.id || p.id !== initialValues.id
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {(validationError || apiError) && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-900/40">
          {validationError || apiError}
        </div>
      )}

      {/* Category Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight">
          Category Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beverages, Electronics"
          className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400"
          required
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the types of products categorized under this segment..."
          rows={3}
          className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parent Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight">
            Parent Category
          </label>
          <select
            value={parentCategory === null ? '' : String(parentCategory)}
            onChange={(e) => {
              const val = e.target.value;
              setParentCategory(val === '' ? null : Number(val));
            }}
            className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="">None (Top Level Root)</option>
            {filteredParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Display Order */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight">
            Display Order
          </label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Category Image Uploader */}
      <CategoryImageUploader
        value={categoryImage}
        onChange={setCategoryImage}
        onRemove={() => setCategoryImage('')}
      />

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black text-slate-700 dark:text-slate-350 tracking-tight">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          {initialValues && <option value="Archived">Archived (Soft Deleted)</option>}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
        <button
          type="button"
          onClick={onCancel}
          className="px-4.5 py-2.5 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 border border-transparent transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
