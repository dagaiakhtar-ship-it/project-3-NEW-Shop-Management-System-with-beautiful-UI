import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Printer, FileDown, MessageSquare, Mail, RefreshCw, Check, 
  MapPin, Phone, User, Calendar, Clock, Receipt, QrCode, Barcode,
  Tag, ShieldAlert, CreditCard, Landmark, Wallet
} from 'lucide-react';
import { type Sale, type Customer } from '../../../database/db';
import { useShopSettings, useReceiptSettings } from '../../../hooks/useSettings';

// ----------------------------------------------------
// 1. RECEIPT HEADER
// ----------------------------------------------------
export const ReceiptHeader: React.FC<{
  sale: Sale;
  customerName: string;
}> = React.memo(({ sale, customerName }) => {
  const shop = useShopSettings();
  const receipt = useReceiptSettings();

  const saleDate = sale.saleDate || sale.createdAt || new Date();
  const dateObj = new Date(saleDate);

  const displayName = shop.shopName || 'VERTEX RETAIL LTD';
  const displayAddress = shop.address || '123 Enterprise Way, Tech City';
  const displayPhone = shop.phone || '+1 (555) 019-2831';
  const displayTaxNumber = shop.taxNumber || 'GSTIN: 27AAAAA1111A1Z1';

  return (
    <div className="text-center space-y-4 pb-4 border-b-2 border-dashed border-slate-200" id="receipt-header-element">
      {/* Brand logo container */}
      {receipt.showShopLogo && (
        <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md ring-2 ring-slate-100">
          {shop.shopLogo ? (
            <img 
              src={shop.shopLogo} 
              alt={displayName} 
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-[17px] font-black tracking-tight text-slate-900 uppercase leading-tight">{displayName}</h1>
        <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1 leading-normal max-w-[280px] mx-auto">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{displayAddress}</span>
        </p>
        <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1">
          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{displayPhone}</span>
        </p>
        {receipt.showTaxNumber && displayTaxNumber && (
          <p className="inline-block mt-0.5 px-2 py-0.5 text-[9.5px] font-bold tracking-wider text-slate-600 bg-slate-100 rounded uppercase">
            Tax ID: {displayTaxNumber}
          </p>
        )}
      </div>

      {/* Invoice identification info metadata */}
      <div className="bg-slate-50/70 rounded-xl p-3 text-left grid grid-cols-2 gap-y-2 gap-x-3 text-[11.5px] font-semibold text-slate-800 border border-slate-100">
        <div className="col-span-1">
          <span className="text-slate-400 block text-[9px] font-extrabold uppercase tracking-wider">Invoice No</span>
          <span className="font-mono font-bold text-indigo-600 truncate block">{sale.invoiceNumber || sale.invoiceNo || 'INV-000000'}</span>
        </div>
        <div className="col-span-1">
          <span className="text-slate-400 block text-[9px] font-extrabold uppercase tracking-wider">Cashier</span>
          <span className="font-bold text-slate-700 truncate block">{sale.createdBy || 'Cashier'}</span>
        </div>

        <div className="border-t border-slate-200/60 pt-2 col-span-2 flex justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateObj.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-2 col-span-2 grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-400 block text-[9px] font-extrabold uppercase tracking-wider">Customer</span>
            <span className="font-bold flex items-center gap-1 text-slate-700 truncate block">
              <User className="h-3 w-3 text-slate-400 shrink-0" />
              {customerName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] font-extrabold uppercase tracking-wider">Payment</span>
            <span className="font-bold text-slate-700 flex items-center gap-1 truncate block animate-pulse-subtle">
              {sale.paymentMethod === 'Cash' ? (
                <Wallet className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : sale.paymentMethod === 'Card' ? (
                <CreditCard className="h-3 w-3 text-indigo-500 shrink-0" />
              ) : (
                <Landmark className="h-3 w-3 text-amber-500 shrink-0" />
              )}
              {sale.paymentMethod || 'Cash'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ReceiptHeader.displayName = 'ReceiptHeader';

// ----------------------------------------------------
// 2. RECEIPT TABLE
// ----------------------------------------------------
interface ReceiptTableItem {
  productId: number;
  productName: string;
  quantity: number;
  sellingPrice: number;
  discount?: number;
  tax?: number;
}

export const ReceiptTable: React.FC<{
  items: ReceiptTableItem[];
}> = React.memo(({ items }) => {
  return (
    <div className="py-3.5 border-b-2 border-dashed border-slate-200" id="receipt-table-element">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            <th className="pb-1.5 text-left font-extrabold">Item Description</th>
            <th className="pb-1.5 text-center w-10 font-extrabold">Qty</th>
            <th className="pb-1.5 text-right w-16 font-extrabold">Price</th>
            <th className="pb-1.5 text-right w-20 font-extrabold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[11.5px] font-semibold text-slate-800">
          {items.map((item, idx) => {
            const rowTotal = item.quantity * item.sellingPrice;
            const hasDiscount = item.discount && item.discount > 0;
            return (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2 pr-1.5 text-left align-top">
                  <p className="font-bold text-slate-900 leading-snug break-words">{item.productName}</p>
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-extrabold text-red-500 mt-0.5">
                      <Tag className="h-2.5 w-2.5 shrink-0" />
                      <span>Disc: -${item.discount!.toFixed(2)}</span>
                    </span>
                  )}
                </td>
                <td className="py-2 text-center font-mono text-slate-500 align-top">{item.quantity}</td>
                <td className="py-2 text-right font-mono text-slate-500 align-top">${item.sellingPrice.toFixed(2)}</td>
                <td className="py-2 text-right font-mono text-slate-900 font-bold align-top">${rowTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

ReceiptTable.displayName = 'ReceiptTable';

// ----------------------------------------------------
// 3. RECEIPT SUMMARY
// ----------------------------------------------------
export const ReceiptSummary: React.FC<{
  sale: Sale;
  previousBalance?: number;
}> = React.memo(({ sale, previousBalance = 0 }) => {
  const saleSubtotal = sale.subtotal ?? 0;
  const saleDiscount = sale.discount ?? 0;
  const saleTax = sale.tax ?? 0;
  const saleGrandTotal = sale.grandTotal ?? sale.total ?? 0;
  const salePaidAmount = sale.paidAmount ?? 0;
  const saleRemainingAmount = sale.remainingAmount ?? 0;
  const calculatedShipping = sale.shipping ?? 0;
  const calculatedOther = sale.otherCharges ?? 0;

  const totalOutstanding = previousBalance + saleRemainingAmount;
  const changeReturned = sale.changeReturned ?? sale.changeAmount ?? 0;

  return (
    <div className="py-3.5 space-y-2 text-[11.5px] font-semibold text-slate-600 border-b-2 border-dashed border-slate-200" id="receipt-summary-element">
      <div className="flex justify-between">
        <span>Cart Subtotal</span>
        <span className="font-mono text-slate-900 font-bold">${saleSubtotal.toFixed(2)}</span>
      </div>

      {saleDiscount > 0 && (
        <div className="flex justify-between text-red-500">
          <span className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 shrink-0" />
            <span>Discounts & Promos</span>
          </span>
          <span className="font-mono font-bold">-${saleDiscount.toFixed(2)}</span>
        </div>
      )}

      {saleTax > 0 && (
        <div className="flex justify-between">
          <span>Computed Sales Tax</span>
          <span className="font-mono text-slate-900 font-bold">+${saleTax.toFixed(2)}</span>
        </div>
      )}

      {calculatedShipping > 0 && (
        <div className="flex justify-between">
          <span>Shipping Fee</span>
          <span className="font-mono text-slate-900 font-bold">+${calculatedShipping.toFixed(2)}</span>
        </div>
      )}

      {calculatedOther > 0 && (
        <div className="flex justify-between">
          <span>Other Charges</span>
          <span className="font-mono text-slate-900 font-bold">+${calculatedOther.toFixed(2)}</span>
        </div>
      )}

      {previousBalance > 0 && (
        <div className="flex justify-between border-t border-slate-100 pt-2 text-[11px] text-amber-600">
          <span>Previous Customer Balance</span>
          <span className="font-mono font-bold">+${previousBalance.toFixed(2)}</span>
        </div>
      )}

      {/* Premium Highlight Grand Total Box */}
      <div className="rounded-xl bg-slate-900 text-white p-3.5 flex justify-between items-center mt-3 shadow border border-slate-800">
        <span className="text-[10px] font-black tracking-wider text-slate-300">GRAND TOTAL DUE</span>
        <span className="font-mono text-[19px] font-black leading-none">${saleGrandTotal.toFixed(2)}</span>
      </div>

      {/* Tender & outstanding metrics */}
      <div className="space-y-1.5 pt-2 text-[11px]">
        <div className="flex justify-between text-slate-500">
          <span>Amount Paid / Tendered</span>
          <span className="font-mono text-slate-900 font-bold">${salePaidAmount.toFixed(2)}</span>
        </div>

        {saleRemainingAmount > 0 && (
          <div className="flex justify-between text-red-600 font-bold bg-red-50 px-2 py-1.5 rounded-lg border border-red-100/70">
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span>Booked Outstanding Credit</span>
            </span>
            <span className="font-mono font-black">+${saleRemainingAmount.toFixed(2)}</span>
          </div>
        )}

        {changeReturned > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100/70">
            <span>Change Returned</span>
            <span className="font-mono font-black">${changeReturned.toFixed(2)}</span>
          </div>
        )}

        {previousBalance > 0 && (
          <div className="flex justify-between border-t border-dotted border-slate-200 pt-2 text-amber-700 font-extrabold text-[12px]">
            <span>Total Outstanding Balance</span>
            <span className="font-mono">${totalOutstanding.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
});

ReceiptSummary.displayName = 'ReceiptSummary';

// ----------------------------------------------------
// 4. RECEIPT ACTIONS BAR BELOW MODAL
// ----------------------------------------------------
interface ReceiptActionsProps {
  onPrint: () => void;
  onPDF: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onNewSale: () => void;
  onClose: () => void;
  isActionLoading?: Record<string, boolean>;
}

export const ReceiptActions: React.FC<ReceiptActionsProps> = React.memo(({
  onPrint,
  onPDF,
  onWhatsApp,
  onEmail,
  onNewSale,
  onClose,
  isActionLoading = {} as Record<string, boolean>,
}) => {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full shrink-0 pt-2" id="receipt-actions-toolbar">
      {/* 1. Print Receipt */}
      <button
        type="button"
        onClick={onPrint}
        disabled={isActionLoading.print}
        className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-705 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        {isActionLoading.print ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4.5 w-4.5" />
        )}
        <span>Print</span>
      </button>

      {/* 2. Download PDF */}
      <button
        type="button"
        onClick={onPDF}
        disabled={isActionLoading.pdf}
        className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        {isActionLoading.pdf ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
        )}
        <span>PDF</span>
      </button>

      {/* 3. Share via WhatsApp */}
      <button
        type="button"
        onClick={onWhatsApp}
        disabled={isActionLoading.whatsapp}
        className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <MessageSquare className="h-4.5 w-4.5 text-green-600 dark:text-green-500" />
        <span>WhatsApp</span>
      </button>

      {/* 4. Email Receipt */}
      <button
        type="button"
        onClick={onEmail}
        className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <Mail className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
        <span>Email</span>
      </button>

      {/* 5. Start New Sale */}
      <button
        type="button"
        onClick={onNewSale}
        className="flex-1 h-11 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 col-span-2 sm:col-span-1"
      >
        <Check className="h-4.5 w-4.5" />
        <span>New Sale</span>
      </button>
    </div>
  );
});

ReceiptActions.displayName = 'ReceiptActions';

// ----------------------------------------------------
// MAIN RECEIPT PREVIEW DIALOG PORT
// ----------------------------------------------------
interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  customer: Customer | null;
  items: ReceiptTableItem[];
  onPrint: () => void;
  onPDF: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onNewSale: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  isOpen,
  onClose,
  sale,
  customer,
  items = [],
  onPrint,
  onPDF,
  onWhatsApp,
  onEmail,
  onNewSale,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const shop = useShopSettings();
  const receiptSettings = useReceiptSettings();

  if (!isOpen || !sale) return null;

  const previousBalance = customer ? (customer.currentBalance ?? customer.balance ?? 0) : 0;
  const customerName = customer ? customer.fullName : (sale.customerName || 'Walk-in Customer');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Shell Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative bg-slate-50 dark:bg-slate-900 w-full max-w-[460px] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 z-10 text-left max-h-[92vh]"
          id="receipt-preview-dialog"
        >
          {/* Top Panel Header */}
          <div className="flex justify-between items-center shrink-0 border-b border-slate-200/50 dark:border-slate-800 pb-3">
            <h2 className="text-[14px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Receipt Preview</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable Receipt Area */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-none py-1" style={{ maxHeight: '55vh' }}>
            {/* Realistic Thermal Receipt Paper Container */}
            <div 
              ref={receiptRef}
              className="bg-white text-slate-900 border border-slate-200 rounded-[16px] p-5 shadow-md relative overflow-hidden max-w-[350px] mx-auto w-full select-text"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {/* Receipt Header */}
              <ReceiptHeader sale={sale} customerName={customerName} />

              {/* Receipt Items list */}
              <ReceiptTable items={items} />

              {/* Receipt calculations summary */}
              <ReceiptSummary sale={sale} previousBalance={previousBalance} />

              {/* Footer Policy & barcode assets */}
              <div className="text-center pt-4 space-y-4">
                {receiptSettings.showThankYouMessage && (
                  <div className="text-[11px] font-extrabold text-slate-900 space-y-1">
                    <p className="uppercase tracking-wider">{shop.footerMessage || 'Thank You For Shopping With Us!'}</p>
                  </div>
                )}

                {receiptSettings.showFooterMessage && receiptSettings.customFooterText && (
                  <p className="text-[10px] font-semibold text-slate-500 leading-normal max-w-[260px] mx-auto">
                    {receiptSettings.customFooterText}
                  </p>
                )}

                {/* QR and Barcode Graphic Placeholders */}
                {(receiptSettings.showQrCode || receiptSettings.showBarcode) && (
                  <div className="flex flex-col items-center justify-center gap-3 pt-3 border-t border-slate-100">
                    {receiptSettings.showQrCode && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                          <QrCode className="h-12 w-12 text-slate-900" />
                        </div>
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Scan to Verify Invoice</span>
                      </div>
                    )}

                    {receiptSettings.showBarcode && (
                      <div className="flex flex-col items-center gap-0.5 w-full pt-1">
                        <Barcode className="h-7 w-44 text-slate-900" />
                        <span className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          *{sale.invoiceNumber || sale.invoiceNo || 'INV000000'}*
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Powered by */}
                <div className="text-[8px] font-bold text-slate-350 uppercase tracking-widest pt-2">
                  Powered by Vertex POS
                </div>
              </div>
            </div>
          </div>

          {/* Action Tools Bar */}
          <ReceiptActions
            onPrint={onPrint}
            onPDF={onPDF}
            onWhatsApp={onWhatsApp}
            onEmail={onEmail}
            onNewSale={onNewSale}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(ReceiptPreview);
