import React from 'react';
import { Truck, ShoppingCart, AlertCircle } from 'lucide-react';
import { useRecentPurchases } from '../../hooks/useRecentPurchases';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

export const RecentPurchaseTable: React.FC = () => {
  const { purchases, isLoading, error } = useRecentPurchases(5);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return <Badge variant="success">Received</Badge>;
      case 'ordered':
        return <Badge variant="warning">Ordered</Badge>;
      case 'pending':
        return <Badge variant="indigo">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Recent Inventory Acquisitions
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Incoming stock replenishments from suppliers.
          </p>
        </div>
        <Truck className="h-5 w-5 text-indigo-500/80 dark:text-indigo-400" />
      </div>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              Loading acquisitions...
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Failed to load acquisitions</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
            No purchases logged. Replenish inventory under Purchases!
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  PO Reference
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Supplier
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Items Count
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Total
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Date
                </th>
                <th className="text-right text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 border-b border-slate-55 dark:border-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 text-xs font-black text-slate-850 dark:text-slate-200 tracking-tight">
                    {purchase.referenceNo}
                  </td>
                  <td className="py-3.5 text-xs font-bold text-slate-600 dark:text-slate-350">
                    {purchase.supplierName}
                  </td>
                  <td className="py-3.5 text-xs font-black text-slate-700 dark:text-slate-300">
                    {purchase.itemCount} units
                  </td>
                  <td className="py-3.5 text-xs font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(purchase.total)}
                  </td>
                  <td className="py-3.5 text-xs font-bold text-slate-450 dark:text-slate-500">
                    {formatDate(purchase.createdAt)}
                  </td>
                  <td className="py-3.5 text-right text-[10px] font-bold">
                    {getStatusBadge(purchase.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentPurchaseTable;
