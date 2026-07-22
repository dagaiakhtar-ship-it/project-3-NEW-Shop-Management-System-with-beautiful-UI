import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  LineChart as LineIcon, 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  Package, 
  Percent, 
  Users, 
  AlertTriangle, 
  PieChart as PieIcon,
  ArrowDownRight,
  Calculator,
  Printer,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useReports, useSalesReport, usePurchaseReport, useExpenseReport, useProfitLoss, useStockReport, useCreditReport, useAnalytics } from '../hooks/useReports';
import { type ReportFilters } from '../database/reportHelpers';
import SummaryCard from '../components/reports/SummaryCard';
import ChartCard from '../components/reports/ChartCard';
import ReportTable from '../components/reports/ReportTable';
import FilterToolbar from '../components/reports/FilterToolbar';
import DateRangePicker from '../components/reports/DateRangePicker';
import ExportMenu from '../components/reports/ExportMenu';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';

type ActiveTab = 'dashboard' | 'sales' | 'purchases' | 'expenses' | 'credit' | 'stock';

export const Reports: React.FC = () => {
  // Global filters state
  const [filters, setFilters] = useState<ReportFilters>({
    dateFilter: 'month',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Load contextual hooks based on active tab
  const { data: globalData, isLoading: globalLoading } = useReports(filters);
  const { data: salesData, isLoading: salesLoading } = useSalesReport(filters);
  const { data: purchasesData, isLoading: purchasesLoading } = usePurchaseReport(filters);
  const { data: expensesData, isLoading: expensesLoading } = useExpenseReport(filters);
  const { data: creditData, isLoading: creditLoading } = useCreditReport(filters);
  const { data: stockData, isLoading: stockLoading } = useStockReport(filters);
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics(filters);

  const handlePrint = () => {
    window.print();
  };

  const handleDateChange = (dateFilter: ReportFilters['dateFilter']) => {
    setFilters(prev => ({
      ...prev,
      dateFilter,
    }));
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', val: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: val,
    }));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard & Profit/Loss', icon: LineIcon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
    { id: 'sales', label: 'Sales & Invoices', icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
    { id: 'purchases', label: 'Purchases & Suppliers', icon: ShoppingBag, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20' },
    { id: 'expenses', label: 'Expenses Audit', icon: DollarSign, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' },
    { id: 'credit', label: 'Accounts Credit', icon: CreditCard, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
    { id: 'stock', label: 'Stock & Inventory', icon: Package, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20' },
  ] as const;

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-7xl mx-auto pb-12 print:p-0 print:bg-white print:text-black">
      {/* 1. Page Header (hidden during print) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-500" />
            Reports & Insights Auditor
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
            Audit store sales velocity, cost distributions, credit liability ratios, and net margins.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 gap-1.5 font-bold">
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Filters Box (hidden during print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 print:hidden">
        <div className="lg:col-span-2">
          <DateRangePicker
            value={filters.dateFilter}
            onChange={handleDateChange}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(val) => handleCustomDateChange('startDate', val)}
            onEndDateChange={(val) => handleCustomDateChange('endDate', val)}
          />
        </div>
        <div className="flex flex-col justify-end gap-1 text-left">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Audit Sync Status
          </span>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/30 rounded-xl text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Live IndexedDB Connected
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Data is recalculated automatically after sales, purchases, or expense adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Global Filter Toolbar (hidden during print) */}
      <div className="print:hidden">
        <FilterToolbar
          filters={filters}
          onChange={(newFilters) => setFilters(newFilters)}
          reportType={activeTab}
        />
      </div>

      {/* 4. Tab Workspace Selection Bar (hidden during print) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-px print:hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-trigger-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${tab.color}`}>
                <IconComponent className="h-3.5 w-3.5 stroke-[2]" />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Active Report Printable View Area */}
      <div className="w-full space-y-6">
        
        {/* Printable Business Header Decorator (Only visible on browser print) */}
        <div className="hidden print:block text-left border-b-4 border-indigo-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                SHOPCRAFT RETAIL AUDITOR STATEMENT
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                Financial, Stock, & Sales Register ledger
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-600">
              <p>Generated: {new Date().toLocaleString()}</p>
              <p>Interval: {filters.dateFilter.toUpperCase()}</p>
              {filters.dateFilter === 'custom' && <p>Range: {filters.startDate} to {filters.endDate}</p>}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: DASHBOARD & PROFIT/LOSS STATEMENT */}
        {/* ==================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Gross Revenue"
                value={formatCurrency(globalData?.sales ?? 0)}
                description="Total invoice sales value in period"
                isLoading={globalLoading}
                accentColor="primary"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <SummaryCard
                title="Total Expenses"
                value={formatCurrency(globalData?.expenses ?? 0)}
                description="Operational bills and overhead payments"
                isLoading={globalLoading}
                accentColor="danger"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <SummaryCard
                title="Estimated Net Profit"
                value={formatCurrency(globalData?.netProfit ?? 0)}
                description="Earnings after deducting COGS & Bills"
                isLoading={globalLoading}
                accentColor={globalData?.netProfit >= 0 ? 'success' : 'danger'}
                icon={<Percent className="h-5 w-5" />}
              />
              <SummaryCard
                title="Calculated Cash Register Flow"
                value={formatCurrency(globalData?.cashInHand ?? 0)}
                description="Immediate physical liquidity in period"
                isLoading={globalLoading}
                accentColor="info"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                P&L audits reflect standard Cost of Goods Sold (COGS) item deduction calculations.
              </span>
              <ExportMenu
                title="Profit & Loss Audit Statement"
                headers={['Financial Metric Name', 'Calculated Value']}
                data={[
                  ['Gross Sales Revenue', formatCurrency(globalData?.sales ?? 0)],
                  ['Total Purchase Cost Inflow', formatCurrency(globalData?.purchases ?? 0)],
                  ['Direct Operating Expenses', formatCurrency(globalData?.expenses ?? 0)],
                  ['Estimated Net Profit', formatCurrency(globalData?.netProfit ?? 0)],
                  ['Audit Liquid Cash In Hand', formatCurrency(globalData?.cashInHand ?? 0)]
                ]}
                summaryData={{
                  sales: formatCurrency(globalData?.sales ?? 0),
                  profit: formatCurrency(globalData?.netProfit ?? 0),
                  liquidity: formatCurrency(globalData?.cashInHand ?? 0)
                }}
                fileName="profit_loss_audit"
                onPrint={handlePrint}
              />
            </div>

            {/* Secondary stats bento layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ChartCard
                  title="Sales & Cost Performance Ledger"
                  description="Comparison of total invoice turnover, purchase acquisitions, and operational expenses."
                  type="area"
                  isLoading={analyticsLoading}
                  data={analyticsData?.trends || []}
                  dataKeys={[
                    { key: 'sales', label: 'Sales Revenue', color: '#10b981' },
                    { key: 'purchases', label: 'Purchase Costs', color: '#6366f1' },
                    { key: 'expenses', label: 'Overhead Bills', color: '#ef4444' }
                  ]}
                  xKey="date"
                />
              </div>

              <div className="space-y-6 text-left">
                <Card borderAccent accentColor="primary" className="h-full flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle>Cash Flow Allocation Model</CardTitle>
                    <CardDescription>Visual audit of capital distributions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                      <span className="text-slate-450 dark:text-slate-500">Immediate Sales Received</span>
                      <span className="font-bold text-emerald-500">+{formatCurrency(globalData?.cashFlow?.cashSales ?? 0)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                      <span className="text-slate-450 dark:text-slate-500">Credit Recovery Payments</span>
                      <span className="font-bold text-emerald-500">+{formatCurrency(globalData?.cashFlow?.creditRecoveries ?? 0)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                      <span className="text-slate-450 dark:text-slate-500">Direct Purchases Settled</span>
                      <span className="font-bold text-rose-500">-{formatCurrency(globalData?.cashFlow?.purchasesPaid ?? 0)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                      <span className="text-slate-450 dark:text-slate-500">Expenses Settled</span>
                      <span className="font-bold text-rose-500">-{formatCurrency(globalData?.cashFlow?.expensesPaid ?? 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-black text-slate-800 dark:text-white">
                      <span>Net Liquidity Margin</span>
                      <span className={globalData?.cashFlow?.netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {formatCurrency(globalData?.cashFlow?.netCashFlow ?? 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SALES & INVOICES */}
        {/* ==================================================== */}
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sales Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SummaryCard
                title="Total Sales"
                value={formatCurrency(salesData?.metrics?.totalSales ?? 0)}
                description="Aggregated Sales Revenue"
                isLoading={salesLoading}
                accentColor="primary"
              />
              <SummaryCard
                title="Cash Transactions"
                value={formatCurrency(salesData?.metrics?.cashSales ?? 0)}
                description="Immediate settling sales"
                isLoading={salesLoading}
                accentColor="success"
              />
              <SummaryCard
                title="Credit Ledger Sales"
                value={formatCurrency(salesData?.metrics?.creditSales ?? 0)}
                description="Invoiced accounts credit"
                isLoading={salesLoading}
                accentColor="warning"
              />
              <SummaryCard
                title="Items Sold"
                value={salesData?.metrics?.itemsSold ?? 0}
                description="Physical stock items delivered"
                isLoading={salesLoading}
                accentColor="info"
              />
              <SummaryCard
                title="Discounts Deducted"
                value={formatCurrency(salesData?.metrics?.discount ?? 0)}
                description="Promotional rebates deducted"
                isLoading={salesLoading}
                accentColor="danger"
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                Filtered sales list includes soft-deleted records exclusions by default.
              </span>
              <ExportMenu
                title="Invoice Register Export"
                headers={['Invoice No', 'Customer Name', 'Sale Date', 'Grand Total', 'Paid Amount', 'Payment Status', 'Payment Method']}
                data={(salesData?.sales || []).map((s: any) => [
                  s.invoiceNumber || s.invoiceNo,
                  s.customerName || 'Walk-in Customer',
                  formatDate(s.saleDate || s.createdAt),
                  formatCurrency(s.grandTotal ?? s.total),
                  formatCurrency(s.paidAmount),
                  s.paymentStatus,
                  s.paymentMethod
                ])}
                summaryData={{
                  Turnover: formatCurrency(salesData?.metrics?.totalSales ?? 0),
                  Invoices: salesData?.metrics?.invoiceCount ?? 0,
                  ItemsSold: salesData?.metrics?.itemsSold ?? 0
                }}
                fileName="sales_invoice_registry"
                onPrint={handlePrint}
              />
            </div>

            {/* Charts & Graphs block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Daily Sales Trend Velocity"
                  description="Velocity line chart of transactions throughout the filtered period."
                  type="area"
                  isLoading={analyticsLoading}
                  data={analyticsData?.trends || []}
                  dataKeys={[{ key: 'sales', label: 'Sales ($)', color: '#10b981' }]}
                />
              </div>
              <div>
                <ChartCard
                  title="Payment Method Shares"
                  description="Division of raw sales revenue across payment terminals."
                  type="donut"
                  isLoading={analyticsLoading}
                  data={(analyticsData?.paymentMethods || []).map((pm: any) => ({
                    name: pm.method,
                    value: pm.salesAmount
                  }))}
                  dataKeys={[{ key: 'value', label: 'Share Value', color: '#6366f1' }]}
                  xKey="name"
                />
              </div>
            </div>

            {/* Top products ranking tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Inventory Items</CardTitle>
                  <CardDescription>Leading products ranked by total volume sold</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2.5">Product Name</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5 text-right">Volume</th>
                          <th className="px-4 py-2.5 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analyticsData?.topSelling || []).slice(0, 5).map((p: any) => (
                          <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/30">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                            <td className="px-4 py-3 font-semibold text-slate-500">{p.sku}</td>
                            <td className="px-4 py-3 text-right font-black">{p.quantity} items</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-500">{formatCurrency(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Profitable Assets</CardTitle>
                  <CardDescription>Ranked by highest cumulative absolute gross profit</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2.5">Product Name</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5 text-right">Selling Price</th>
                          <th className="px-4 py-2.5 text-right">Net Profit Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analyticsData?.topProfitable || []).slice(0, 5).map((p: any) => (
                          <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/30">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                            <td className="px-4 py-3 font-semibold text-slate-500">{p.sku}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(p.revenue / p.quantity)}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-500">{formatCurrency(p.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Detailed Sales Invoices Register</h3>
              <ReportTable<any>
                columns={[
                  { key: 'invoiceNumber', label: 'Invoice Number', render: (val, row: any) => row.invoiceNumber || row.invoiceNo },
                  { key: 'customerName', label: 'Customer', render: (val) => val || 'Walk-in Customer' },
                  { key: 'saleDate', label: 'Invoice Date', render: (val, row: any) => formatDate(val || row.createdAt) },
                  { key: 'paymentMethod', label: 'Payment Method' },
                  { key: 'paymentStatus', label: 'Status', render: (val) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      val === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      val === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                      'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {val}
                    </span>
                  )},
                  { key: 'grandTotal', label: 'Amount', render: (val, row: any) => <span className="font-bold">{formatCurrency(val ?? row.total)}</span> }
                ]}
                data={salesData?.sales || []}
                searchPlaceholder="Search invoices by code, method, or customer..."
                isLoading={salesLoading}
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PURCHASES & SUPPLIERS */}
        {/* ==================================================== */}
        {activeTab === 'purchases' && (
          <div className="space-y-6 animate-fade-in">
            {/* Purchase summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Stock Purchases"
                value={formatCurrency(purchasesData?.metrics?.totalPurchases ?? 0)}
                description="Acquisition spend in period"
                isLoading={purchasesLoading}
                accentColor="primary"
              />
              <SummaryCard
                title="Paid Amount"
                value={formatCurrency(purchasesData?.metrics?.paidAmount ?? 0)}
                description="Paid cash for new stock"
                isLoading={purchasesLoading}
                accentColor="success"
              />
              <SummaryCard
                title="Liability Remaining"
                value={formatCurrency(purchasesData?.metrics?.remainingAmount ?? 0)}
                description="Supplier account outstanding dues"
                isLoading={purchasesLoading}
                accentColor="danger"
              />
              <SummaryCard
                title="Purchase Bills"
                value={purchasesData?.metrics?.purchaseCount ?? 0}
                description="Invoiced bulk supplier deliveries"
                isLoading={purchasesLoading}
                accentColor="info"
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                Monitor balance values on trade credit accounts to manage corporate payment terms.
              </span>
              <ExportMenu
                title="Purchase Ledger Register"
                headers={['Reference No', 'Supplier Name', 'Date', 'Total Amount', 'Paid Amount', 'Remaining Due', 'Payment Status']}
                data={(purchasesData?.purchases || []).map((p: any) => [
                  p.purchaseNumber || p.referenceNo,
                  p.supplierName || `Supplier ID #${p.supplierId}`,
                  formatDate(p.purchaseDate || p.createdAt),
                  formatCurrency(p.grandTotal ?? p.total),
                  formatCurrency(p.paidAmount),
                  formatCurrency(p.remainingAmount ?? ((p.grandTotal ?? p.total) - p.paidAmount)),
                  p.paymentStatus
                ])}
                summaryData={{
                  TotalAcquisitions: formatCurrency(purchasesData?.metrics?.totalPurchases ?? 0),
                  SettledDues: formatCurrency(purchasesData?.metrics?.paidAmount ?? 0),
                  OutstandingDues: formatCurrency(purchasesData?.metrics?.remainingAmount ?? 0)
                }}
                fileName="purchase_inventory_audit"
                onPrint={handlePrint}
              />
            </div>

            {/* Trends & suppliers breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Inventory Acquisition Cost Trend"
                  description="Monthly or daily cost patterns of acquiring bulk warehouse goods."
                  type="bar"
                  isLoading={analyticsLoading}
                  data={analyticsData?.trends || []}
                  dataKeys={[{ key: 'purchases', label: 'Purchased Cost ($)', color: '#6366f1' }]}
                />
              </div>

              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Top Volume Suppliers</CardTitle>
                    <CardDescription>Trading volumes across our registered distributor network</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-64 overflow-y-auto">
                      {(purchasesData?.suppliers || []).slice(0, 5).map((sup: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800/50 text-left text-xs">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{sup.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{sup.count} wholesale invoices</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(sup.amount)}</p>
                            <p className="text-[10px] text-rose-500 mt-0.5">{formatCurrency(sup.remaining)} due</p>
                          </div>
                        </div>
                      ))}
                      {(purchasesData?.suppliers || []).length === 0 && (
                        <div className="p-8 text-center text-slate-400">No Supplier Volumes Registered</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Purchase transactions table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Wholesale Purchases Registry</h3>
              <ReportTable<any>
                columns={[
                  { key: 'purchaseNumber', label: 'Reference No', render: (val, row: any) => row.purchaseNumber || row.referenceNo },
                  { key: 'purchaseDate', label: 'Purchase Date', render: (val, row: any) => formatDate(val || row.createdAt) },
                  { key: 'paymentMethod', label: 'Payment Method' },
                  { key: 'paymentStatus', label: 'Payment Status', render: (val) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      val === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      val === 'Partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                      'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {val}
                    </span>
                  )},
                  { key: 'paidAmount', label: 'Paid', render: (val) => formatCurrency(val) },
                  { key: 'remainingAmount', label: 'Outstanding Balance', render: (val, row: any) => (
                    <span className="font-bold text-rose-500">
                      {formatCurrency(val ?? ((row.grandTotal ?? row.total) - row.paidAmount))}
                    </span>
                  ) },
                  { key: 'total', label: 'Bill Total', render: (val, row: any) => <span className="font-black">{formatCurrency(row.grandTotal ?? val)}</span> }
                ]}
                data={purchasesData?.purchases || []}
                searchPlaceholder="Search purchases by reference, supplier, or method..."
                isLoading={purchasesLoading}
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: EXPENSES AUDIT */}
        {/* ==================================================== */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fade-in">
            {/* Expense cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Operating Expenses"
                value={formatCurrency(expensesData?.metrics?.totalExpenses ?? 0)}
                description="Direct operational bills and cash leaks"
                isLoading={expensesLoading}
                accentColor="danger"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <SummaryCard
                title="Recurring Expenses"
                value={formatCurrency(expensesData?.metrics?.recurringExpenses ?? 0)}
                description="Active monthly/yearly rental and utility subscriptions"
                isLoading={expensesLoading}
                accentColor="purple"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <SummaryCard
                title="Unique Expense Outflow Sectors"
                value={expensesData?.metrics?.categoriesCount ?? 0}
                description="Active expense categories with cash outflows"
                isLoading={expensesLoading}
                accentColor="warning"
                icon={<Percent className="h-5 w-5" />}
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                Operating expenditures must be logged to keep estimated net profitability statements accurate.
              </span>
              <ExportMenu
                title="Operational Expenses Register"
                headers={['Expense No', 'Category Name', 'Title', 'Amount', 'Settlement Date', 'Vendor', 'Status']}
                data={(expensesData?.expenses || []).map((e: any) => [
                  e.expenseNumber,
                  e.category || 'Direct Operational',
                  e.title,
                  formatCurrency(e.amount),
                  formatDate(e.expenseDate || e.createdAt),
                  e.vendorName || '-',
                  e.status
                ])}
                summaryData={{
                  TotalExpenses: formatCurrency(expensesData?.metrics?.totalExpenses ?? 0),
                  RecurringTotal: formatCurrency(expensesData?.metrics?.recurringExpenses ?? 0)
                }}
                fileName="operating_expenses_audit"
                onPrint={handlePrint}
              />
            </div>

            {/* Charts & categories bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <ChartCard
                  title="Expenses by Outflow Categories"
                  description="Share of total spend divided across categories."
                  type="pie"
                  isLoading={expensesLoading}
                  data={(expensesData?.categories || []).map((cat: any) => ({
                    name: cat.name,
                    value: cat.amount
                  }))}
                  dataKeys={[{ key: 'value', label: 'Amount Spend', color: '#6366f1' }]}
                  xKey="name"
                />
              </div>

              <div className="lg:col-span-2">
                <Card className="h-full text-left">
                  <CardHeader>
                    <CardTitle>Spending by Recipient Vendor Accounts</CardTitle>
                    <CardDescription>Major payees absorbing store operational capital</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                            <th className="px-4 py-2.5">Vendor Name</th>
                            <th className="px-4 py-2.5 text-right">Transactions</th>
                            <th className="px-4 py-2.5 text-right">Aggregated Outflow</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(expensesData?.vendors || []).slice(0, 5).map((v: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/30">
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{v.vendor}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-400">{v.count} bills logged</td>
                              <td className="px-4 py-3 text-right font-black text-rose-500">{formatCurrency(v.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Expenses ledger table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Detailed Expenditures Register</h3>
              <ReportTable
                columns={[
                  { key: 'expenseNumber', label: 'Bill No' },
                  { key: 'title', label: 'Title / Purpose' },
                  { key: 'category', label: 'Operating Category', render: (val, row) => val || 'Direct Bill' },
                  { key: 'expenseDate', label: 'Expense Date', render: (val) => formatDate(val) },
                  { key: 'paymentMethod', label: 'Payment Channel' },
                  { key: 'status', label: 'Status', render: (val) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      val === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      val === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                      'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {val}
                    </span>
                  )},
                  { key: 'amount', label: 'Amount Spent', render: (val) => <span className="font-black text-rose-500">{formatCurrency(val)}</span> }
                ]}
                data={expensesData?.expenses || []}
                searchPlaceholder="Search bills by vendor, code, title or status..."
                isLoading={expensesLoading}
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: ACCOUNTS CREDIT */}
        {/* ==================================================== */}
        {activeTab === 'credit' && (
          <div className="space-y-6 animate-fade-in">
            {/* Credit summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <SummaryCard
                title="Durable Active Credit Assets"
                value={formatCurrency(creditData?.metrics?.outstandingCredit ?? 0)}
                description="Total credit currently active on customer ledgers"
                isLoading={creditLoading}
                accentColor="warning"
                icon={<CreditCard className="h-5 w-5" />}
              />
              <SummaryCard
                title="Recovered Dues (This Period)"
                value={formatCurrency(creditData?.metrics?.recoveredCredit ?? 0)}
                description="Credit payments collected"
                isLoading={creditLoading}
                accentColor="success"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <SummaryCard
                title="Overdue Accounts"
                value={creditData?.metrics?.overdueAccounts ?? 0}
                description="Active outstanding invoice accounts past due limits"
                isLoading={creditLoading}
                accentColor="danger"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <SummaryCard
                title="Overdue Credit Liability"
                value={formatCurrency(creditData?.metrics?.overdueCredit ?? 0)}
                description="Aggregate amount under overdue warning status"
                isLoading={creditLoading}
                accentColor="danger"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                Regularly verify overdue credit sheets to initiate recovery processes.
              </span>
              <ExportMenu
                title="Customer Credit Liability Statement"
                headers={['Customer Name', 'Outstanding Ledger', 'Dues Recovered (Range)', 'Ledger Paid Total', 'Total Initial Credit']}
                data={(creditData?.ledgerSummary || []).map((l: any) => [
                  l.name,
                  formatCurrency(l.remaining),
                  formatCurrency(l.recoveredInRange),
                  formatCurrency(l.paid),
                  formatCurrency(l.initialCredit)
                ])}
                summaryData={{
                  OutstandingLedger: formatCurrency(creditData?.metrics?.outstandingCredit ?? 0),
                  RecoveredCredit: formatCurrency(creditData?.metrics?.recoveredCredit ?? 0),
                  OverdueLiability: formatCurrency(creditData?.metrics?.overdueCredit ?? 0)
                }}
                fileName="customer_credit_liability_report"
                onPrint={handlePrint}
              />
            </div>

            {/* Overdue Accounts Warnings Panel */}
            {creditData?.overdueAccounts?.length > 0 && (
              <Card borderAccent accentColor="danger" className="animate-pulse">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <CardTitle className="text-sm font-black text-rose-600 dark:text-rose-400">Critical Overdue Account Warnings</CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-52 overflow-y-auto">
                  {creditData.overdueAccounts.map((acc: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-5 py-3 border-b border-rose-100/30 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{acc.customerName} ({acc.phone})</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Invoice: {acc.invoiceNumber}  |  Dues Date: {formatDate(acc.dueDate)}</p>
                      </div>
                      <div className="text-right mt-1 sm:mt-0 font-bold">
                        <span className="text-rose-600">{formatCurrency(acc.balance)} overdue</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Bill: {formatCurrency(acc.amount)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Credit ledger ledger table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Customer Account Credit Ledger Summaries</h3>
              <ReportTable
                columns={[
                  { key: 'name', label: 'Customer Name' },
                  { key: 'phone', label: 'Contact Phone' },
                  { key: 'initialCredit', label: 'Total Initial Credit Borrowed', render: (val) => formatCurrency(val) },
                  { key: 'paid', label: 'Historical Settled Payments', render: (val) => formatCurrency(val) },
                  { key: 'recoveredInRange', label: 'Dues Recovered (Range)', render: (val) => <span className="font-black text-emerald-500">{formatCurrency(val)}</span> },
                  { key: 'remaining', label: 'Durable Ledger Balance Dues', render: (val) => <span className="font-bold text-rose-500">{formatCurrency(val)}</span> }
                ]}
                data={creditData?.ledgerSummary || []}
                searchPlaceholder="Search customer accounts ledger..."
                isLoading={creditLoading}
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: STOCK & INVENTORY */}
        {/* ==================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stock metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <SummaryCard
                title="Durable Asset Stock Value"
                value={formatCurrency(stockData?.metrics?.stockValue ?? 0)}
                description="Acquisition cost valuation of warehouse stock"
                isLoading={stockLoading}
                accentColor="primary"
                icon={<Package className="h-5 w-5" />}
              />
              <SummaryCard
                title="Registered Products"
                value={stockData?.metrics?.totalProducts ?? 0}
                description="Unique product units managed"
                isLoading={stockLoading}
                accentColor="info"
                icon={<ClipboardList className="h-5 w-5" />}
              />
              <SummaryCard
                title="Items Out of Stock"
                value={stockData?.metrics?.outOfStock ?? 0}
                description="Items currently at zero level"
                isLoading={stockLoading}
                accentColor="danger"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <SummaryCard
                title="Critically Low Stock"
                value={stockData?.metrics?.lowStock ?? 0}
                description="Items at or below alert thresholds"
                isLoading={stockLoading}
                accentColor="warning"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            {/* Print Export Action Box (hidden during print) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                Asset valuation calculations reflect cost evaluation based on the last registered purchase prices.
              </span>
              <ExportMenu
                title="Warehouse Asset Stock Report"
                headers={['Category Name', 'Products Registered', 'Total Stock Quantity', 'Estimated Asset Value']}
                data={(stockData?.categoryDistribution || []).map((c: any) => [
                  c.category,
                  c.count,
                  c.qty,
                  formatCurrency(c.value)
                ])}
                summaryData={{
                  DurableAssetValuation: formatCurrency(stockData?.metrics?.stockValue ?? 0),
                  RegisteredUnits: stockData?.metrics?.totalProducts ?? 0
                }}
                fileName="warehouse_asset_valuation_statement"
                onPrint={handlePrint}
              />
            </div>

            {/* Category distributions & stock warnings layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <ChartCard
                  title="Stock Asset Value Shares"
                  description="Division of total capital locked in stock across categories."
                  type="donut"
                  isLoading={stockLoading}
                  data={(stockData?.categoryDistribution || []).map((cat: any) => ({
                    name: cat.category,
                    value: cat.value
                  }))}
                  dataKeys={[{ key: 'value', label: 'Valuation ($)', color: '#8b5cf6' }]}
                  xKey="name"
                />
              </div>

              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div>
                      <CardTitle>Restock & Order Threshold Warning Sheet</CardTitle>
                      <CardDescription>Items at risk of depletion. Settle purchase agreements.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-64 overflow-y-auto">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                            <th className="px-4 py-2.5">Product Asset</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5 text-right">Current Level</th>
                            <th className="px-4 py-2.5 text-right">Min Threshold</th>
                            <th className="px-4 py-2.5 text-right">Depletion status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stockData?.lowStockList || []).map((p: any) => (
                            <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/30">
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{p.name} ({p.sku})</td>
                              <td className="px-4 py-3 font-semibold text-slate-450">{p.category}</td>
                              <td className="px-4 py-3 text-right font-black">{p.stock} units</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-400">{p.minStock} units</td>
                              <td className="px-4 py-3 text-right font-black">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  p.stock === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(stockData?.lowStockList || []).length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400">All Product Levels are Balanced & Healthy</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Category stocks overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Structured Category Assets Breakdown</h3>
              <ReportTable
                columns={[
                  { key: 'category', label: 'Category Sector Name' },
                  { key: 'count', label: 'Unique Products Registered', render: (val) => <span className="font-bold">{val} items</span> },
                  { key: 'qty', label: 'Aggregated Stock Inventory Level', render: (val) => <span className="font-bold">{val} total units</span> },
                  { key: 'value', label: 'Cost Valuation Share', render: (val) => <span className="font-black text-emerald-500">{formatCurrency(val)}</span> }
                ]}
                data={stockData?.categoryDistribution || []}
                searchPlaceholder="Search category inventories..."
                isLoading={stockLoading}
              />
            </div>
          </div>
        )}

        {/* Printable Footer Decoration (Only visible on browser print) */}
        <div className="hidden print:block text-center border-t border-slate-200 pt-6 mt-8 text-[10px] text-slate-500">
          <p>This document is an official operational registry extract retrieved directly from active local offline IndexedDB databases.</p>
          <p className="mt-1">ShopCraft Management & Analytics Platform © {new Date().getFullYear()}  |  All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default Reports;
