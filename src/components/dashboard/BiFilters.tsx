import React from 'react';
import { Filter, RotateCcw, CalendarDays, Wallet, Layers, Users, Truck } from 'lucide-react';
import { type Category, type Customer, type Supplier } from '../../database/db';

interface BiFiltersProps {
  filters: {
    dateRange: 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';
    startDate: string;
    endDate: string;
    paymentMethod: string;
    category: string;
    customer: string;
    supplier: string;
  };
  onChange: React.Dispatch<React.SetStateAction<{
    dateRange: 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';
    startDate: string;
    endDate: string;
    paymentMethod: string;
    category: string;
    customer: string;
    supplier: string;
  }>>;
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  paymentMethods?: string[];
  isLoading?: boolean;
}

export const BiFilters: React.FC<BiFiltersProps> = ({
  filters,
  onChange,
  categories = [],
  customers = [],
  suppliers = [],
  paymentMethods = ['Cash', 'Card', 'Credit', 'Bank Transfer'],
  isLoading
}) => {
  const filterPreset = filters.dateRange;
  const setFilterPreset = (preset: any) => onChange(prev => ({ ...prev, dateRange: preset }));

  const customStartDate = filters.startDate;
  const setCustomStartDate = (date: string) => onChange(prev => ({ ...prev, startDate: date }));

  const customEndDate = filters.endDate;
  const setCustomEndDate = (date: string) => onChange(prev => ({ ...prev, endDate: date }));

  const slicers = {
    paymentMethod: filters.paymentMethod === 'all' ? 'All' : (filters.paymentMethod || 'All'),
    categoryId: filters.category === 'all' ? 'All' : (filters.category || 'All'),
    customerId: filters.customer === 'all' ? 'All' : (filters.customer || 'All'),
    supplierId: filters.supplier === 'all' ? 'All' : (filters.supplier || 'All')
  };

  const setSlicers = (update: any) => {
    onChange(prev => {
      const currentSlicers = {
        paymentMethod: prev.paymentMethod === 'all' ? 'All' : (prev.paymentMethod || 'All'),
        categoryId: prev.category === 'all' ? 'All' : (prev.category || 'All'),
        customerId: prev.customer === 'all' ? 'All' : (prev.customer || 'All'),
        supplierId: prev.supplier === 'all' ? 'All' : (prev.supplier || 'All')
      };
      const result = typeof update === 'function' ? update(currentSlicers) : update;
      return {
        ...prev,
        paymentMethod: result.paymentMethod,
        category: result.categoryId,
        customer: result.customerId,
        supplier: result.supplierId
      };
    });
  };

  const onReset = () => {
    onChange({
      dateRange: 'month',
      startDate: '',
      endDate: '',
      paymentMethod: 'All',
      category: 'All',
      customer: 'All',
      supplier: 'All'
    });
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-left">
      
      {/* 1. Header & Preset Selection Buttons */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Filter className="h-4.5 w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 tracking-tight uppercase">
                Interactive Slicers & Filters
              </h4>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                Slice dashboard metrics across date bounds, payment methods, and participants
              </p>
            </div>
          </div>
        </div>

        {/* Date Presets Button Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Date' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setFilterPreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                filterPreset === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100 dark:shadow-none font-extrabold'
                  : 'bg-slate-50/50 hover:bg-slate-100/70 dark:bg-slate-950 dark:hover:bg-slate-900/60 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            onClick={onReset}
            title="Reset All Slicers"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Custom Date Range inputs (conditional) */}
      {filterPreset === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-black text-slate-500">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="flex-1 text-xs font-extrabold bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-black text-slate-500">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="flex-1 text-xs font-extrabold bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      )}

      {/* 3. Dropdown Slicers Grid (Payment, Category, Customer, Supplier) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payment Method Slicer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            Payment Slicer
          </label>
          <select
            value={slicers.paymentMethod}
            onChange={(e) => setSlicers(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Payment Methods</option>
            {paymentMethods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Category Slicer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Category Slicer
          </label>
          <select
            value={slicers.categoryId}
            onChange={(e) => setSlicers(prev => ({ ...prev, categoryId: e.target.value }))}
            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Customer Slicer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Customer Slicer
          </label>
          <select
            value={slicers.customerId}
            onChange={(e) => setSlicers(prev => ({ ...prev, customerId: e.target.value }))}
            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={String(c.id)}>{c.fullName || c.name}</option>
            ))}
          </select>
        </div>

        {/* Supplier Slicer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Supplier Slicer
          </label>
          <select
            value={slicers.supplierId}
            onChange={(e) => setSlicers(prev => ({ ...prev, supplierId: e.target.value }))}
            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-350 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={String(s.id)}>{s.companyName || s.name}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
};

export default BiFilters;
