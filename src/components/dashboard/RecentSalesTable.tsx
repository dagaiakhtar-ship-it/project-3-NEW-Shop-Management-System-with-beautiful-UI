import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, Eye, X, Receipt, ShoppingBag, User, Calendar, CreditCard as CreditCardIcon, AlertCircle } from 'lucide-react';
import { useRecentSales, type RecentSaleItem } from '../../hooks/useRecentSales';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

export const RecentSalesTable: React.FC = () => {
  const { sales, isLoading, error } = useRecentSales(6);
  const [selectedSale, setSelectedSale] = useState<RecentSaleItem | null>(null);

  // Status Badge resolver
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'refunded':
        return <Badge variant="danger">Refunded</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Payment Method Badge resolver
  const getPaymentBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <Badge variant="success">Cash</Badge>;
      case 'card':
        return <Badge variant="indigo">Card</Badge>;
      case 'credit':
        return <Badge variant="danger">Credit</Badge>;
      case 'bank transfer':
        return <Badge variant="warning">Bank Transfer</Badge>;
      default:
        return <Badge variant="default">{method}</Badge>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Recent POS Transactions
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Latest customer checkout sales registers.
          </p>
        </div>
        <FileSpreadsheet className="h-5 w-5 text-indigo-500/80 dark:text-indigo-400" />
      </div>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              Loading sales feed...
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Failed to load sales</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
            No sales recorded yet. Use POS Sales to create one!
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Invoice No
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Customer
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Items Sold
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Total
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Payment
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Date
                </th>
                <th className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Status
                </th>
                <th className="text-right text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-850/30 border-b border-slate-50 dark:border-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
                    {sale.invoiceNo}
                  </td>
                  <td className="py-3 text-xs font-bold text-slate-600 dark:text-slate-350">
                    {sale.customerName}
                  </td>
                  <td className="py-3 text-xs font-black text-slate-700 dark:text-slate-300">
                    {sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3 text-xs font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="py-3 text-[10px] font-bold">
                    {getPaymentBadge(sale.paymentMethod)}
                  </td>
                  <td className="py-3 text-xs font-bold text-slate-450 dark:text-slate-500">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="py-3 text-[10px] font-bold">
                    {getStatusBadge(sale.status)}
                  </td>
                  <td className="py-3 text-right">
                    <button className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Modal Drawer */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            {/* Modal backdrop closer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setSelectedSale(null)}
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedSale(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-55/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Receipt className="h-6 w-6 stroke-[2]" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Invoice Breakdown
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    Retail checkout receipt summary
                  </p>
                </div>
              </div>

              {/* Invoice Meta information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl mb-6 text-left border border-slate-150/40 dark:border-slate-800/40">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Invoice Number
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {selectedSale.invoiceNo}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Sale Date & Time
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatDate(selectedSale.createdAt, true)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Customer Name
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedSale.customerName}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Payment Method
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {selectedSale.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items Table details placeholder */}
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-2.5 text-left">
                  Purchased Items
                </span>
                
                {/* Simulated list of items in the modal drawer */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-black text-slate-450 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800/40">
                    <span>Product Description</span>
                    <span>Subtotal</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-250">Checkout Cart Items</span>
                      <span className="text-[10px] text-slate-400 font-bold">{selectedSale.itemCount} items registered</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(selectedSale.subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing totals list */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-500 dark:text-rose-400">
                    <span>Discount Applied</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Tax (5%)</span>
                    <span>{formatCurrency(selectedSale.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-1">
                  <span>Amount Cash Received</span>
                  <span>{formatCurrency(selectedSale.paidAmount)}</span>
                </div>
                {selectedSale.changeAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Change Returned</span>
                    <span>{formatCurrency(selectedSale.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-8 pt-4 border-t border-slate-150 dark:border-slate-800/60">
                <div className={`p-1.5 rounded-lg ${selectedSale.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600'}`}>
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 text-left">
                  Invoice Status is registered as <strong className="text-slate-700 dark:text-slate-300">{selectedSale.status}</strong>. Authorized by {selectedSale.userId === 1 ? 'Administrator' : 'Cashier Register'}.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecentSalesTable;
