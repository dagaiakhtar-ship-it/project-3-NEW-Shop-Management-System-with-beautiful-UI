import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Printer,
  Download,
  Send,
  Copy,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Barcode,
  RefreshCw
} from 'lucide-react';
import { db, type Sale, type SaleItem } from '../../../database/db';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Pagination from '../../ui/Pagination';
import showToast from '../../../utils/toast';

interface CustomerBillingTabProps {
  customer: any;
  sales: Sale[];
  saleItemsMap: Record<number, SaleItem[]>;
  onViewInvoice: (sale: Sale) => void;
  onPrintInvoice: (sale: Sale, format: 'thermal' | 'a4') => void;
  onDownloadInvoice: (sale: Sale) => void;
  onSendWhatsApp: (sale: Sale) => void;
  onRefresh: () => void;
}

export const CustomerBillingTab: React.FC<CustomerBillingTabProps> = ({
  customer,
  sales,
  saleItemsMap,
  onViewInvoice,
  onPrintInvoice,
  onDownloadInvoice,
  onSendWhatsApp,
  onRefresh
}) => {
  // Search & Filters states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All'); // 'All', 'Today', 'Yesterday', 'ThisWeek', 'ThisMonth', 'LastMonth', 'ThisYear', 'Custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expandable invoice card states
  const [expandedInvoices, setExpandedInvoices] = useState<Record<number, boolean>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const toggleInvoice = (id: number) => {
    setExpandedInvoices((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle duplicate invoice
  const handleDuplicateInvoice = async (sale: Sale) => {
    try {
      const items = saleItemsMap[sale.id!] || [];
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const newInvoiceNo = `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${codeSuffix}`;

      const newSale: Sale = {
        ...sale,
        id: undefined,
        invoiceNo: newInvoiceNo,
        invoiceNumber: newInvoiceNo,
        createdAt: new Date(),
        saleDate: new Date()
      };

      const newSaleId = await db.sales.add(newSale);

      if (items.length > 0) {
        const newItems = items.map(item => ({
          ...item,
          id: undefined,
          saleId: newSaleId
        }));
        await db.saleItems.bulkAdd(newItems);
      }

      showToast.success(`Invoice duplicated successfully: ${newInvoiceNo}`);
      onRefresh();
    } catch (err: any) {
      showToast.error(`Failed to duplicate invoice: ${err.message}`);
    }
  };

  // Advanced Filtering Logic
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (sale.isDeleted) return false;

      // 1. Search (Invoice number, barcode, cashier, or product name)
      const keyword = searchTerm.trim().toLowerCase();
      const invNo = (sale.invoiceNumber || sale.invoiceNo || '').toLowerCase();
      const cashier = (sale.createdBy || '').toLowerCase();
      
      let matchesSearch = !keyword || invNo.includes(keyword) || cashier.includes(keyword);

      if (keyword && !matchesSearch) {
        const items = saleItemsMap[sale.id!] || [];
        matchesSearch = items.some(item => 
          (item.productName || '').toLowerCase().includes(keyword) ||
          (item.barcode || '').toLowerCase().includes(keyword)
        );
      }

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'All') {
        const status = sale.paymentStatus || 'Paid';
        if (status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 3. Method Filter
      if (methodFilter !== 'All') {
        const method = sale.paymentMethod || 'Cash';
        if (method.toLowerCase() !== methodFilter.toLowerCase()) return false;
      }

      // 4. Date Range Filter
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      if (dateRangeFilter === 'Today') {
        if (saleDate < startOfToday) return false;
      } else if (dateRangeFilter === 'Yesterday') {
        const endOfYesterday = new Date(startOfToday);
        endOfYesterday.setMilliseconds(-1);
        if (saleDate < startOfYesterday || saleDate > endOfYesterday) return false;
      } else if (dateRangeFilter === 'ThisWeek') {
        if (saleDate < startOfWeek) return false;
      } else if (dateRangeFilter === 'ThisMonth') {
        if (saleDate < startOfMonth) return false;
      } else if (dateRangeFilter === 'LastMonth') {
        if (saleDate < startOfLastMonth || saleDate > endOfLastMonth) return false;
      } else if (dateRangeFilter === 'ThisYear') {
        if (saleDate < startOfYear) return false;
      } else if (dateRangeFilter === 'Custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0,0,0,0);
          if (saleDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23,59,59,999);
          if (saleDate > end) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Reverse chronological order
      const dateA = new Date(a.saleDate || a.createdAt).getTime();
      const dateB = new Date(b.saleDate || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [sales, saleItemsMap, searchTerm, statusFilter, methodFilter, dateRangeFilter, startDate, endDate]);

  // Paginated Sales
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val ?? 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatTime = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-5">
      {/* Search Toolbar */}
      <Card className="p-4 border border-slate-150/60 shadow-xs flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice, Cashier, Barcode, Product Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="All">All Invoice Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Payment">Mobile Payment</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-50 dark:border-slate-800/60 pt-3">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            Date Filter:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {['All', 'Today', 'Yesterday', 'ThisWeek', 'ThisMonth', 'LastMonth', 'ThisYear', 'Custom'].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setDateRangeFilter(opt);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  dateRangeFilter === opt
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-400'
                }`}
              >
                {opt === 'ThisWeek' ? 'This Week' : opt === 'ThisMonth' ? 'This Month' : opt === 'LastMonth' ? 'Last Month' : opt === 'ThisYear' ? 'This Year' : opt}
              </button>
            ))}
          </div>

          {dateRangeFilter === 'Custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent dark:text-slate-200 focus:outline-none"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {paginatedSales.length === 0 ? (
          <Card className="py-12 border border-slate-150/60 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Matching Bills Logged</h4>
            <p className="text-xs text-slate-400 mt-1">Try relaxing your search keywords or resetting status &amp; date filters.</p>
          </Card>
        ) : (
          paginatedSales.map((sale) => {
            const isExpanded = !!expandedInvoices[sale.id!];
            const items = saleItemsMap[sale.id!] || [];
            const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
            
            const totalVal = sale.grandTotal ?? sale.total ?? 0;
            const paidVal = sale.paidAmount ?? 0;
            const remainingVal = sale.remainingAmount ?? Math.max(0, totalVal - paidVal);

            // Subtotal computation
            const subtotalVal = items.reduce((sum, item) => sum + (item.subtotal ?? (item.quantity * item.unitPrice)), 0);
            const discountVal = sale.discount ?? 0;
            const taxVal = sale.taxAmount ?? 0;
            const shippingVal = sale.shippingCharges ?? 0;
            const otherVal = sale.otherCharges ?? 0;

            return (
              <div
                key={sale.id}
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all duration-200 hover:shadow-md text-xs font-semibold"
              >
                {/* Collapsed Card Header */}
                <div
                  onClick={() => toggleInvoice(sale.id!)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 items-center">
                    {/* Invoice Info */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoice No</p>
                      <p className="font-black font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                        {sale.invoiceNumber || sale.invoiceNo}
                      </p>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date &amp; Time</p>
                      <p className="text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(sale.saleDate || sale.createdAt)} @ {formatTime(sale.saleDate || sale.createdAt)}
                      </p>
                    </div>

                    {/* Cashier & Method */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cashier / Method</p>
                      <p className="text-slate-650 dark:text-slate-400 uppercase text-[10px]">
                        {sale.createdBy || 'System'} • {sale.paymentMethod || 'Cash'}
                      </p>
                    </div>

                    {/* Grand Total */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Checkout Bill</p>
                      <p className="text-slate-850 dark:text-slate-100 font-black font-mono">
                        {formatCurrency(totalVal)}
                      </p>
                    </div>

                    {/* Payment status & balances */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settled Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          sale.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : sale.paymentStatus === 'Partial'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                        }`}>
                          {sale.paymentStatus || 'Paid'}
                        </span>
                        {remainingVal > 0 && (
                          <span className="text-rose-500 font-mono font-bold text-[10px]">
                            {formatCurrency(remainingVal)} Rem.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <div className="flex items-center justify-end">
                    <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Bill View (Real Printed Bill Style) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 p-5 space-y-6 bg-white dark:bg-slate-900/60 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Bill Receipt Header */}
                    <div className="border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 max-w-2xl mx-auto shadow-xs border-dashed">
                      <div className="text-center space-y-2 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-100">Retail Sales Invoice</h4>
                        <p className="font-mono text-[10px] text-slate-450 uppercase">
                          No: {sale.invoiceNo || sale.invoiceNumber} • Date: {formatDate(sale.saleDate || sale.createdAt)} • Time: {formatTime(sale.saleDate || sale.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Cashier: {sale.createdBy || 'Operator'} • Customer: {customer.fullName}
                        </p>
                      </div>

                      {/* Purchased Products Table */}
                      <div className="py-4 space-y-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Line Items Detail</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px] font-semibold">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[9px] uppercase tracking-wider">
                                <th className="py-1 px-1">Product Description</th>
                                <th className="py-1 px-1 text-center">Qty</th>
                                <th className="py-1 px-1 text-right">Unit Price</th>
                                <th className="py-1 px-1 text-right">Discount</th>
                                <th className="py-1 px-1 text-right">Tax</th>
                                <th className="py-1 px-1 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                              {items.map((item, idx) => {
                                const rowTotal = item.subtotal ?? (item.quantity * item.unitPrice);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-1">
                                      <p className="font-bold text-slate-850 dark:text-slate-200">{item.productName}</p>
                                      {item.barcode && (
                                        <span className="font-mono text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                          <Barcode className="w-3 h-3" />
                                          {item.barcode}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-1 text-center font-mono">
                                      {item.quantity}
                                    </td>
                                    <td className="py-2 px-1 text-right font-mono">
                                      {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="py-2 px-1 text-right font-mono text-rose-500">
                                      {item.discountAmount && item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '-'}
                                    </td>
                                    <td className="py-2 px-1 text-right font-mono text-slate-400">
                                      {item.taxAmount && item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '-'}
                                    </td>
                                    <td className="py-2 px-1 text-right font-mono font-bold text-slate-850 dark:text-slate-100">
                                      {formatCurrency(rowTotal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Invoice Summary */}
                      <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Left Side notes */}
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Invoice Remarks</p>
                          <p className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-500 italic leading-relaxed border border-slate-100 dark:border-slate-800">
                            {sale.notes || 'No invoice notes captured at point of sale.'}
                          </p>
                        </div>

                        {/* Right Side Totals */}
                        <div className="space-y-1.5 text-[11px] font-semibold text-slate-550 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-mono">{formatCurrency(subtotalVal)}</span>
                          </div>
                          {discountVal > 0 && (
                            <div className="flex justify-between text-rose-500">
                              <span>Total discount:</span>
                              <span className="font-mono">-{formatCurrency(discountVal)}</span>
                            </div>
                          )}
                          {taxVal > 0 && (
                            <div className="flex justify-between">
                              <span>Sales tax:</span>
                              <span className="font-mono">+{formatCurrency(taxVal)}</span>
                            </div>
                          )}
                          {shippingVal > 0 && (
                            <div className="flex justify-between">
                              <span>Shipping charges:</span>
                              <span className="font-mono">+{formatCurrency(shippingVal)}</span>
                            </div>
                          )}
                          {otherVal > 0 && (
                            <div className="flex justify-between">
                              <span>Other charges:</span>
                              <span className="font-mono">+{formatCurrency(otherVal)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                            <span>Grand Total:</span>
                            <span className="font-mono">{formatCurrency(totalVal)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Paid amount:</span>
                            <span className="font-mono">{formatCurrency(paidVal)}</span>
                          </div>
                          <div className="flex justify-between text-rose-500 font-bold">
                            <span>Remaining balance:</span>
                            <span className="font-mono">{formatCurrency(remainingVal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap max-w-2xl mx-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewInvoice(sale)}
                        className="flex items-center gap-1 font-bold"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        View ERP Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintInvoice(sale, 'a4')}
                        className="flex items-center gap-1 font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print A4
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintInvoice(sale, 'thermal')}
                        className="flex items-center gap-1 font-bold"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-450" />
                        Print Thermal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadInvoice(sale)}
                        className="flex items-center gap-1 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendWhatsApp(sale)}
                        className="flex items-center gap-1 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-500" />
                        WhatsApp Bill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateInvoice(sale)}
                        className="flex items-center gap-1 font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-500" />
                        Duplicate Bill
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
