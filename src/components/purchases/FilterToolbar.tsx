import React, { useState, useEffect } from 'react';
import { db, type Supplier } from '../../database/db';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Filter, RotateCcw, Calendar } from 'lucide-react';

interface FilterToolbarProps {
  supplierId: string;
  onSupplierChange: (val: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  onReset: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  supplierId,
  onSupplierChange,
  paymentStatus,
  onPaymentStatusChange,
  paymentMethod,
  onPaymentMethodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  status,
  onStatusChange,
  onReset,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const list = await db.suppliers.filter((s) => s.status !== 'Archived').toArray();
      setSuppliers(list);
    };
    fetchSuppliers();
  }, []);

  const supplierOptions = [
    { value: 'all', label: 'All Suppliers' },
    ...suppliers.map((s) => ({ value: String(s.id), label: s.companyName || s.name || 'Unnamed' })),
  ];

  const paymentStatusOptions = [
    { value: 'All', label: 'All Payment Statuses' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Unpaid', label: 'Unpaid' },
  ];

  const paymentMethodOptions = [
    { value: 'all', label: 'All Methods' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank', label: 'Bank' },
    { value: 'EasyPaisa', label: 'EasyPaisa' },
    { value: 'JazzCash', label: 'JazzCash' },
    { value: 'Card', label: 'Card' },
    { value: 'Other', label: 'Other' },
  ];

  const archiveStatusOptions = [
    { value: 'All', label: 'Active Records Only' }, // default behaves as active only, maps to excludes Archived
    { value: 'Active', label: 'Active Only' },
    { value: 'Archived', label: 'Soft Deleted (Archived)' },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-150/65 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-950 shadow-sm text-left">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        <span>Filter Parameters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Supplier Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Supplier</label>
          <Select
            options={supplierOptions}
            value={supplierId}
            onChange={onSupplierChange}
            placeholder="Supplier"
          />
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Payment Status</label>
          <Select
            options={paymentStatusOptions}
            value={paymentStatus}
            onChange={onPaymentStatusChange}
            placeholder="Payment Status"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Payment Method</label>
          <Select
            options={paymentMethodOptions}
            value={paymentMethod}
            onChange={onPaymentMethodChange}
            placeholder="Payment Method"
          />
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" /> Start Date
          </label>
          <Input
            type="date"
            className="text-xs font-mono p-1"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" /> End Date
          </label>
          <Input
            type="date"
            className="text-xs font-mono p-1"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-3">
        {/* Record status (Soft-deleted filter toggle) */}
        <div className="w-48 text-left">
          <Select
            options={archiveStatusOptions}
            value={status}
            onChange={onStatusChange}
            placeholder="Record Status"
          />
        </div>

        <Button variant="outline" size="xs" onClick={onReset} className="font-semibold text-slate-500">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterToolbar;
