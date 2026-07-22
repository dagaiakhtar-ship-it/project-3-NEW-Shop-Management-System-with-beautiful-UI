import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  Bookmark,
  Building,
  User,
  Hash,
  Scale
} from 'lucide-react';
import { type Supplier, db } from '../../database/db';
import SupplierStatusBadge from './SupplierStatusBadge';
import { usePDF } from '../../hooks/usePDF';
import { PDFButton, PDFPreviewDialog } from '../common/PDFComponents';

interface SupplierDetailsProps {
  supplier: Supplier;
}

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({ supplier }) => {
  const { isGenerating, previewUrl, closePreview, generateSupplierStatement } = usePDF();
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (supplier.id) {
      db.purchases.where('supplierId').equals(supplier.id).toArray().then((data) => {
        setPurchases(data);
      });
    }
  }, [supplier.id]);

  const handleExportStatement = async (mode: 'download' | 'preview' | 'print') => {
    const transactions = purchases.map((p) => ({
      date: new Date(p.purchaseDate || p.createdAt),
      reference: p.purchaseNumber || p.referenceNo,
      type: 'Purchase Invoice',
      amount: p.grandTotal ?? p.total,
      paid: p.paidAmount,
      balance: (p.grandTotal ?? p.total) - p.paidAmount,
    }));

    const meta = {
      openingBalance: supplier.openingBalance || 0,
      closingBalance: supplier.currentBalance || 0,
      outstanding: supplier.currentBalance || 0,
    };

    await generateSupplierStatement(supplier, transactions, meta, mode);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex gap-4 items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-lg shadow-sm">
            {supplier.companyName?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {supplier.companyName}
              </h2>
              <SupplierStatusBadge status={supplier.status || 'Active'} />
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
              Code: {supplier.supplierCode}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact and Communication Card */}
        <div className="p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/25 space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Vendor Profile
          </h3>
          
          <div className="space-y-3.5 text-xs">
            {/* Contact Person */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" /> Contact Person
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {supplier.contactPerson || '—'}
              </span>
            </div>

            {/* Phone */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                {supplier.phone}
              </span>
            </div>

            {/* Alt Phone */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 opacity-60" /> Alternate Phone
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                {supplier.alternatePhone || '—'}
              </span>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </span>
              {supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  {supplier.email}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-slate-600 font-bold">—</span>
              )}
            </div>

            {/* Website */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Corporate Website
              </span>
              {supplier.website ? (
                <a
                  href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  {supplier.website}
                </a>
              ) : (
                <span className="text-slate-400 dark:text-slate-600 font-bold">—</span>
              )}
            </div>

            {/* Tax ID */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" /> Tax/VAT License
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                {supplier.taxNumber || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Address and Geographics Card */}
        <div className="p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/25 space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Corporate Locations
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Address */}
            <div className="flex flex-col gap-1 py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Building className="h-3.5 w-3.5" /> Street Address
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {supplier.address || '—'}
              </span>
            </div>

            {/* City */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> City
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {supplier.city || '—'}
              </span>
            </div>

            {/* Country */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Country
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {supplier.country || '—'}
              </span>
            </div>

            {/* Postal Code */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" /> Postal Code
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                {supplier.postalCode || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Profile Card */}
        <div className="p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/25 space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Financial Standing
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Opening Balance */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Opening Balance
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {formatCurrency(supplier.openingBalance || 0)}
              </span>
            </div>

            {/* Outstanding Balance */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Outstanding Balance
              </span>
              <span className="text-base font-black text-rose-650 dark:text-rose-400">
                {formatCurrency(supplier.currentBalance || 0)}
              </span>
            </div>

            {/* Payment Terms */}
            <div className="flex justify-between items-center py-1.5 pb-3 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Scale className="h-3.5 w-3.5" /> Payment Terms
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-black font-mono text-[10px] uppercase">
                {supplier.paymentTerms || 'Net 30'}
              </span>
            </div>

            {/* Statement Trigger */}
            <div className="pt-2.5 flex justify-end">
              <PDFButton
                onClick={handleExportStatement}
                label="Statement of Purchases"
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* Audit & Logs Card */}
        <div className="p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/25 space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Audit Records
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Created At */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-900">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Date Registered
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                {formatDate(supplier.createdAt)}
              </span>
            </div>

            {/* Updated At */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 opacity-60" /> Last Modified
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                {formatDate(supplier.updatedAt || supplier.createdAt)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Notes Field (Full Width) */}
      <div className="p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/25 space-y-2 text-xs">
        <h3 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Procurement Notes & Guidelines
        </h3>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line bg-slate-50/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
          {supplier.notes || 'No notes specified for this supplier.'}
        </p>
      </div>

      <PDFPreviewDialog
        isOpen={!!previewUrl}
        onClose={closePreview}
        pdfUrl={previewUrl}
        title={`${supplier.companyName} Statement of Purchases`}
      />
    </div>
  );
};

export default SupplierDetails;
