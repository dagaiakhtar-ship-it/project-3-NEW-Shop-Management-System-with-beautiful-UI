import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

interface FilterToolbarProps {
  customerType: string;
  onCustomerTypeChange: (type: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  cities: string[];
  customerTypes: string[];
  onReset: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  customerType,
  onCustomerTypeChange,
  status,
  onStatusChange,
  city,
  onCityChange,
  cities,
  customerTypes,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-150/50 dark:border-slate-850 shadow-inner text-left animate-in slide-in-from-top-3 duration-250">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Refine Directory Filter
        </h4>
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Filter by Type */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Customer Type
          </label>
          <select
            value={customerType}
            onChange={(e) => onCustomerTypeChange(e.target.value)}
            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="All">All Types</option>
            <option value="Walk-in Customer">Walk-in Customer</option>
            <option value="Regular Customer">Regular Customer</option>
            <option value="Permanent Credit Customer">Permanent Credit Customer</option>
            <option value="Wholesale Customer">Wholesale Customer</option>
            <option value="VIP Customer">VIP Customer</option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="All">All Statuses (Active, Inactive, Blocked)</option>
            <option value="Active">Active accounts</option>
            <option value="Inactive">Inactive accounts</option>
            <option value="Blocked">Blocked accounts</option>
            <option value="Deleted">Deleted / Soft Deleted</option>
            <option value="all-active-inactive">All Non-Deleted Accounts</option>
          </select>
        </div>

        {/* Filter by City */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Billing City
          </label>
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full text-xs font-semibold h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="all">All Cities</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};

export default FilterToolbar;
