import React, { useState, useEffect } from 'react';
import { db, type Purchase, type PurchaseItem, type Supplier } from '../../database/db';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Calendar, DollarSign, FileText, User, ShoppingBag, Package, FileSignature } from 'lucide-react';
import { usePDF } from '../../hooks/usePDF';
import { PDFButton, PDFPreviewDialog } from '../common/PDFComponents';

interface PurchaseDetailsProps {
  purchaseId: number;
}

export const PurchaseDetails: React.FC<PurchaseDetailsProps> = ({ purchaseId }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isGenerating, previewUrl, closePreview, generatePurchase } = usePDF();

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const p = await db.purchases.get(purchaseId);
        if (p) {
          setPurchase(p);
          const pit = await db.purchaseItems.filter((item) => item.purchaseId === purchaseId).toArray();
          setItems(pit);
          if (p.supplierId) {
            const s = await db.suppliers.get(p.supplierId);
            setSupplier(s || null);
          }
        }
      } catch (err) {
        console.error('Error loading purchase details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [purchaseId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-150 border-t-indigo-600" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="py-6 text-center text-sm font-semibold text-slate-450">
        Purchase Order details not found.
      </div>
    );
  }

  const getPaymentStatusBadge = (status: 'Paid' | 'Partial' | 'Unpaid') => {
    if (status === 'Paid') return <Badge variant="success">Paid</Badge>;
    if (status === 'Partial') return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="danger">Unpaid</Badge>;
  };

  const purchaseDate = new Date(purchase.purchaseDate);
  const formattedDate = isNaN(purchaseDate.getTime())
    ? 'N/A'
    : purchaseDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-450">
            Purchase Order Information Sheet
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {purchase.purchaseNumber}
            </h2>
            {getPaymentStatusBadge(purchase.paymentStatus)}
            {purchase.status === 'Archived' && (
              <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold px-1.5 py-0.5 rounded border border-red-200">
                Soft Deleted
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end text-right text-xs gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">{formattedDate}</span>
          </div>
          {purchase.invoiceNumber && (
            <span className="text-slate-450 font-bold">
              Invoice Reference No: {purchase.invoiceNumber}
            </span>
          )}
          <PDFButton
            onClick={async (mode) => {
              const purchaseWithSupplier = {
                ...purchase,
                supplier: supplier ? {
                  companyName: supplier.companyName,
                  contactName: supplier.contactPerson,
                  phone: supplier.phone,
                  supplierCode: supplier.supplierCode,
                } : null,
              };
              await generatePurchase(purchaseWithSupplier, items, mode);
            }}
            label="Download Purchase PDF"
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Main Grid: Purchase & Supplier info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Supplier details card */}
        <Card className="p-4 border border-slate-100 dark:border-slate-850">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <User className="h-4 w-4 text-indigo-500" />
            Supplier Account Details
          </h3>
          {supplier ? (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-450">Company Name:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {supplier.companyName}
                </span>
              </div>
              {supplier.contactPerson && (
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450">Contact Person:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {supplier.contactPerson}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold text-slate-450">Phone Number:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {supplier.phone}
                </span>
              </div>
              {supplier.email && (
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450">Email Address:</span>
                  <span className="text-slate-700 dark:text-slate-300">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-50 mt-1">
                  <span className="font-bold text-slate-450 text-[10px] uppercase">Shipping Address</span>
                  <span className="text-slate-600 dark:text-slate-400 italic">
                    {supplier.address}
                    {supplier.city ? `, ${supplier.city}` : ''}
                    {supplier.country ? `, ${supplier.country}` : ''}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center italic text-slate-400 text-xs">
              Walk-In Vendor / Cash Supplier
            </div>
          )}
        </Card>

        {/* Payment info card */}
        <Card className="p-4 border border-slate-100 dark:border-slate-850">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Billing & Method Info
          </h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-450">Payment Method:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {purchase.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-450">Bill Status:</span>
              <span className="font-extrabold">{getPaymentStatusBadge(purchase.paymentStatus)}</span>
            </div>
            {purchase.createdBy && (
              <div className="flex justify-between">
                <span className="font-bold text-slate-450">Created By User:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {purchase.createdBy}
                </span>
              </div>
            )}
            {purchase.notes && (
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-50 mt-1">
                <span className="font-bold text-slate-450 text-[10px] uppercase">Purchaser Notes</span>
                <span className="text-slate-600 dark:text-slate-400 italic font-medium p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100">
                  {purchase.notes}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Purchased Items Table */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
          Acquired Goods Ledger
        </h3>

        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-3 text-left">Product Name</th>
                <th className="p-3 text-center">Qty Purchased</th>
                <th className="p-3 text-right">Unit Wholesale Cost</th>
                <th className="p-3 text-right">Selling Price Set</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Item Tax</th>
                <th className="p-3 text-right">Final Line Net</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const uCost = item.purchasePrice ?? item.cost ?? 0;
                const sPrice = item.sellingPrice ?? 0;
                return (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20 text-xs text-slate-700 dark:text-slate-300">
                    <td className="p-3 font-semibold text-left">
                      <div className="flex flex-col">
                        <span>{item.productName}</span>
                        {item.barcode && (
                          <span className="text-[9px] text-slate-400 font-mono">{item.barcode}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">${Number(uCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-indigo-500">${Number(sPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-red-500">-${Number(item.discount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono">${Number(item.tax ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                      ${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary & Stock Changes side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
        {/* Stock changes details */}
        <Card className="p-4 border border-slate-100 dark:border-slate-850 bg-amber-50/10 dark:bg-amber-950/5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Package className="h-4 w-4 text-amber-500" />
            Inventory Stock Increments & Ledger
          </h3>
          <div className="flex flex-col gap-2.5 text-xs text-left">
            <p className="text-[11px] text-slate-500 italic mb-1">
              Saving this order successfully loaded quantities and triggered automated stock card updates:
            </p>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {item.productName}
                </span>
                <span className="font-mono font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded text-[11px]">
                  +{item.quantity} units stock
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Ledger Breakdown */}
        <Card className="p-4 border border-slate-100 dark:border-slate-850">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <FileText className="h-4 w-4 text-slate-450" />
            Financial Breakdown Summary
          </h3>
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Subtotal (Pre-Adjustments):</span>
              <span className="font-mono font-bold">${Number(purchase.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(purchase.discount ?? 0) > 0 && (
              <div className="flex justify-between text-red-500">
                <span className="font-semibold">Applied Discount:</span>
                <span className="font-mono font-bold">-${Number(purchase.discount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {(purchase.tax ?? 0) > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Purchase Order Taxes:</span>
                <span className="font-mono font-bold">${Number(purchase.tax ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {((purchase.shipping ?? 0) > 0 || (purchase.otherCharges ?? 0) > 0) && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Shipping & Charges:</span>
                <span className="font-mono font-bold">${Number((purchase.shipping || 0) + (purchase.otherCharges || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">${Number(purchase.grandTotal ?? purchase.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-green-600 font-bold">
              <span>Amount Paid:</span>
              <span className="font-mono">${Number(purchase.paidAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-dashed border-slate-100">
              <span>Remaining accounts payable:</span>
              <span className="font-mono text-sm">${Number(purchase.remainingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </Card>
      </div>
      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={`Purchase Order ${purchase.purchaseNumber}`}
      />
    </div>
  );
};

export default PurchaseDetails;
