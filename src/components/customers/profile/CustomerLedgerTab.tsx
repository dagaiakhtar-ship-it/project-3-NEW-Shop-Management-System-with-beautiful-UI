import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { getCustomerLedger } from '../../../database/creditHelper';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import showToast from '../../../utils/toast';
import * as XLSX from 'xlsx';

interface CustomerLedgerTabProps {
  customer: any;
  sales: any[];
  payments: any[];
  onExportStatement: (mode: 'download' | 'preview' | 'print') => void;
  isGeneratingPdf: boolean;
}

export const CustomerLedgerTab: React.FC<CustomerLedgerTabProps> = ({
  customer,
  sales,
  payments,
  onExportStatement,
  isGeneratingPdf
}) => {
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch the ledger reactively whenever sales/payments/customer changes
  useEffect(() => {
    let active = true;
    const fetchLedger = async () => {
      try {
        setLoading(true);
        const data = await getCustomerLedger(customer.id!);
        if (active) {
          setLedgerEntries(data.ledgerEntries || []);
          setOpeningBalance(data.openingBalance || 0);
          setClosingBalance(data.closingBalance || 0);
        }
      } catch (err: any) {
        console.error('Failed to load customer ledger:', err);
        showToast.error('Failed to construct account ledger.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLedger();
    return () => {
      active = false;
    };
  }, [customer.id, sales, payments]);

  // Client-side filtering
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      // 1. Keyword search (on reference, description, notes, or product names inside description if applicable)
      const keyword = searchQuery.toLowerCase();
      if (searchQuery) {
        const refMatch = (entry.reference || '').toLowerCase().includes(keyword);
        const descMatch = (entry.description || '').toLowerCase().includes(keyword);
        const notesMatch = (entry.notes || '').toLowerCase().includes(keyword);
        if (!refMatch && !descMatch && !notesMatch) {
          return false;
        }
      }

      // 2. Date filters
      if (dateRangeFilter !== 'All') {
        const entryDate = new Date(entry.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (dateRangeFilter === 'Today') {
          const today = new Date();
          today.setHours(0,0,0,0);
          if (entryDate < today) return false;
        } else if (dateRangeFilter === 'ThisWeek') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          if (entryDate < startOfWeek) return false;
        } else if (dateRangeFilter === 'ThisMonth') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (entryDate < startOfMonth) return false;
        } else if (dateRangeFilter === 'Custom' && startDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          if (entryDate < start) return false;
        }

        if (dateRangeFilter === 'Custom' && endDate) {
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          if (entryDate > end) return false;
        }
      }

      return true;
    });
  }, [ledgerEntries, searchQuery, dateRangeFilter, startDate, endDate]);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Export handlers
  const handleExportExcel = () => {
    try {
      const exportData = filteredLedger.map((e) => ({
        Date: formatDate(e.date),
        Reference: e.reference,
        Description: e.description,
        Debit: e.debit,
        Credit: e.credit,
        'Running Balance': e.balance,
        Notes: e.notes || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Ledger');
      
      // Auto-fit column widths
      const maxColWidths = [{ wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }];
      worksheet['!cols'] = maxColWidths;

      XLSX.writeFile(workbook, `Ledger_${customer.customerCode || 'statement'}.xlsx`);
      showToast.success('Excel spreadsheet generated successfully.');
    } catch (err: any) {
      showToast.error(`Failed to export Excel: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Running Balance', 'Notes'];
      const rows = filteredLedger.map((e) => [
        formatDate(e.date),
        e.reference,
        e.description,
        e.debit,
        e.credit,
        e.balance,
        e.notes || '',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [
          headers.join(','),
          ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Ledger_${customer.customerCode || 'statement'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast.success('CSV spreadsheet exported successfully.');
    } catch (err: any) {
      showToast.error(`Failed to export CSV: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Opening / Closing Balance Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opening Balance</p>
              <p className="text-xl font-black text-slate-850 dark:text-slate-150 mt-1">{formatCurrency(openingBalance)}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-semibold">
            Customer Initial Credit state
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 rounded-xl">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Closing (Current) Balance</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-455 mt-1">{formatCurrency(closingBalance)}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-semibold">
            Active Outstanding Account Debt
          </div>
        </div>
      </div>

      {/* Filter and export action bar */}
      <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledger entries (Invoice, payment description, notes)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['All', 'Today', 'ThisWeek', 'Custom'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDateRangeFilter(opt)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    dateRangeFilter === opt
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-650 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-400'
                  }`}
                >
                  {opt === 'ThisWeek' ? 'This Week' : opt}
                </button>
              ))}
            </div>

            {dateRangeFilter === 'Custom' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="py-1 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="py-1 px-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportStatement('print')}
              className="flex items-center gap-1.5 text-xs border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportStatement('download')}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 text-xs border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 text-xs border-slate-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs border-slate-200 text-slate-650"
            >
              <Layers className="w-3.5 h-3.5" />
              CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Running Ledger table */}
      <Card className="border border-slate-150/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                <th className="py-3 px-4">Ledger Timestamp</th>
                <th className="py-3 px-4">Transaction Reference</th>
                <th className="py-3 px-4">Ledger Description</th>
                <th className="py-3 px-4 text-right">Debit (Charge)</th>
                <th className="py-3 px-4 text-right">Credit (Payment)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4">Notes / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-450">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <span>Reconstructing account ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
                    <p className="font-bold">No Ledger Entries Logged</p>
                    <p className="text-[11px] text-slate-400 mt-1">This account has zero chronological transactions under current filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((e, index) => {
                  return (
                    <tr key={index} className="hover:bg-slate-50/25 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                        {e.reference}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {e.description}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-500 font-bold">
                        {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">
                        {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-50/30 dark:bg-slate-900/10">
                        {formatCurrency(e.balance)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-450 italic truncate max-w-xs">
                        {e.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
