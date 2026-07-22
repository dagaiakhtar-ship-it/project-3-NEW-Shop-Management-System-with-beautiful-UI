import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, ArrowUpDown } from 'lucide-react';
import { db, type Category } from '../../database/db';

interface FilterBarProps {
  categoryId: number | 'all';
  setCategoryId: (id: number | 'all') => void;
  status: 'Active' | 'Inactive' | 'Archived' | 'All';
  setStatus: (status: 'Active' | 'Inactive' | 'Archived' | 'All') => void;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out Of Stock' | 'All';
  setStockStatus: (status: 'In Stock' | 'Low Stock' | 'Out Of Stock' | 'All') => void;
  brand: string;
  setBrand: (brand: string) => void;
  brandsList: string[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categoryId,
  setCategoryId,
  status,
  setStatus,
  stockStatus,
  setStockStatus,
  brand,
  setBrand,
  brandsList,
  onReset,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const list = await db.categories.filter((c) => c.status !== 'Archived').toArray();
        setCategories(list);
      } catch (err) {
        console.error('Failed to load filter categories:', err);
      }
    }
    loadCategories();
  }, []);

  return (
    <div
      id="product-filter-bar"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/50 animate-in slide-in-from-top-1 duration-200"
    >
      {/* Category Dropdown */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Status Dropdown */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Stock Level
        </label>
        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value as any)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">All Stock Levels</option>
          <option value="In Stock">In Stock Only</option>
          <option value="Low Stock">Low Stock Warning</option>
          <option value="Out Of Stock">Out Of Stock Only</option>
        </select>
      </div>

      {/* Product Display Status */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Listing Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">Active & Inactive</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
          <option value="Archived">Archived (Deleted)</option>
        </select>
      </div>

      {/* Brand Select */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Brand Name
        </label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Brands</option>
          {brandsList.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Operations Button */}
      <div className="flex items-end">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
