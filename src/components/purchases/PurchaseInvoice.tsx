import React, { useState, useEffect, useRef } from 'react';
import { db, type Purchase, type PurchaseItem, type Supplier } from '../../database/db';
import { Printer, X, FileSignature } from 'lucide-react';
import { usePrint } from '../../hooks/usePrint';
import Button from '../ui/Button';

interface PurchaseInvoiceProps {
  purchaseId: number;
  onClose?: () => void;
}

export const PurchaseInvoice: React.FC<PurchaseInvoiceProps> = ({ purchaseId, onClose }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoiceData = async () => {
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
        console.error('Error loading invoice data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoiceData();
  }, [purchaseId]);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const { triggerPrint } = usePrint(invoiceRef, 'A4_Portrait');

  const handlePrint = () => {
    triggerPrint();
  };

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
        Invoice details not found.
      </div>
    );
  }

  const pDate = new Date(purchase.purchaseDate);
  const formattedDate = isNaN(pDate.getTime()) ? 'N/A' : pDate.toLocaleDateString();

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto bg-white text-slate-800 p-6 md:p-8 rounded-xl shadow-md border border-slate-100 text-left relative">
      {/* Print Control Ribbon (Hidden during printing) */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Purchase Invoice Receipt Preview
        </span>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 shadow-sm">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Layout Start */}
      <div ref={invoiceRef} className="printable-area flex flex-col gap-6 bg-white p-4">
        {/* Header: Shop Info & Invoice Metadata */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b-2 border-slate-200 pb-5">
          <div className="flex flex-col gap-1.5">
            {/* Shop logo prefix / title */}
            <h1 className="text-2xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
              <span className="bg-indigo-600 text-white rounded p-1 text-sm font-extrabold uppercase">SMS</span>
              SHOP MANAGEMENT SYSTEM
            </h1>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Main Commercial Wholesale Plaza, Sector G-11,<br />
              Islamabad Capital Territory, Pakistan.<br />
              <span className="font-bold">Phone:</span> +92 (51) 555-0199 | <span className="font-bold">Email:</span> billing@sms-retail.com
            </p>
          </div>

          <div className="flex flex-col md:items-end text-left md:text-right gap-1 text-xs">
            <span className="text-lg font-black text-slate-900 uppercase tracking-wider">
              Wholesale Purchase Invoice
            </span>
            <div className="font-semibold text-slate-600">
              <span className="text-slate-400 font-bold">PO Number:</span>{' '}
              <span className="font-mono text-indigo-700 font-extrabold">{purchase.purchaseNumber}</span>
            </div>
            {purchase.invoiceNumber && (
              <div className="font-semibold text-slate-600">
                <span className="text-slate-400 font-bold">Supplier Invoice:</span> {purchase.invoiceNumber}
              </div>
            )}
            <div className="font-semibold text-slate-600">
              <span className="text-slate-400 font-bold">Date:</span> {formattedDate}
            </div>
            <div className="font-semibold text-slate-600">
              <span className="text-slate-400 font-bold">Payment Method:</span> {purchase.paymentMethod}
            </div>
          </div>
        </div>

        {/* Supplier / Vendor Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="flex flex-col gap-1.5 text-xs">
            <h4 className="font-black text-indigo-900 uppercase tracking-wider text-[11px] mb-1">
              SUPPLIER INVOICING ACCOUNT
            </h4>
            {supplier ? (
              <div className="flex flex-col gap-1 text-slate-600 leading-relaxed font-semibold">
                <div className="text-slate-900 font-black text-sm">{supplier.companyName || supplier.name}</div>
                {supplier.contactPerson && <div><span className="text-slate-400">Attn:</span> {supplier.contactPerson}</div>}
                {supplier.address && <div>{supplier.address}, {supplier.city || ''}</div>}
                <div><span className="text-slate-400">Phone:</span> {supplier.phone}</div>
                {supplier.email && <div><span className="text-slate-400">Email:</span> {supplier.email}</div>}
              </div>
            ) : (
              <div className="text-slate-600 italic">Walk-In Supplier / Cash Transaction</div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-xs md:items-end md:text-right">
            <h4 className="font-black text-indigo-900 uppercase tracking-wider text-[11px] mb-1">
              SHIP TO / ACQUISITIONS
            </h4>
            <div className="flex flex-col gap-1 text-slate-600 leading-relaxed font-semibold">
              <div className="text-slate-900 font-black text-sm">Shop Storage Center #1</div>
              <div>Acquisitions Department</div>
              <div>Sector G-11 Warehouse Depot,</div>
              <div>Islamabad, Pakistan.</div>
              <div><span className="text-slate-400">Logistics Contact:</span> +92 (51) 555-0211</div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-2.5 text-left pl-4">Item Name / Barcode</th>
                <th className="p-2.5 text-center">Quantity</th>
                <th className="p-2.5 text-right">Wholesale Cost</th>
                <th className="p-2.5 text-right">Selling Price</th>
                <th className="p-2.5 text-right">Discount</th>
                <th className="p-2.5 text-right">Tax Charge</th>
                <th className="p-2.5 text-right pr-4">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const uCost = item.purchasePrice ?? item.cost ?? 0;
                const sPrice = item.sellingPrice ?? 0;
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-xs text-slate-700">
                    <td className="p-2.5 pl-4 text-left font-semibold">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{item.productName}</span>
                        {item.barcode && <span className="text-[9px] text-slate-400 font-mono">{item.barcode}</span>}
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono">${Number(uCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono text-indigo-600">${Number(sPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono text-red-500">-${Number(item.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono">${Number(item.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 pr-4 text-right font-mono font-black text-slate-950">
                      ${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Panel: Signature & Totals breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-4 pt-4 border-t border-slate-100">
          {/* Notes and Signature Area */}
          <div className="flex flex-col gap-6 text-xs text-slate-500 leading-relaxed font-semibold">
            {purchase.notes && (
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase">Notes / Instructions:</span>
                <p className="italic bg-slate-50 p-2 rounded border border-slate-100">{purchase.notes}</p>
              </div>
            )}
            
            {/* Signature Block */}
            <div className="flex gap-8 pt-6">
              <div className="flex-1 flex flex-col items-center gap-1 text-center">
                <div className="w-full border-b border-slate-300 h-10 flex items-end justify-center font-serif text-slate-400 italic text-sm select-none">
                  <FileSignature className="h-4 w-4 text-slate-300 mr-1" /> Authorized Officer
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">SMS Purchaser Signature</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 text-center">
                <div className="w-full border-b border-slate-300 h-10" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Supplier Acknowledgment</span>
              </div>
            </div>
          </div>

          {/* Calculations totals list */}
          <div className="flex flex-col gap-2.5 text-xs text-slate-600 border border-slate-200 bg-slate-50/50 p-4 rounded-lg">
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">${Number(purchase.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {(purchase.discount ?? 0) > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Applied Discount:</span>
                <span className="font-mono">-${Number(purchase.discount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {(purchase.tax ?? 0) > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Total Order Taxes:</span>
                <span className="font-mono">${Number(purchase.tax ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {((purchase.shipping || 0) + (purchase.otherCharges || 0)) > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Shipping & Extra Charges:</span>
                <span className="font-mono">${Number((purchase.shipping || 0) + (purchase.otherCharges || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-indigo-800">${Number(purchase.grandTotal ?? purchase.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-green-700 font-bold border-t border-dashed border-slate-200 pt-1">
              <span>Wholesale Amount Paid:</span>
              <span className="font-mono">${Number(purchase.paidAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-red-600 font-black pt-1 border-t-2 border-slate-200">
              <span>Outstanding Payable Liability:</span>
              <span className="font-mono text-sm">${Number(purchase.remainingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoice;
