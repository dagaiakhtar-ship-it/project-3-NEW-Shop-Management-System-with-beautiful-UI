import React from 'react';
import { Eye, Edit, Copy, Trash, RefreshCw, Mail, Phone, MapPin, DollarSign, Wallet, User } from 'lucide-react';
import { type Supplier } from '../../database/db';
import SupplierStatusBadge from './SupplierStatusBadge';
import Card from '../ui/Card';

interface SupplierCardProps {
  supplier: Supplier & { purchaseCount: number };
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  onDuplicate: (id: number) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onDuplicate,
}) => {
  const isArchived = supplier.status === 'Archived';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <Card
      className={`p-4 border text-left flex flex-col gap-3.5 relative transition duration-200 hover:shadow-md bg-white dark:bg-slate-950 ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/5 ring-1 ring-indigo-500'
          : 'border-slate-150/65 dark:border-slate-800'
      }`}
    >
      {/* Top Bar: Selector, Code, Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(supplier.id!)}
            className="h-4 w-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="font-mono text-xs font-bold text-indigo-650 dark:text-indigo-400">
            {supplier.supplierCode}
          </span>
        </div>
        <SupplierStatusBadge status={supplier.status || 'Active'} />
      </div>

      {/* Identity: Company Name, Contact Person */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onView(supplier)}
          className="font-black text-slate-900 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 hover:underline text-sm leading-tight block text-left cursor-pointer"
        >
          {supplier.companyName}
        </button>
        {supplier.contactPerson && (
          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{supplier.contactPerson}</span>
          </p>
        )}
      </div>

      {/* Communications & Address */}
      <div className="text-[11px] space-y-1.5 text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-50 dark:border-slate-900 pt-2.5">
        {/* Telephone */}
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-slate-450" />
          <span>{supplier.phone}</span>
        </div>

        {/* Email */}
        {supplier.email && (
          <div className="flex items-center gap-2 truncate">
            <Mail className="h-3 w-3 text-slate-450" />
            <span>{supplier.email}</span>
          </div>
        )}

        {/* Location */}
        {(supplier.city || supplier.country) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-slate-450" />
            <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Financial Info Banner */}
      <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-50 dark:border-slate-900 py-2 text-[11px]">
        <div>
          <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Opening Bal.
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
            {formatCurrency(supplier.openingBalance || 0)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Outstanding
          </span>
          <span className={`font-black mt-0.5 block ${supplier.currentBalance && supplier.currentBalance > 0 ? 'text-rose-650 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
            {formatCurrency(supplier.currentBalance || 0)}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md font-mono">
          POs: {supplier.purchaseCount}
        </span>
        <div className="flex items-center gap-2">
          {/* View detail button */}
          <button
            onClick={() => onView(supplier)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {!isArchived && (
            <>
              {/* Edit supplier */}
              <button
                onClick={() => onEdit(supplier)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer"
                title="Edit Supplier"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>

              {/* Duplicate supplier */}
              <button
                onClick={() => onDuplicate(supplier.id!)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer"
                title="Duplicate Supplier"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>

              {/* Soft delete */}
              <button
                onClick={() => onDelete(supplier.id!)}
                className="p-1.5 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-lg text-rose-500 dark:text-rose-450 transition cursor-pointer"
                title="Archive Supplier"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {isArchived && (
            /* Restore */
            <button
              onClick={() => onRestore(supplier.id!)}
              className="p-1.5 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-lg text-indigo-650 dark:text-indigo-400 transition cursor-pointer"
              title="Restore Supplier"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SupplierCard;
