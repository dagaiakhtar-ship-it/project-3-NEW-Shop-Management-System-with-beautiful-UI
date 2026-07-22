import React from 'react';
import { Eye, Edit2, Copy, Trash2, RotateCcw, Phone, Mail, MapPin } from 'lucide-react';
import { type Customer } from '../../database/db';
import CustomerAvatar from './CustomerAvatar';
import CustomerStatusBadge from './CustomerStatusBadge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface CustomerCardProps {
  customer: Customer;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRestore?: (id: number) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
}) => {
  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const isCreditType = customer.customerType === 'Permanent Credit Customer';

  return (
    <Card className="flex flex-col h-full border border-slate-150/50 bg-white p-4 dark:border-slate-850 dark:bg-slate-950/40 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] group text-left">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100/60 dark:border-slate-800/40">
        <div className="flex items-center gap-3">
          <CustomerAvatar
            profileImage={customer.profileImage}
            fullName={customer.fullName}
            size="md"
          />
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {customer.customerCode}
            </span>
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1 line-clamp-1">
              {customer.fullName}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {customer.customerType}
            </p>
          </div>
        </div>
        <CustomerStatusBadge status={customer.status} />
      </div>

      {/* Body Details */}
      <div className="py-3 flex-grow space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold line-clamp-1">{customer.phone}</span>
        </div>
        
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{customer.email}</span>
          </div>
        )}

        {(customer.address || customer.city) && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {customer.address ? `${customer.address}, ` : ''}{customer.city || ''}
            </span>
          </div>
        )}

        {/* Financial Section */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/20 text-center">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Balance
            </p>
            <p className={`text-xs font-black mt-0.5 ${
              (customer.currentBalance ?? 0) > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {formatCurrency(customer.currentBalance)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Credit Limit
            </p>
            <p className={`text-xs font-black mt-0.5 ${
              (customer.creditLimit ?? 0) > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
            }`}>
              {formatCurrency(customer.creditLimit)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100/60 dark:border-slate-800/40 mt-auto">
        {customer.isDeleted ? (
          <>
            {onRestore && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onRestore(customer.id!)}
                className="flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 border-emerald-250 dark:border-emerald-800/50"
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onView(customer.id!)}
              className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
              title="View Profile"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onEdit(customer.id!)}
              className="p-1.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
              title="Edit Customer"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDuplicate(customer.id!)}
              className="p-1.5 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30"
              title="Duplicate Customer"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(customer.id!)}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600"
              title="Delete Customer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default CustomerCard;
