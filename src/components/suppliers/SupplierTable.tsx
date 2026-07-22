import React from 'react';
import { Eye, Edit, Copy, Trash, RefreshCw, Mail, Phone, MapPin, DollarSign, ArrowUpRight } from 'lucide-react';
import { type Supplier } from '../../database/db';
import SupplierStatusBadge from './SupplierStatusBadge';
import Button from '../ui/Button';

interface SupplierTableProps {
  suppliers: (Supplier & { purchaseCount: number })[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  onDuplicate: (id: number) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onDuplicate,
}) => {
  const isAllSelected = suppliers.length > 0 && selectedIds.length === suppliers.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < suppliers.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-150/60 bg-white dark:border-slate-800/85 dark:bg-slate-950/40 shadow-sm animate-in fade-in duration-200">
      <table className="w-full border-collapse text-left text-xs">
        {/* Table Header */}
        <thead className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-150/60 dark:border-slate-800/85">
          <tr>
            {/* Checkbox Column */}
            <th className="p-4 w-12 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isSomeSelected;
                  }
                }}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>

            {/* Code Column */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider w-32">
              Supplier Code
            </th>

            {/* Company & Contact Column */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Company / Vendor
            </th>

            {/* Communications */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider hidden lg:table-cell">
              Contact Details
            </th>

            {/* Locations */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider hidden md:table-cell">
              Location
            </th>

            {/* Outstanding Balance Column */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-right w-44">
              Outstanding Balance
            </th>

            {/* Status Column */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-center w-28">
              Status
            </th>

            {/* Actions Column */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-right w-40">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
          {suppliers.map((s) => {
            const isSelected = selectedIds.includes(s.id!);
            const isArchived = s.status === 'Archived';

            return (
              <tr
                key={s.id}
                className={`transition hover:bg-slate-50/50 dark:hover:bg-slate-900/25 ${
                  isSelected ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                }`}
              >
                {/* Select Checkbox */}
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(s.id!)}
                    className="h-4 w-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>

                {/* Supplier Code */}
                <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {s.supplierCode}
                </td>

                {/* Company Name & Contact Person */}
                <td className="p-4">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => onView(s)}
                      className="text-left font-black text-slate-850 dark:text-slate-100 hover:text-indigo-650 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{s.companyName}</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {s.contactPerson && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        CP: {s.contactPerson}
                      </span>
                    )}
                  </div>
                </td>

                {/* Communications details */}
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Geographic Locations */}
                <td className="p-4 hidden md:table-cell">
                  {s.city || s.country ? (
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>
                        {[s.city, s.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>
                  )}
                </td>

                {/* Outstanding Current Balance */}
                <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={s.currentBalance && s.currentBalance > 0 ? 'text-rose-650 dark:text-rose-400' : ''}>
                      {formatCurrency(s.currentBalance || 0)}
                    </span>
                    {(s.openingBalance || 0) > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        OB: {formatCurrency(s.openingBalance)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status Badges */}
                <td className="p-4 text-center">
                  <SupplierStatusBadge status={s.status || 'Active'} />
                </td>

                {/* Action Column Buttons */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Detail Drawer trigger */}
                    <button
                      onClick={() => onView(s)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {!isArchived && (
                      <>
                        {/* Edit Entry Trigger */}
                        <button
                          onClick={() => onEdit(s)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Duplicate Record */}
                        <button
                          onClick={() => onDuplicate(s.id!)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition cursor-pointer"
                          title="Duplicate Supplier"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Soft Delete */}
                        <button
                          onClick={() => onDelete(s.id!)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition cursor-pointer"
                          title="Archive Supplier"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {isArchived && (
                      /* Restore Deleted Supplier */
                      <button
                        onClick={() => onRestore(s.id!)}
                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/25 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                        title="Restore Supplier"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierTable;
