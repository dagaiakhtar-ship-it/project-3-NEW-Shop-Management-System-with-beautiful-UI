import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SupplierFilterBarProps {
  status: 'Active' | 'Inactive' | 'Archived' | 'All';
  setStatus: (status: 'Active' | 'Inactive' | 'Archived' | 'All') => void;
  city: string;
  setCity: (city: string) => void;
  citiesList: string[];
  country: string;
  setCountry: (country: string) => void;
  countriesList: string[];
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  paymentTermsList: string[];
  onReset: () => void;
}

export const SupplierFilterBar: React.FC<SupplierFilterBarProps> = ({
  status,
  setStatus,
  city,
  setCity,
  citiesList,
  country,
  setCountry,
  countriesList,
  paymentTerms,
  setPaymentTerms,
  paymentTermsList,
  onReset,
}) => {
  return (
    <div
      id="supplier-filter-bar"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/50 animate-in slide-in-from-top-1 duration-200 text-left"
    >
      {/* Listing Status Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Supplier Status
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

      {/* City Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          City Location
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Cities</option>
          {citiesList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Country Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Country Location
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Countries</option>
          {countriesList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Terms Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          Payment Terms
        </label>
        <select
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Terms</option>
          {paymentTermsList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Reset filters */}
      <div className="flex items-end">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 h-9 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};

export default SupplierFilterBar;
