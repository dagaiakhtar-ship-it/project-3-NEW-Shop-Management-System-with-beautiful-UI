import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Calendar, User, FileText, DollarSign, Tag, Percent, ArrowDown, MessageCircle } from 'lucide-react';
import { type Sale } from '../../database/db';
import Button from '../ui/Button';
import { WhatsAppService } from '../../services/whatsappService';

interface SaleDetailsModalProps {
  sale: Sale | null;
  onClose: () => void;
  onPrintReceipt: (sale: Sale, items: any[], customer: any, format: 'thermal' | 'a4') => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  sale,
  onClose,
  onPrintReceipt,
}) => {
  if (!sale) return null;

  const items: any[] = (sale as any).items || [];
  const isSaleDeleted = sale.isDeleted === true;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Main container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="w-full max-w-2xl pos-modal-container rounded-2xl bg-white dark:bg-slate-950 p-6 text-left shadow-2xl border border-slate-150 dark:border-slate-800 z-10 max-h-[85vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-4 mb-4">
            <div>
              <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                Invoice Lookup Record
              </h2>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest font-black flex items-center gap-2">
                ID: {sale.invoiceNumber || sale.invoiceNo}
                {isSaleDeleted && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-500 uppercase tracking-widest border border-rose-100 dark:border-rose-900/20">
                    VOIDED / CANCELED
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/55 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 mb-5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black block mb-0.5">Date & Time</span>
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black block mb-0.5">Customer</span>
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1 font-semibold">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {sale.customerName || 'Walk-in Customer'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black block mb-0.5">Payment Term</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1 ${
                sale.saleType === 'Cash Sale' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600'
              }`}>
                {sale.saleType || 'Cash Sale'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black block mb-0.5">Payment Status</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1 ${
                sale.paymentStatus === 'Paid' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
              }`}>
                {sale.paymentStatus || 'Paid'}
              </span>
            </div>
          </div>

          {/* Items List Table */}
          <div className="mb-5 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full pos-table-text text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-850 pos-table-text">
                  <th className="py-3 px-4">Product details</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Line Disc</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10">
                    <td className="py-3 px-4">
                      <p className="font-black pos-normal-text text-slate-850 dark:text-slate-150">{item.productName}</p>
                      {item.barcode && <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">BC: {item.barcode}</p>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono pos-price">${item.sellingPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">
                      {item.discount > 0 ? `-$${(item.discount * item.quantity).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-850 dark:text-slate-100 pos-price">
                      ${(item.total ?? item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-150 dark:border-slate-850 pt-4">
            {/* Notes Section */}
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-black mb-1.5">Remarks / Annotations</span>
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-850 min-h-[80px] text-slate-550 dark:text-slate-400 italic leading-relaxed">
                {sale.notes || 'No notes added to this transaction record.'}
              </div>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-3 font-mono">
                Cashier Signature: <span className="font-bold text-slate-700 dark:text-slate-200">{sale.createdBy || 'Unknown'}</span>
              </p>
            </div>

            {/* Price Calculations */}
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-650 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 pos-price">${sale.subtotal.toFixed(2)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between items-center text-rose-500 font-extrabold">
                  <span>Order Discounts</span>
                  <span className="font-mono pos-price">-${sale.discount.toFixed(2)}</span>
                </div>
              )}

              {sale.tax > 0 && (
                <div className="flex justify-between items-center">
                  <span>Sales Taxes</span>
                  <span className="font-mono pos-price">+${sale.tax.toFixed(2)}</span>
                </div>
              )}

              {(sale.shipping! > 0 || sale.otherCharges! > 0) && (
                <div className="flex justify-between items-center">
                  <span>Shipping & Extra Charges</span>
                  <span className="font-mono pos-price">+${((sale.shipping ?? 0) + (sale.otherCharges ?? 0)).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2.5 mt-1">
                <span className="text-xs font-black text-slate-850 dark:text-slate-150 uppercase tracking-wider">Grand Total</span>
                <span className="text-base font-black text-indigo-650 dark:text-indigo-400 font-mono pos-grand-total">
                  ${(sale.grandTotal ?? sale.total).toFixed(2)}
                </span>
              </div>

              {sale.paidAmount !== (sale.grandTotal ?? sale.total) && (
                <div className="flex justify-between items-center text-[11px] border-t border-dotted border-slate-200 dark:border-slate-800 pt-2.5 mt-1.5">
                  <span>Paid Amount</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">${sale.paidAmount.toFixed(2)}</span>
                </div>
              )}

              {sale.remainingAmount! > 0 && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-rose-500 font-bold">Outstanding Customer Debt</span>
                  <span className="font-mono font-black text-rose-500">${sale.remainingAmount!.toFixed(2)}</span>
                </div>
              )}

              {sale.changeReturned! > 0 && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-emerald-500 font-bold">Change returned</span>
                  <span className="font-mono font-black text-emerald-500">${sale.changeReturned!.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Receipt Printing Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-150 dark:border-slate-850 mt-5 pt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close Invoice
            </Button>

            {!isSaleDeleted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => WhatsAppService.sendWhatsApp(sale, items)}
                  className="flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/20"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  Send WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintReceipt(sale, items, null, 'thermal')}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Thermal Receipt
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onPrintReceipt(sale, items, null, 'a4')}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  A4 Print Format
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SaleDetailsModal;
