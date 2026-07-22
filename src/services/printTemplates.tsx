import React from 'react';
import { CompanyBranding } from '../constants/companyBranding';
import { formatCurrency, formatDateTime } from '../utils/printUtils';

// ==========================================
// REUSABLE SUB-COMPONENTS
// ==========================================

interface BaseTemplateProps {
  branding: CompanyBranding;
  printedBy?: string;
  paperSize?: string;
}

export const CompanyHeader: React.FC<BaseTemplateProps & { title: string; subtitle?: string; metadata?: { label: string; value: string }[] }> = ({
  branding,
  title,
  subtitle,
  metadata = [],
}) => {
  return (
    <div className="border-b border-slate-300 pb-4 mb-6">
      <div className="flex justify-between items-start">
        {/* Left: Shop Info */}
        <div className="flex-1 flex gap-4 items-start">
          {branding.shopLogo && (
            <img 
              src={branding.shopLogo} 
              alt="Shop Logo" 
              className="h-16 w-16 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0" 
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">{branding.shopName}</h1>
            <p className="text-xs text-slate-600 font-medium mt-1">{branding.businessType}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>{branding.address}, {branding.city}</p>
              <p className="flex gap-3">
                <span><strong>Phone:</strong> {branding.phone}</span>
                {branding.whatsapp && <span><strong>WhatsApp:</strong> {branding.whatsapp}</span>}
              </p>
              <p className="flex gap-3">
                <span><strong>Email:</strong> {branding.email}</span>
                {branding.website && <span><strong>Website:</strong> {branding.website}</span>}
              </p>
              <p className="flex gap-3 font-mono text-[10px] text-slate-400">
                {branding.taxNumber && <span><strong>TAX/VAT:</strong> {branding.taxNumber}</span>}
                {branding.ntn && <span><strong>NTN:</strong> {branding.ntn}</span>}
                {branding.strn && <span><strong>STRN:</strong> {branding.strn}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Document Info */}
        <div className="text-right ml-6 flex flex-col items-end">
          <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-wide uppercase">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
          </div>

          {metadata.length > 0 && (
            <div className="mt-3 text-xs space-y-1 text-slate-600">
              {metadata.map((item, idx) => (
                <p key={idx} className="flex gap-2 justify-end">
                  <span className="text-slate-400 font-medium">{item.label}:</span>
                  <span className="font-bold text-slate-800 font-mono">{item.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CompanyFooter: React.FC<BaseTemplateProps> = ({ branding, printedBy }) => {
  const { dateStr, timeStr } = formatDateTime(new Date());

  return (
    <div className="mt-12 pt-4 border-t border-slate-200 text-[10px] text-slate-400 space-y-1 page-break-inside-avoid">
      <div className="flex justify-between font-mono">
        <div>
          <span>Printed By: <strong className="text-slate-600">{printedBy || 'System'}</strong></span>
          <span className="mx-2">|</span>
          <span>Date: <strong>{dateStr}</strong></span>
          <span className="mx-2">|</span>
          <span>Time: <strong>{timeStr}</strong></span>
        </div>
        <div className="printable-footer-pages text-right">
          <span>Page 1 of 1</span>
        </div>
      </div>
      <p className="text-center italic mt-2 text-slate-400 text-[9px]">
        Thank you for your business. Certified secured offline transaction backup ledger. Powered by {branding.shopName}.
      </p>
    </div>
  );
};

export const SignatureArea: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-12 mt-12 pt-8 page-break-inside-avoid">
      <div className="text-center">
        <div className="w-48 mx-auto border-b border-slate-400 h-10"></div>
        <p className="text-[11px] font-bold text-slate-600 mt-2">Authorized Signature</p>
        <p className="text-[9px] text-slate-400">For Shop/Proprietor</p>
      </div>
      <div className="text-center">
        <div className="w-48 mx-auto border-b border-slate-400 h-10"></div>
        <p className="text-[11px] font-bold text-slate-600 mt-2">Receiver / Client Signature</p>
        <p className="text-[9px] text-slate-400">Acknowledgment of Receipt</p>
      </div>
    </div>
  );
};

// ==========================================
// 1. INVOICE TEMPLATE (A4, A5, Letter, Legal)
// ==========================================

interface InvoiceTemplateProps extends BaseTemplateProps {
  invoice: {
    invoiceNo: string;
    invoiceDate: string | Date;
    dueDate?: string | Date;
    paymentStatus: string;
    paymentMethod: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    taxRate?: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    notes?: string;
    customerCopyType?: 'Original' | 'Customer Copy' | 'Shop Copy' | 'Duplicate';
    customer?: {
      fullName: string;
      phone: string;
      email?: string;
      address?: string;
      customerCode?: string;
    };
  };
  items: Array<{
    id?: number;
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    subtotal: number;
    discount?: number;
  }>;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ branding, invoice, items, printedBy }) => {
  const meta = [
    { label: 'Invoice No', value: invoice.invoiceNo },
    { label: 'Date', value: formatDateTime(invoice.invoiceDate).dateStr },
    { label: 'Payment Method', value: invoice.paymentMethod },
    { label: 'Status', value: invoice.paymentStatus.toUpperCase() },
  ];

  if (invoice.customerCopyType) {
    meta.push({ label: 'Copy Type', value: invoice.customerCopyType });
  }

  return (
    <div className="printable-area bg-white text-slate-800">
      <CompanyHeader
        branding={branding}
        title="Sales Invoice"
        subtitle={invoice.customerCopyType || 'Tax Invoice'}
        metadata={meta}
      />

      {/* Bill To & Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs border-b border-slate-150 pb-4">
        <div>
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Billed To:</h3>
          <p className="text-sm font-black text-slate-800">{invoice.customer?.fullName || 'Walk-in Customer'}</p>
          <div className="mt-1 text-slate-500 space-y-0.5">
            {invoice.customer?.customerCode && <p><strong>Customer ID:</strong> {invoice.customer.customerCode}</p>}
            {invoice.customer?.phone && <p><strong>Phone:</strong> {invoice.customer.phone}</p>}
            {invoice.customer?.email && <p><strong>Email:</strong> {invoice.customer.email}</p>}
            {invoice.customer?.address && <p><strong>Address:</strong> {invoice.customer.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 font-mono">Invoice Summary:</h3>
          <p className="text-sm font-mono font-bold text-indigo-600">Total: {formatCurrency(invoice.grandTotal)}</p>
          {invoice.amountPaid !== invoice.grandTotal && (
            <div className="mt-1 text-slate-500 space-y-0.5">
              <p><strong>Paid Amount:</strong> {formatCurrency(invoice.amountPaid)}</p>
              <p><strong>Balance Due:</strong> <span className={invoice.balanceDue > 0 ? 'text-red-500 font-bold' : ''}>{formatCurrency(invoice.balanceDue)}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 text-xs text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-700">
            <th className="py-2 px-3 font-semibold text-center w-8">#</th>
            <th className="py-2 px-3 font-semibold">Item Description / SKU</th>
            <th className="py-2 px-3 font-semibold text-center w-20">Qty</th>
            <th className="py-2 px-3 font-semibold text-right w-28">Unit Price</th>
            <th className="py-2 px-3 font-semibold text-right w-28">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-slate-50/50">
              <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">{index + 1}</td>
              <td className="py-2.5 px-3">
                <span className="font-bold text-slate-800">{item.name}</span>
                {item.sku && <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
              </td>
              <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
              <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.price)}</td>
              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Breakdown */}
      <div className="flex justify-between items-start mb-6 page-break-inside-avoid">
        {/* Notes */}
        <div className="w-1/2 pr-6">
          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
              <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">Notes / Terms:</h4>
              <p className="italic leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="w-5/12 text-xs space-y-1.5 font-semibold text-slate-600">
          <div className="flex justify-between font-medium">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount && invoice.discount > 0 ? (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount:</span>
              <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
            </div>
          ) : null}
          {invoice.tax && invoice.tax > 0 ? (
            <div className="flex justify-between font-medium">
              <span>Sales Tax ({invoice.taxRate || 0}%):</span>
              <span className="font-mono">+{formatCurrency(invoice.tax)}</span>
            </div>
          ) : null}
          <div className="border-t border-slate-200 my-1"></div>
          <div className="flex justify-between text-base font-black text-slate-800">
            <span>Grand Total:</span>
            <span className="font-mono text-indigo-600">{formatCurrency(invoice.grandTotal)}</span>
          </div>
          {invoice.amountPaid !== invoice.grandTotal && (
            <>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Balance Due:</span>
                <span className={`font-mono ${invoice.balanceDue > 0 ? 'text-red-500 font-bold' : ''}`}>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <SignatureArea />
      <CompanyFooter branding={branding} printedBy={printedBy} />
    </div>
  );
};

// ==========================================
// 2. THERMAL RECEIPT TEMPLATE (80mm & 58mm)
// ==========================================

interface ReceiptTemplateProps extends BaseTemplateProps {
  sale: {
    invoiceNo: string;
    invoiceDate: string | Date;
    paymentMethod: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  width: '80mm' | '58mm';
  cashierName?: string;
  isDuplicate?: boolean;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  branding,
  sale,
  items,
  width,
  cashierName = 'Cashier',
  isDuplicate = false,
}) => {
  const isSmall = width === '58mm';
  const { dateStr, timeStr } = formatDateTime(sale.invoiceDate);

  return (
    <div className={`thermal-receipt-container mx-auto bg-white text-black leading-tight ${isSmall ? 'text-[9px] w-[54mm]' : 'text-xs w-[76mm]'}`}>
      {/* Header */}
      <div className="text-center font-bold uppercase space-y-1 flex flex-col items-center">
        {branding.shopLogo && (
          <img 
            src={branding.shopLogo} 
            alt="Shop Logo" 
            className="h-10 w-10 object-contain rounded-lg border border-slate-150 mb-1 shrink-0" 
            referrerPolicy="no-referrer"
          />
        )}
        <h1 className={`${isSmall ? 'text-xs' : 'text-base'} font-black text-slate-900 tracking-tight leading-none`}>{branding.shopName}</h1>
        <p className="text-[10px] text-slate-600 font-medium leading-none mt-1">{branding.businessType}</p>
        <p className="text-[9px] font-normal normal-case leading-snug mt-0.5">{branding.address}</p>
        <p className="text-[9px] font-normal normal-case">Phone: {branding.phone}</p>
        {branding.taxNumber && <p className="text-[8px] font-mono">Tax ID: {branding.taxNumber}</p>}
        {isDuplicate && <p className="text-[10px] bg-slate-100 py-0.5 text-center my-1 tracking-wider border border-slate-300 w-full">** DUPLICATE COPY **</p>}
      </div>

      <div className="thermal-divider" />

      {/* Meta */}
      <div className="font-mono text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span>TID: {sale.invoiceNo}</span>
          <span>Pay: {sale.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {dateStr}</span>
          <span>Time: {timeStr}</span>
        </div>
        <div>Cashier: {cashierName}</div>
      </div>

      <div className="thermal-divider" />

      {/* Items List */}
      <div className="space-y-1 font-mono">
        <div className="flex font-bold border-b border-slate-300 pb-0.5 text-[10px]">
          <span className="flex-1">Item Description</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-16 text-right">Total</span>
        </div>
        {items.map((item, index) => (
          <div key={index} className="space-y-0.5">
            <div className="flex justify-between">
              <span className="truncate flex-1 font-semibold">{item.name}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 pl-2">
              <span>{item.quantity} x {formatCurrency(item.price)}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="thermal-divider" />

      {/* Summary */}
      <div className="font-mono space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount && sale.discount > 0 ? (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        ) : null}
        {sale.tax && sale.tax > 0 ? (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>+{formatCurrency(sale.tax)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.grandTotal)}</span>
        </div>
        {sale.amountPaid !== sale.grandTotal && (
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>{formatCurrency(sale.amountPaid)}</span>
          </div>
        )}
        {sale.amountPaid > sale.grandTotal && (
          <div className="flex justify-between">
            <span>Change:</span>
            <span>{formatCurrency(sale.amountPaid - sale.grandTotal)}</span>
          </div>
        )}
        {sale.balanceDue > 0 ? (
          <div className="flex justify-between font-bold text-red-600">
            <span>DUE BALANCE:</span>
            <span>{formatCurrency(sale.balanceDue)}</span>
          </div>
        ) : null}
      </div>

      <div className="thermal-divider" />

      {/* Barcode & QR code mock (SVGs that look completely professional) */}
      <div className="flex flex-col items-center justify-center my-3 space-y-2">
        {/* Simple crisp vector barcode */}
        <div className="flex flex-col items-center">
          <svg className="w-32 h-8" viewBox="0 0 120 30">
            <rect width="120" height="30" fill="white" />
            <g fill="black">
              <rect x="5" y="2" width="2" height="23" />
              <rect x="8" y="2" width="1" height="23" />
              <rect x="11" y="2" width="3" height="23" />
              <rect x="16" y="2" width="1" height="23" />
              <rect x="18" y="2" width="2" height="23" />
              <rect x="22" y="2" width="4" height="23" />
              <rect x="28" y="2" width="1" height="23" />
              <rect x="31" y="2" width="2" height="23" />
              <rect x="34" y="2" width="1" height="23" />
              <rect x="38" y="2" width="3" height="23" />
              <rect x="42" y="2" width="1" height="23" />
              <rect x="45" y="2" width="2" height="23" />
              <rect x="49" y="2" width="4" height="23" />
              <rect x="55" y="2" width="1" height="23" />
              <rect x="58" y="2" width="3" height="23" />
              <rect x="62" y="2" width="2" height="23" />
              <rect x="65" y="2" width="1" height="23" />
              <rect x="68" y="2" width="4" height="23" />
              <rect x="74" y="2" width="2" height="23" />
              <rect x="78" y="2" width="1" height="23" />
              <rect x="81" y="2" width="3" height="23" />
              <rect x="86" y="2" width="1" height="23" />
              <rect x="89" y="2" width="2" height="23" />
              <rect x="93" y="2" width="4" height="23" />
              <rect x="99" y="2" width="1" height="23" />
              <rect x="102" y="2" width="3" height="23" />
              <rect x="106" y="2" width="2" height="23" />
              <rect x="109" y="2" width="1" height="23" />
              <rect x="112" y="2" width="3" height="23" />
            </g>
            <text x="60" y="29" fontSize="6" fontFamily="monospace" textAnchor="middle" fill="black">
              {sale.invoiceNo}
            </text>
          </svg>
        </div>

        {/* QR Placeholder code visual */}
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12" viewBox="0 0 25 25">
            <rect width="25" height="25" fill="white" />
            <g fill="black">
              {/* Outer frame top left */}
              <rect x="1" y="1" width="7" height="7" />
              <rect x="2" y="2" width="5" height="5" fill="white" />
              <rect x="3" y="3" width="3" height="3" />
              {/* Outer frame top right */}
              <rect x="17" y="1" width="7" height="7" />
              <rect x="18" y="2" width="5" height="5" fill="white" />
              <rect x="19" y="3" width="3" height="3" />
              {/* Outer frame bottom left */}
              <rect x="1" y="17" width="7" height="7" />
              <rect x="2" y="18" width="5" height="5" fill="white" />
              <rect x="3" y="19" width="3" height="3" />
              {/* Random QR code pixels mock */}
              <rect x="10" y="2" width="2" height="3" />
              <rect x="13" y="1" width="3" height="1" />
              <rect x="10" y="6" width="3" height="2" />
              <rect x="15" y="5" width="1" height="4" />
              <rect x="11" y="10" width="5" height="1" />
              <rect x="1" y="10" width="3" height="2" />
              <rect x="5" y="13" width="2" height="3" />
              <rect x="9" y="14" width="4" height="2" />
              <rect x="15" y="12" width="3" height="4" />
              <rect x="21" y="10" width="3" height="3" />
              <rect x="19" y="15" width="5" height="1" />
              <rect x="10" y="18" width="2" height="5" />
              <rect x="14" y="19" width="3" height="2" />
              <rect x="18" y="18" width="4" height="3" />
              <rect x="23" y="22" width="1" height="2" />
              <rect x="13" y="23" width="5" height="1" />
              <rect x="2" y="15" width="4" height="1" />
            </g>
          </svg>
          <span className="text-[7px] text-slate-400 font-mono mt-0.5">Scan to Verify</span>
        </div>
      </div>

      <div className="text-center italic mt-2 text-[9px] text-slate-500 font-sans space-y-0.5">
        <p>Thank You For Your Business!</p>
        <p className="not-italic font-bold font-mono text-[8px] text-slate-400">Software powered by ShopCraft POS</p>
      </div>
    </div>
  );
};

// ==========================================
// 3. LEDGER & STATEMENT TEMPLATE
// ==========================================

interface StatementTemplateProps extends BaseTemplateProps {
  title: string;
  clientName: string;
  clientType: 'Customer' | 'Supplier';
  clientCode?: string;
  clientPhone?: string;
  meta: {
    openingBalance: number;
    closingBalance: number;
    totalDebits?: number;
    totalCredits?: number;
    outstanding: number;
  };
  transactions: Array<{
    date: string | Date;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }>;
}

export const StatementTemplate: React.FC<StatementTemplateProps> = ({
  branding,
  title,
  clientName,
  clientType,
  clientCode,
  clientPhone,
  meta,
  transactions,
  printedBy,
}) => {
  return (
    <div className="printable-area bg-white text-slate-800">
      <CompanyHeader
        branding={branding}
        title={title}
        subtitle="Account Summary Ledger"
        metadata={[
          { label: 'Printed Date', value: formatDateTime(new Date()).dateStr },
          { label: 'Account Holder', value: clientName },
          { label: 'Type', value: clientType },
        ]}
      />

      {/* Account Info Bar */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs border-b border-slate-150 pb-4">
        <div>
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Account Details:</h3>
          <p className="text-sm font-black text-slate-800">{clientName}</p>
          <div className="mt-1 text-slate-500 space-y-0.5">
            {clientCode && <p><strong>Account Ref:</strong> {clientCode}</p>}
            {clientPhone && <p><strong>Phone:</strong> {clientPhone}</p>}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Opening Bal</span>
            <span className="font-mono text-xs font-bold text-slate-700">{formatCurrency(meta.openingBalance)}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Net</span>
            <span className="font-mono text-xs font-bold text-indigo-600">
              {formatCurrency((meta.totalDebits || 0) - (meta.totalCredits || 0))}
            </span>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Outstanding</span>
            <span className={`font-mono text-xs font-black ${meta.outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatCurrency(meta.outstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <table className="w-full mb-6 text-xs text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-700">
            <th className="py-2 px-3 font-semibold w-24">Date</th>
            <th className="py-2 px-3 font-semibold w-24">Ref / Code</th>
            <th className="py-2 px-3 font-semibold">Description</th>
            <th className="py-2 px-3 font-semibold text-right w-24">Debit (+)</th>
            <th className="py-2 px-3 font-semibold text-right w-24">Credit (-)</th>
            <th className="py-2 px-3 font-semibold text-right w-28">Running Bal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {/* Starting Balance Row */}
          <tr className="bg-slate-50/40 text-[11px]">
            <td className="py-2 px-3 text-slate-400 font-mono">---</td>
            <td className="py-2 px-3 font-mono text-slate-400">OPEN-BAL</td>
            <td className="py-2 px-3 text-slate-500 italic">Account starting opening ledger balance</td>
            <td className="py-2 px-3 text-right font-mono">---</td>
            <td className="py-2 px-3 text-right font-mono">---</td>
            <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">{formatCurrency(meta.openingBalance)}</td>
          </tr>

          {transactions.map((tx, index) => (
            <tr key={index} className="hover:bg-slate-50/50">
              <td className="py-2 px-3 font-mono text-slate-500">{formatDateTime(tx.date).dateStr}</td>
              <td className="py-2 px-3 font-mono font-bold text-indigo-600">{tx.reference}</td>
              <td className="py-2 px-3 text-slate-600">{tx.description}</td>
              <td className="py-2 px-3 text-right font-mono text-red-500">
                {tx.debit > 0 ? `+${formatCurrency(tx.debit)}` : '---'}
              </td>
              <td className="py-2 px-3 text-right font-mono text-emerald-500">
                {tx.credit > 0 ? `-${formatCurrency(tx.credit)}` : '---'}
              </td>
              <td className={`py-2 px-3 text-right font-mono font-bold ${tx.runningBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {formatCurrency(tx.runningBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="flex justify-end my-6 page-break-inside-avoid">
        <div className="w-5/12 text-xs space-y-1.5 border border-slate-200 p-4 rounded-lg bg-slate-50">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Opening Balance:</span>
            <span className="font-mono text-slate-700">{formatCurrency(meta.openingBalance)}</span>
          </div>
          {meta.totalDebits !== undefined && (
            <div className="flex justify-between text-red-500">
              <span>Total Charges (+):</span>
              <span className="font-mono">+{formatCurrency(meta.totalDebits)}</span>
            </div>
          )}
          {meta.totalCredits !== undefined && (
            <div className="flex justify-between text-emerald-600">
              <span>Total Payments (-):</span>
              <span className="font-mono">-{formatCurrency(meta.totalCredits)}</span>
            </div>
          )}
          <div className="border-t border-slate-300 my-1"></div>
          <div className="flex justify-between font-black text-sm text-slate-800">
            <span>Outstanding Balance:</span>
            <span className={`font-mono ${meta.outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatCurrency(meta.outstanding)}
            </span>
          </div>
        </div>
      </div>

      <SignatureArea />
      <CompanyFooter branding={branding} printedBy={printedBy} />
    </div>
  );
};

// ==========================================
// 4. GENERAL REPORT & SUMMARY TEMPLATE
// ==========================================

interface ReportTemplateProps extends BaseTemplateProps {
  title: string;
  summaryCards?: Array<{ label: string; value: string; isHighlighted?: boolean }>;
  headers: string[];
  rows: any[][];
  filters?: Array<{ label: string; value: string }>;
  totalsRow?: string[]; // Column totals to render at table bottom
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({
  branding,
  title,
  summaryCards = [],
  headers,
  rows,
  filters = [],
  totalsRow,
  printedBy,
}) => {
  return (
    <div className="printable-area bg-white text-slate-800">
      <CompanyHeader
        branding={branding}
        title={title}
        subtitle="System Analytical Export Report"
        metadata={[
          { label: 'Date Printed', value: formatDateTime(new Date()).dateStr },
          { label: 'Secure Mode', value: 'Offline Decrypted' },
        ]}
      />

      {/* Active Filter Badge Bar */}
      {filters.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block mb-1.5">
            Active Filter Constraints:
          </span>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <span key={index} className="px-2.5 py-1 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-600">
                <strong>{filter.label}:</strong> {filter.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Scorecards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                card.isHighlighted
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              } text-center`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{card.label}</span>
              <span className="font-mono text-sm font-black tracking-tight">{card.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Report Table */}
      <table className="w-full mb-6 text-xs text-left">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            {headers.map((h, i) => (
              <th key={i} className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/40">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 text-slate-700 font-medium">
                  {cell === null || cell === undefined ? '---' : cell}
                </td>
              ))}
            </tr>
          ))}

          {/* Totals Row */}
          {totalsRow && (
            <tr className="bg-slate-50 font-black text-slate-800 border-t-2 border-slate-300">
              {totalsRow.map((cell, idx) => (
                <td key={idx} className="py-2.5 px-3 font-extrabold text-[11px] font-mono">
                  {cell}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>

      <CompanyFooter branding={branding} printedBy={printedBy} />
    </div>
  );
};

// ==========================================
// 5. BARCODE LABELS GRID TEMPLATE
// ==========================================

interface BarcodeLabelsTemplateProps extends BaseTemplateProps {
  productsList: Array<{
    sku: string;
    name: string;
    barcode?: string;
    sellingPrice?: number;
    price?: number;
  }>;
  quantityPerProduct: number;
}

export const BarcodeLabelsTemplate: React.FC<BarcodeLabelsTemplateProps> = ({
  productsList,
  quantityPerProduct,
}) => {
  // Multiply the lists to match requested printed barcode count
  const allLabels: Array<typeof productsList[0]> = [];
  productsList.forEach(p => {
    for (let i = 0; i < quantityPerProduct; i++) {
      allLabels.push(p);
    }
  });

  return (
    <div className="printable-area bg-white p-2">
      <div className="grid grid-cols-4 gap-4">
        {allLabels.map((prod, idx) => {
          const skuCode = prod.sku || prod.barcode || '000000';
          const price = prod.sellingPrice ?? prod.price ?? 0;
          return (
            <div
              key={idx}
              className="border border-dashed border-slate-300 p-3 rounded flex flex-col items-center justify-center text-center bg-white h-[40mm] w-[50mm] mx-auto page-break-inside-avoid"
            >
              <span className="text-[10px] font-black tracking-tight text-slate-800 truncate w-full uppercase">
                {prod.name}
              </span>
              <span className="text-xs font-black text-indigo-600 font-mono mt-1">
                {formatCurrency(price)}
              </span>

              {/* Professional Vector Barcode inside each price tag */}
              <div className="my-2">
                <svg className="w-32 h-8" viewBox="0 0 100 24">
                  <g fill="black">
                    <rect x="5" y="1" width="1" height="18" />
                    <rect x="7" y="1" width="2" height="18" />
                    <rect x="10" y="1" width="1" height="18" />
                    <rect x="13" y="1" width="3" height="18" />
                    <rect x="18" y="1" width="1" height="18" />
                    <rect x="21" y="1" width="1" height="18" />
                    <rect x="24" y="1" width="2" height="18" />
                    <rect x="28" y="1" width="4" height="18" />
                    <rect x="33" y="1" width="1" height="18" />
                    <rect x="36" y="1" width="2" height="18" />
                    <rect x="39" y="1" width="1" height="18" />
                    <rect x="42" y="1" width="3" height="18" />
                    <rect x="47" y="1" width="1" height="18" />
                    <rect x="50" y="1" width="2" height="18" />
                    <rect x="54" y="1" width="3" height="18" />
                    <rect x="59" y="1" width="1" height="18" />
                    <rect x="62" y="1" width="2" height="18" />
                    <rect x="66" y="1" width="4" height="18" />
                    <rect x="71" y="1" width="1" height="18" />
                    <rect x="74" y="1" width="2" height="18" />
                    <rect x="78" y="1" width="3" height="18" />
                    <rect x="83" y="1" width="1" height="18" />
                    <rect x="86" y="1" width="2" height="18" />
                    <rect x="90" y="1" width="4" height="18" />
                    <rect x="95" y="1" width="1" height="18" />
                  </g>
                  <text x="50" y="23" fontSize="5" fontFamily="monospace" textAnchor="middle" fill="black">
                    {skuCode}
                  </text>
                </svg>
              </div>

              <span className="text-[7px] text-slate-400 font-mono tracking-widest">PROPRIETARY BARCODE</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
