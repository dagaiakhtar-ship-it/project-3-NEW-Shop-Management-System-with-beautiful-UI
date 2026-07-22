import React, { useState, useEffect } from 'react';
import { RefreshCw, Barcode, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { db, type Product, type Category } from '../../database/db';
import { useBarcode } from '../../hooks/useBarcode';
import { useSKU } from '../../hooks/useSKU';
import ProductImageUploader from './ProductImageUploader';
import Button from '../ui/Button';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Load categories from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Form Field States
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minimumStock, setMinimumStock] = useState<number | ''>('');
  const [unit, setUnit] = useState('Pcs');
  const [brand, setBrand] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Custom utilities Hooks
  const { generateBarcode, isGenerating: isGeneratingBarcode } = useBarcode();
  const { generateSKU, isGenerating: isGeneratingSKU } = useSKU();

  // Local Validation Warning States
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load and populate fields on mount or initialData change
  useEffect(() => {
    async function fetchCategories() {
      try {
        const list = await db.categories.filter((c) => c.status !== 'Archived').toArray();
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();

    if (initialData) {
      setName(initialData.name || '');
      setCategoryId(initialData.categoryId || '');
      setSku(initialData.sku || '');
      setBarcode(initialData.barcode || '');
      setDescription(initialData.description || '');
      setPurchasePrice(
        initialData.purchasePrice !== undefined
          ? initialData.purchasePrice
          : (initialData.cost !== undefined ? initialData.cost : '')
      );
      setSellingPrice(
        initialData.sellingPrice !== undefined
          ? initialData.sellingPrice
          : (initialData.price !== undefined ? initialData.price : '')
      );
      setCurrentStock(
        initialData.currentStock !== undefined
          ? initialData.currentStock
          : (initialData.stock !== undefined ? initialData.stock : '')
      );
      setMinimumStock(
        initialData.minimumStock !== undefined
          ? initialData.minimumStock
          : (initialData.alertQuantity !== undefined ? initialData.alertQuantity : '')
      );
      setUnit(initialData.unit || 'Pcs');
      setBrand(initialData.brand || '');
      setImage(initialData.image || '');
      setStatus(initialData.status === 'Inactive' ? 'Inactive' : 'Active');
    } else {
      // Set defaults for new products
      setName('');
      setCategoryId('');
      setSku('');
      setBarcode('');
      setDescription('');
      setPurchasePrice('');
      setSellingPrice('');
      setCurrentStock('');
      setMinimumStock(5); // healthy default alert stock level
      setUnit('Pcs');
      setBrand('');
      setImage('');
      setStatus('Active');
    }
  }, [initialData]);

  // Handle SKU auto generation trigger based on category prefix
  const handleSKUGenerate = async () => {
    const selectedCategory = categories.find((c) => c.id === Number(categoryId));
    try {
      const generated = await generateSKU(selectedCategory?.name || 'PRD');
      setSku(generated);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Barcode auto generation trigger
  const handleBarcodeGenerate = async () => {
    try {
      const generated = await generateBarcode();
      setBarcode(generated);
    } catch (err) {
      console.error(err);
    }
  };

  // Live Calculations (Profit & Markups)
  const pPrice = Number(purchasePrice) || 0;
  const sPrice = Number(sellingPrice) || 0;
  const profit = parseFloat((sPrice - pPrice).toFixed(2));
  const profitPercentage = pPrice > 0 ? parseFloat(((profit / pPrice) * 100).toFixed(1)) : 0;
  const profitMargin = sPrice > 0 ? parseFloat(((profit / sPrice) * 100).toFixed(1)) : 0;

  const isCostExceedingPrice = pPrice > sPrice && sPrice > 0;

  // Form Submission Validator
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Front-end Validations
    if (!name.trim()) {
      setValidationError('Product Name is required.');
      return;
    }
    if (!categoryId) {
      setValidationError('Category selection is required.');
      return;
    }
    if (purchasePrice === '' || isNaN(Number(purchasePrice))) {
      setValidationError('Purchase Price is required.');
      return;
    }
    if (sellingPrice === '' || isNaN(Number(sellingPrice))) {
      setValidationError('Selling Price is required.');
      return;
    }
    if (Number(purchasePrice) < 0 || Number(sellingPrice) < 0) {
      setValidationError('Pricing values cannot be negative numbers.');
      return;
    }
    if (currentStock !== '' && Number(currentStock) < 0) {
      setValidationError('Current stock level cannot be negative.');
      return;
    }
    if (minimumStock !== '' && Number(minimumStock) < 0) {
      setValidationError('Minimum alert stock level cannot be negative.');
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: Number(categoryId),
      sku: sku.trim(),
      barcode: barcode.trim(),
      description: description.trim(),
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      profit,
      currentStock: currentStock === '' ? 0 : Number(currentStock),
      minimumStock: minimumStock === '' ? 0 : Number(minimumStock),
      unit: unit.trim() || 'Pcs',
      brand: brand.trim(),
      image,
      status,
    };

    onSubmit(payload);
  };

  return (
    <form id="product-form" onSubmit={handleFormSubmit} className="space-y-6">
      {/* 0. Form Error Banner */}
      {validationError && (
        <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-400 p-3.5 rounded-2xl text-xs font-bold leading-relaxed">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 1. Core Fields Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Input */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wireless Ergonomic Mouse"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Category Dropdown Selection */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Category <span className="text-rose-500">*</span>
          </label>
          {isLoadingCategories ? (
            <div className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 animate-pulse flex items-center px-4">
              <span className="text-xs text-slate-400 font-bold">Querying Category index...</span>
            </div>
          ) : (
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {categories.length === 0 && !isLoadingCategories && (
            <p className="text-[10px] text-rose-500 font-black mt-0.5">
              No categories exist! Please create a product category first.
            </p>
          )}
        </div>
      </div>

      {/* 2. Barcode & SKU Codes Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SKU Field with Auto-Generate helper */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>SKU Code (Stock Keeping Unit)</span>
            <span className="text-[10px] text-slate-400 lowercase font-medium">Auto-generate ready</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ELC-10029-012"
              className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="button"
              onClick={handleSKUGenerate}
              disabled={isGeneratingSKU}
              title="Generate Random SKU Code"
              className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg transition"
            >
              <Sparkles className={`h-4 w-4 ${isGeneratingSKU ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Barcode Field with Auto-Generate helper */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Barcode Number (UPC/EAN)</span>
            <span className="text-[10px] text-slate-400 lowercase font-medium">Scanner Ready</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 880123456789"
              className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="button"
              onClick={handleBarcodeGenerate}
              disabled={isGeneratingBarcode}
              title="Generate EAN-12 Barcode"
              className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg transition"
            >
              <Barcode className={`h-4 w-4 ${isGeneratingBarcode ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Description Field */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter product specification details, materials, warranty, or notes..."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
        />
      </div>

      {/* 4. Pricing & Profit Calculator Group */}
      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 space-y-4">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          Pricing structures & instant profit analyzer
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Price (Cost) */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Purchase Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Selling Price */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Selling Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Cost Warning */}
        {isCostExceedingPrice && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/65 text-amber-800 dark:text-amber-400 p-3.5 rounded-xl text-xs font-black leading-none">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Warning: Purchase cost exceeds selling price. You will take a loss.</span>
          </div>
        )}

        {/* Analytical Profit Breakdown Cards */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Net Profit */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">
              Net Profit
            </span>
            <span
              className={`text-sm font-black block mt-1 ${
                profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ${profit.toFixed(2)}
            </span>
          </div>

          {/* Markup % */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">
              Markup %
            </span>
            <span
              className={`text-sm font-black block mt-1 ${
                profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-350'
              }`}
            >
              {profitPercentage}%
            </span>
          </div>

          {/* Margin % */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">
              Margin %
            </span>
            <span
              className={`text-sm font-black block mt-1 ${
                profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {profitMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* 5. Stocks, Unit & Brand Group */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Stock */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Current Stock <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            required
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 100"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Minimum Stock (Alert level) */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Minimum Stock
          </label>
          <input
            type="number"
            min="0"
            required
            value={minimumStock}
            onChange={(e) => setMinimumStock(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 10"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Unit Selection */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Unit Segment
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
          >
            <option value="Pcs">Pcs (Pieces)</option>
            <option value="Box">Box</option>
            <option value="Packet">Packet</option>
            <option value="Kg">Kg (Kilograms)</option>
            <option value="Liter">Ltr (Liters)</option>
            <option value="Carton">Carton</option>
          </select>
        </div>

        {/* Brand */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Brand/Maker
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Logitech"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* 6. Product Status */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Stock Display Status
        </label>
        <div className="flex items-center gap-4 mt-1 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-150/60 dark:border-slate-800/40 w-fit">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="product_status"
              value="Active"
              checked={status === 'Active'}
              onChange={() => setStatus('Active')}
              className="text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4"
            />
            <span>Active Listing</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="product_status"
              value="Inactive"
              checked={status === 'Inactive'}
              onChange={() => setStatus('Inactive')}
              className="text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4"
            />
            <span>Inactive / Suspended</span>
          </label>
        </div>
      </div>

      {/* 7. Image Uploader Component */}
      <ProductImageUploader image={image} onChange={setImage} onClear={() => setImage('')} />

      {/* 8. Action Buttons */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-6">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          {initialData ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
