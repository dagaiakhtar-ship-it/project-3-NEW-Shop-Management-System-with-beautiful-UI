import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  BadgeAlert,
  Wallet,
  Receipt,
  Eye,
  X,
  ShoppingBag
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

interface BiLedgerTableProps {
  sales: any[];
  purchases: any[];
  expenses: any[];
  creditPayments: any[];
}

type LedgerType = 'sales' | 'purchases' | 'expenses' | 'credit';

export const BiLedgerTable: React.FC<BiLedgerTableProps> = ({
  sales,
  purchases,
  expenses,
  creditPayments
}) => {
  const [activeTab, setActiveTab] = useState<LedgerType>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  // Reset pagination when tab/search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  // Determine active dataset
  const activeDataset = useMemo(() => {
    switch (activeTab) {
      case 'sales': return sales;
      case 'purchases': return purchases;
      case 'expenses': return expenses;
      case 'credit': return creditPayments;
    }
  }, [activeTab, sales, purchases, expenses, creditPayments]);

  // Handle header sorting click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Status Badge resolvers
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'received':
      case 'paid':
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
      case 'bank':
        return <Badge variant="warning">Bank</Badge>;
      default:
        return <Badge variant="default">{method}</Badge>;
    }
  };

  // Apply sorting and fuzzy filter search
  const processedDataset = useMemo(() => {
    if (!activeDataset) return [];

    let result = [...activeDataset];

    // 1. Fuzzy Search Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return Object.entries(item).some(([key, val]) => {
          if (val === null || val === undefined) return false;
          if (key === 'id') return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle dates
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();
      if (sortField === 'createdAt' || sortField === 'expenseDate' || sortField === 'paymentDate') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeDataset, searchQuery, sortField, sortDirection]);

  // Paginated dataset
  const paginatedDataset = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedDataset.slice(startIndex, startIndex + pageSize);
  }, [processedDataset, currentPage, pageSize]);

  const totalPages = Math.ceil(processedDataset.length / pageSize) || 1;

  // Render sorting arrows
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-slate-350" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" /> 
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />;
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (processedDataset.length === 0) return alert('No data available to export.');

    // Extract headers from keys
    const firstObj = processedDataset[0];
    const columns = Object.keys(firstObj).filter(k => k !== 'id');
    const headerRow = columns.map(c => `"${c.toUpperCase()}"`).join(',');

    const dataRows = processedDataset.map(row => {
      return columns.map(col => {
        let val = row[col];
        if (val instanceof Date) val = val.toLocaleString();
        if (typeof val === 'string') val = val.replace(/"/g, '""'); // escape quotes
        return `"${val !== undefined ? val : ''}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `store_ledger_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print ledger handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full text-left print:p-0 print:border-none print:shadow-none">
      
      {/* 1. Header controls & title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40 print:hidden">
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 tracking-tight uppercase flex items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-500" />
            Interactive Transaction Logs & Ledger
          </h4>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Audit, sort, paginate, filter, print, and export all physical retail shop activities
          </p>
        </div>

        {/* Quick Utilities (Export / Print) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* 2. Sheet Selection tabs & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between my-4 print:hidden">
        <div className="flex flex-wrap items-center rounded-xl bg-slate-50 dark:bg-slate-950 p-1 border border-slate-100 dark:border-slate-850">
          {(['sales', 'purchases', 'expenses', 'credit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSortField(tab === 'expenses' ? 'expenseDate' : tab === 'credit' ? 'paymentDate' : 'createdAt');
                setSortDirection('desc');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 shadow text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'sales' && 'Sales Invoices'}
              {tab === 'purchases' && 'Purchases Log'}
              {tab === 'expenses' && 'Expenses Sheet'}
              {tab === 'credit' && 'Credit Recoveries'}
            </button>
          ))}
        </div>

        {/* Dynamic Search Box */}
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Fuzzy filter search log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl pl-9 pr-4 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/10 placeholder-slate-400"
          />
        </div>
      </div>

      {/* 3. The Grid / Table with Sticky Headers */}
      <div className="flex-1 overflow-x-auto border border-slate-100 dark:border-slate-800/70 rounded-2xl max-h-[350px]">
        <table className="w-full text-left border-collapse min-w-[700px] relative">
          
          {/* Sticky table headers */}
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-20 shadow-[0_1px_0_0_rgba(226,232,240,0.8)] dark:shadow-[0_1px_0_0_rgba(30,41,59,0.8)]">
            {activeTab === 'sales' && (
              <tr>
                <th onClick={() => handleSort('invoiceNo')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Invoice No {renderSortIndicator('invoiceNo')}</div>
                </th>
                <th onClick={() => handleSort('customerName')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Customer {renderSortIndicator('customerName')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Sold items</th>
                <th onClick={() => handleSort('total')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Grand Total {renderSortIndicator('total')}</div>
                </th>
                <th onClick={() => handleSort('paidAmount')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Paid Amount {renderSortIndicator('paidAmount')}</div>
                </th>
                <th onClick={() => handleSort('outstanding')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Debt Balance {renderSortIndicator('outstanding')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Payment Method</th>
                <th onClick={() => handleSort('createdAt')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Invoice Date {renderSortIndicator('createdAt')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider text-right print:hidden">Actions</th>
              </tr>
            )}
            {activeTab === 'purchases' && (
              <tr>
                <th onClick={() => handleSort('purchaseNumber')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Purchase No {renderSortIndicator('purchaseNumber')}</div>
                </th>
                <th onClick={() => handleSort('supplierName')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Supplier {renderSortIndicator('supplierName')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Ref Code</th>
                <th onClick={() => handleSort('total')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Acquisition Cost {renderSortIndicator('total')}</div>
                </th>
                <th onClick={() => handleSort('paidAmount')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Paid Amount {renderSortIndicator('paidAmount')}</div>
                </th>
                <th onClick={() => handleSort('outstanding')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Accounts Payable {renderSortIndicator('outstanding')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Payment Option</th>
                <th onClick={() => handleSort('createdAt')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Received Date {renderSortIndicator('createdAt')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider text-right print:hidden">Status</th>
              </tr>
            )}
            {activeTab === 'expenses' && (
              <tr>
                <th onClick={() => handleSort('expenseNumber')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Expense Id {renderSortIndicator('expenseNumber')}</div>
                </th>
                <th onClick={() => handleSort('title')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Description Title {renderSortIndicator('title')}</div>
                </th>
                <th onClick={() => handleSort('categoryName')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Ledger Category {renderSortIndicator('categoryName')}</div>
                </th>
                <th onClick={() => handleSort('amount')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Amount paid {renderSortIndicator('amount')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Method</th>
                <th onClick={() => handleSort('expenseDate')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Filing Date {renderSortIndicator('expenseDate')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider text-right print:hidden">Filing status</th>
              </tr>
            )}
            {activeTab === 'credit' && (
              <tr>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Receipt ID</th>
                <th onClick={() => handleSort('customerName')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Debtor Customer {renderSortIndicator('customerName')}</div>
                </th>
                <th onClick={() => handleSort('amount')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Amount Received {renderSortIndicator('amount')}</div>
                </th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Reference Code</th>
                <th className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Deposit Method</th>
                <th onClick={() => handleSort('paymentDate')} className="p-3 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider cursor-pointer select-none">
                  <div className="flex items-center">Recovery Date {renderSortIndicator('paymentDate')}</div>
                </th>
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {paginatedDataset.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-xs font-bold text-slate-400 dark:text-slate-500">
                  No records match your filters or search constraints.
                </td>
              </tr>
            ) : (
              paginatedDataset.map((row, rIdx) => {
                const isOdd = rIdx % 2 !== 0;
                return (
                  <tr 
                    key={row.id || rIdx} 
                    className={`hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer ${isOdd ? 'bg-slate-50/20 dark:bg-slate-900/30' : ''}`}
                    onClick={() => {
                      if (activeTab === 'sales') {
                        setSelectedItemDetail(row);
                      }
                    }}
                  >
                    {activeTab === 'sales' && (
                      <>
                        <td className="p-3 text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{row.invoiceNo}</td>
                        <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-400">{row.customerName}</td>
                        <td className="p-3 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{row.itemCount} units</td>
                        <td className="p-3 text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.total)}</td>
                        <td className="p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.paidAmount)}</td>
                        <td className={`p-3 text-xs font-black ${row.outstanding > 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600'}`}>{formatCurrency(row.outstanding)}</td>
                        <td className="p-3 text-[10px] font-bold">{getPaymentBadge(row.paymentMethod)}</td>
                        <td className="p-3 text-xs font-bold text-slate-450 dark:text-slate-500">{formatDate(row.createdAt)}</td>
                        <td className="p-3 text-right print:hidden">
                          <button className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'purchases' && (
                      <>
                        <td className="p-3 text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{row.purchaseNumber}</td>
                        <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-400">{row.supplierName}</td>
                        <td className="p-3 text-xs font-mono text-slate-450 dark:text-slate-500">{row.referenceNo}</td>
                        <td className="p-3 text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.total)}</td>
                        <td className="p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.paidAmount)}</td>
                        <td className={`p-3 text-xs font-black ${row.outstanding > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{formatCurrency(row.outstanding)}</td>
                        <td className="p-3 text-[10px] font-bold">{getPaymentBadge(row.paymentMethod)}</td>
                        <td className="p-3 text-xs font-bold text-slate-450 dark:text-slate-500">{formatDate(row.createdAt)}</td>
                        <td className="p-3 text-right print:hidden">{getStatusBadge(row.status)}</td>
                      </>
                    )}
                    {activeTab === 'expenses' && (
                      <>
                        <td className="p-3 text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{row.expenseNumber}</td>
                        <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-350">{row.title}</td>
                        <td className="p-3 text-xs font-bold text-indigo-500 dark:text-indigo-400">{row.categoryName}</td>
                        <td className="p-3 text-xs font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(row.amount)}</td>
                        <td className="p-3 text-[10px] font-bold">{getPaymentBadge(row.paymentMethod)}</td>
                        <td className="p-3 text-xs font-bold text-slate-450 dark:text-slate-500">{formatDate(row.expenseDate)}</td>
                        <td className="p-3 text-right print:hidden">{getStatusBadge(row.status)}</td>
                      </>
                    )}
                    {activeTab === 'credit' && (
                      <>
                        <td className="p-3 text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">REC-{row.id}</td>
                        <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-400">{row.customerName}</td>
                        <td className="p-3 text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amount)}</td>
                        <td className="p-3 text-xs font-mono text-slate-450 dark:text-slate-500">{row.referenceNo}</td>
                        <td className="p-3 text-[10px] font-bold">{getPaymentBadge(row.paymentMethod)}</td>
                        <td className="p-3 text-xs font-bold text-slate-450 dark:text-slate-500">{formatDate(row.paymentDate)}</td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Pagination controls */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between mt-4 border-t border-slate-100 dark:border-slate-800/40 pt-4 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl px-2.5 py-1 text-slate-600 dark:text-slate-400 cursor-pointer outline-none"
          >
            {[5, 10, 20, 50].map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-4">
            Showing {processedDataset.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedDataset.length)} of {processedDataset.length} rows
          </span>
        </div>

        {/* Previous / Next pagination buttons */}
        <div className="flex items-center gap-1.5 self-end">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const pageNum = pageIdx + 1;
              const isCurrent = currentPage === pageNum;
              
              // Only show first, last, current, and adjacent pages
              if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(currentPage - pageNum) > 1) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="px-1 text-xs font-bold text-slate-300">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 text-xs font-black rounded-lg cursor-pointer flex items-center justify-center select-none ${
                    isCurrent 
                      ? 'bg-indigo-600 text-white font-extrabold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Invoice Modal Drawer Details (Sales item breakdown) */}
      <AnimatePresence>
        {selectedItemDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 animate-fade-in"
              onClick={() => setSelectedItemDetail(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Receipt className="h-6 w-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Invoice Sheet Breakdown
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    Retail receipt summary audits
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl mb-6 border border-slate-150/40 dark:border-slate-800/40 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Code</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-150">{selectedItemDetail.invoiceNo}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Checkout Date</span>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-350">{formatDate(selectedItemDetail.createdAt, true)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Patron Name</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedItemDetail.customerName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Paid Method</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{selectedItemDetail.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Gross Subtotal</span>
                  <span>{formatCurrency(selectedItemDetail.total)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100">
                  <span>Grand Receipts Total</span>
                  <span>{formatCurrency(selectedItemDetail.total)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600 pt-1">
                  <span>Received Cash Amount</span>
                  <span>{formatCurrency(selectedItemDetail.paidAmount)}</span>
                </div>
                {selectedItemDetail.outstanding > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-500 pt-1">
                    <span>Due Outstanding Debts</span>
                    <span>{formatCurrency(selectedItemDetail.outstanding)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-8 pt-4 border-t border-slate-150">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black text-slate-450 text-left">
                  Receipt status is saved as <strong className="text-slate-700 dark:text-slate-350">{selectedItemDetail.status}</strong>. Authenticated under POS register.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BiLedgerTable;
