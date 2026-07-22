import React, { useState, useEffect } from 'react';
import { db } from '../../database/db';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';

interface FilterToolbarProps {
  filters: any;
  onChange: (updatedFilters: any) => void;
  reportType: string; // Used to hide/show contextual fields
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onChange,
  reportType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Lists fetched from DB
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [custs, sups, prods, cats, expCats] = await Promise.all([
          db.customers.toArray(),
          db.suppliers.toArray(),
          db.products.toArray(),
          db.categories.toArray(),
          db.expenseCategories.toArray(),
        ]);
        
        setCustomers(custs.filter(c => !c.isDeleted));
        setSuppliers(sups.filter(s => s.status !== 'Archived'));
        setProducts(prods.filter(p => p.status !== 'Archived'));
        setCategories(cats.filter(c => c.status !== 'Archived'));
        setExpenseCategories(expCats.filter(ec => ec.status !== 'Inactive'));
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    const parsedValue = value === '' ? undefined : (typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value);
    onChange({
      ...filters,
      [field]: parsedValue,
    });
  };

  const handleReset = () => {
    onChange({
      dateFilter: filters.dateFilter,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  // Check if any filters other than date are active
  const activeFiltersCount = Object.keys(filters).filter(
    (key) => !['dateFilter', 'startDate', 'endDate'].includes(key) && filters[key] !== undefined
  ).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-white">
            Advanced Data Filters
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full animate-pulse">
              {activeFiltersCount} Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 cursor-pointer"
          >
            <span>{isOpen ? 'Hide Panel' : 'Show Panel'}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expandable filter controls */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800/50 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in text-left">
          {/* 1. Customer Filter (Sales/Credit/General) */}
          {(['sales', 'credit', 'profitLoss', 'analytics'].includes(reportType) || reportType.toLowerCase().includes('customer')) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Customer Account
              </label>
              <select
                id="filter-customer"
                value={filters.customerId || ''}
                onChange={(e) => handleFieldChange('customerId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Supplier Filter (Purchases/General) */}
          {(['purchases', 'profitLoss', 'analytics'].includes(reportType) || reportType.toLowerCase().includes('supplier')) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Supplier / Brand
              </label>
              <select
                id="filter-supplier"
                value={filters.supplierId || ''}
                onChange={(e) => handleFieldChange('supplierId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Product Filter */}
          {(['sales', 'purchases', 'stock', 'analytics'].includes(reportType) || reportType.toLowerCase().includes('product')) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Specific Product
              </label>
              <select
                id="filter-product"
                value={filters.productId || ''}
                onChange={(e) => handleFieldChange('productId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Category Filter */}
          {(['sales', 'purchases', 'stock', 'analytics'].includes(reportType) || reportType.toLowerCase().includes('category')) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Product Category
              </label>
              <select
                id="filter-category"
                value={filters.categoryId || ''}
                onChange={(e) => handleFieldChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Payment Method */}
          {(['sales', 'purchases', 'expenses'].includes(reportType)) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Channel
              </label>
              <select
                id="filter-payment-method"
                value={filters.paymentMethod || ''}
                onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile Payment">Mobile Payment</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit">Credit / Account Balance</option>
              </select>
            </div>
          )}

          {/* 6. Sale Type */}
          {(['sales'].includes(reportType)) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Sale Type
              </label>
              <select
                id="filter-sale-type"
                value={filters.saleType || ''}
                onChange={(e) => handleFieldChange('saleType', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="Cash Sale">Cash Sale</option>
                <option value="Credit Sale">Credit Sale</option>
                <option value="Partial Payment Sale">Partial Payment Sale</option>
              </select>
            </div>
          )}

          {/* 7. Expense Category */}
          {(['expenses'].includes(reportType)) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Expense Category
              </label>
              <select
                id="filter-expense-category"
                value={filters.expenseCategoryId || ''}
                onChange={(e) => handleFieldChange('expenseCategoryId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Expense Categories</option>
                {expenseCategories.map((ec) => (
                  <option key={ec.id} value={ec.id}>
                    {ec.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 8. Generic Status (Contextual) */}
          {(['sales', 'purchases', 'expenses', 'credit'].includes(reportType)) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment/Record Status
              </label>
              <select
                id="filter-status"
                value={filters.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="">All Statuses</option>
                {reportType === 'credit' ? (
                  <>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </>
                ) : reportType === 'expenses' ? (
                  <>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Voided">Voided</option>
                  </>
                ) : (
                  <>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;
