import React from 'react';
import { Eye, Edit2, Copy, Trash2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { type Customer } from '../../database/db';
import { type CustomerSortBy } from '../../hooks/useCustomerSort';
import CustomerAvatar from './CustomerAvatar';
import CustomerStatusBadge from './CustomerStatusBadge';
import Button from '../ui/Button';

interface CustomerTableProps {
  customers: Customer[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  sortBy: CustomerSortBy;
  onSortChange: (sort: CustomerSortBy) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  sortBy,
  onSortChange,
}) => {
  const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < customers.length;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSortIndicator = (field: string) => {
    if (field === 'fullName') {
      if (sortBy === 'fullName_asc') return <ArrowUp className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
      if (sortBy === 'fullName_desc') return <ArrowDown className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
    }
    if (field === 'currentBalance') {
      if (sortBy === 'currentBalance_asc') return <ArrowUp className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
      if (sortBy === 'currentBalance_desc') return <ArrowDown className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
    }
    if (field === 'creditLimit') {
      if (sortBy === 'creditLimit_asc') return <ArrowUp className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
      if (sortBy === 'creditLimit_desc') return <ArrowDown className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
    }
    if (field === 'createdAt') {
      if (sortBy === 'oldest') return <ArrowUp className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
      if (sortBy === 'newest') return <ArrowDown className="h-3 w-3 inline text-indigo-600 dark:text-indigo-400 font-black ml-1" />;
    }
    return <ArrowUpDown className="h-3 w-3 inline text-slate-350 dark:text-slate-600 ml-1 hover:text-indigo-500" />;
  };

  const handleSortClick = (field: string) => {
    if (field === 'fullName') {
      onSortChange(sortBy === 'fullName_asc' ? 'fullName_desc' : 'fullName_asc');
    } else if (field === 'currentBalance') {
      onSortChange(sortBy === 'currentBalance_asc' ? 'currentBalance_desc' : 'currentBalance_asc');
    } else if (field === 'creditLimit') {
      onSortChange(sortBy === 'creditLimit_asc' ? 'creditLimit_desc' : 'creditLimit_asc');
    } else if (field === 'createdAt') {
      onSortChange(sortBy === 'newest' ? 'oldest' : 'newest');
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-150/60 bg-white dark:border-slate-800/85 dark:bg-slate-950/40 shadow-sm animate-in fade-in duration-200">
      <table className="w-full border-collapse text-left text-xs">
        {/* Table Head */}
        <thead className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-slate-150/60 dark:border-slate-800/85 select-none">
          <tr>
            {/* Bulk Checkbox Column */}
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

            {/* Avatar & Code */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider w-16">
              Image
            </th>

            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider w-32">
              Code
            </th>

            {/* Full Name Column (Sortable) */}
            <th
              onClick={() => handleSortClick('fullName')}
              className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
            >
              Full Name {renderSortIndicator('fullName')}
            </th>

            {/* Customer Type */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider hidden md:table-cell">
              Type
            </th>

            {/* Phone */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Phone
            </th>

            {/* Current Balance (Sortable) */}
            <th
              onClick={() => handleSortClick('currentBalance')}
              className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-right w-36 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
            >
              Balance {renderSortIndicator('currentBalance')}
            </th>

            {/* Credit Limit (Sortable) */}
            <th
              onClick={() => handleSortClick('creditLimit')}
              className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-right w-36 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors hidden lg:table-cell"
            >
              Credit Limit {renderSortIndicator('creditLimit')}
            </th>

            {/* Status */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-center w-28">
              Status
            </th>

            {/* Created Date (Sortable) */}
            <th
              onClick={() => handleSortClick('createdAt')}
              className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-center w-32 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors hidden lg:table-cell"
            >
              Registered {renderSortIndicator('createdAt')}
            </th>

            {/* Actions */}
            <th className="p-4 font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider text-right w-40">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={11} className="p-12 text-center text-slate-400 dark:text-slate-500">
                No customer records match your filter criteria.
              </td>
            </tr>
          ) : (
            customers.map((c) => (
              <tr
                key={c.id}
                className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10 ${
                  c.isDeleted ? 'bg-slate-50/20 text-slate-400 dark:bg-slate-900/5' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id!)}
                    onChange={() => onToggleSelect(c.id!)}
                    className="h-4 w-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>

                {/* Profile Image */}
                <td className="p-4">
                  <CustomerAvatar
                    profileImage={c.profileImage}
                    fullName={c.fullName}
                    size="sm"
                  />
                </td>

                {/* Code */}
                <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                  <span className="font-mono bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded text-[11px] border border-slate-100 dark:border-slate-800">
                    {c.customerCode}
                  </span>
                </td>

                {/* Name */}
                <td className="p-4 font-bold text-slate-900 dark:text-white">
                  <div className="flex flex-col">
                    <span className="text-xs">{c.fullName}</span>
                    {c.email && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {c.email}
                      </span>
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="p-4 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                  {c.customerType}
                </td>

                {/* Phone */}
                <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                  {c.phone}
                </td>

                {/* Current Balance */}
                <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">
                  <span className={c.currentBalance && c.currentBalance > 0 ? 'text-rose-600 dark:text-rose-450' : ''}>
                    {formatCurrency(c.currentBalance)}
                  </span>
                </td>

                {/* Credit Limit */}
                <td className="p-4 text-right font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                  {formatCurrency(c.creditLimit)}
                </td>

                {/* Status */}
                <td className="p-4 text-center">
                  <CustomerStatusBadge status={c.isDeleted ? 'Deleted' : c.status} />
                </td>

                {/* Created Date */}
                <td className="p-4 text-center font-medium text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                  {formatDate(c.createdAt)}
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {c.isDeleted ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onRestore(c.id!)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        title="Restore Customer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onView(c.id!)}
                          className="p-1 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 text-indigo-500"
                          title="View Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onEdit(c.id!)}
                          className="p-1 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 text-amber-500"
                          title="Edit Customer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onDuplicate(c.id!)}
                          className="p-1 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30 text-teal-500"
                          title="Duplicate Customer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onDelete(c.id!)}
                          className="p-1 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-650"
                          title="Soft Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
