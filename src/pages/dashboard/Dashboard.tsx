import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Brush, Treemap
} from 'recharts';
import { 
  Sparkles, RefreshCw, FileText,
  Layers, Wallet, TrendingUp, AlertTriangle,
  Scale, Users, Clock, ArrowUpRight,
  PackageOpen, LayoutDashboard,
  FileDown, Printer, X
} from 'lucide-react';
import { usePDF } from '../../hooks/usePDF';
import { AIReportService } from '../../services/aiReport/AIReportService';
import { AiInteractiveDashboard } from '../../components/AiInteractiveDashboard';
import { type AIReportInsights } from '../../services/aiReport/BusinessInsightGenerator';
import { db } from '../../database/db';
import { seedDemoData } from '../../database/dbSeeder';
import { calculateBiDashboard } from '../../utils/biCalculations';
import { formatCurrency } from '../../utils/helpers';

// Modular Elements
import { ChartContainer } from '../../components/dashboard/ChartContainer';
import { PowerBiGauges } from '../../components/dashboard/PowerBiGauges';
import { calculatePowerBiMetrics } from '../../utils/dashboardCalculations';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { BiFilters } from '../../components/dashboard/BiFilters';
import { BiInsights } from '../../components/dashboard/BiInsights';
import { BiKpiGrid } from '../../components/dashboard/BiKpiGrid';
import { BiLedgerTable } from '../../components/dashboard/BiLedgerTable';

const POWERBI_PALETTE = ['#118DFF', '#12BF3F', '#12239E', '#E66C37', '#E0400A', '#A6A6A6', '#4f46e5', '#f59e0b'];

const DEFAULT_FILTERS = {
  dateRange: 'month' as const,
  startDate: '',
  endDate: '',
  paymentMethod: 'All',
  category: 'All',
  customer: 'All',
  supplier: 'All'
};

export const Dashboard: React.FC = () => {
  const [biFilters, setBiFilters] = useState(DEFAULT_FILTERS);
  const { generateDashboard, isGenerating: isPdfLoading } = usePDF();

  // DB Table lists states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [creditPayments, setCreditPayments] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'sales' | 'financials' | 'credit' | 'inventory'>('overview');

  // AI Business Report states
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);
  const [isAiReportLoading, setIsAiReportLoading] = useState(false);
  const [aiReportPreviewUrl, setAiReportPreviewUrl] = useState<string | null>(null);
  const [aiReportError, setAiReportError] = useState<string | null>(null);
  const [aiReportInsights, setAiReportInsights] = useState<AIReportInsights | null>(null);
  const [aiReportViewMode, setAiReportViewMode] = useState<'interactive' | 'pdf'>('interactive');

  // Load raw DB arrays
  const fetchAndProcessData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        allProducts,
        allCategories,
        allCustomers,
        allSuppliers,
        allSales,
        allSaleItems,
        allPurchases,
        allExpenses,
        allCreditPayments,
        allExpenseCategories
      ] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray(),
        db.customers.toArray(),
        db.suppliers.toArray(),
        db.sales.toArray(),
        db.saleItems.toArray(),
        db.purchases.toArray(),
        db.expenses.toArray(),
        db.creditPayments.toArray(),
        db.expenseCategories.toArray()
      ]);

      setProducts(allProducts);
      setCategories(allCategories);
      setCustomers(allCustomers);
      setSuppliers(allSuppliers);
      setSales(allSales);
      setSaleItems(allSaleItems);
      setPurchases(allPurchases);
      setExpenses(allExpenses);
      setCreditPayments(allCreditPayments);
      setExpenseCategories(allExpenseCategories);
    } catch (err) {
      console.error('Error fetching database lists', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  // Seeding support
  const handleSeedData = async () => {
    try {
      setIsDemoLoading(true);
      await seedDemoData();
      await fetchAndProcessData();
    } catch (err) {
      console.error('Error seeding database', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // 1. Calculate Standard BI Data (Period filtered) with correct object parameter shape
  const biData = useMemo(() => {
    return calculateBiDashboard({
      allProducts: products,
      allCategories: categories,
      allCustomers: customers,
      allSuppliers: suppliers,
      allSales: sales,
      allSaleItems: saleItems,
      allPurchases: purchases,
      allExpenses: expenses,
      allCreditPayments: creditPayments,
      allExpenseCategories: expenseCategories,
      filterPreset: biFilters.dateRange,
      customStartDate: biFilters.startDate,
      customEndDate: biFilters.endDate,
      slicers: {
        paymentMethod: biFilters.paymentMethod,
        categoryId: biFilters.category,
        customerId: biFilters.customer,
        supplierId: biFilters.supplier
      }
    });
  }, [
    biFilters,
    products,
    categories,
    customers,
    suppliers,
    sales,
    saleItems,
    purchases,
    expenses,
    creditPayments,
    expenseCategories
  ]);

  // 2. Calculate Power BI Extra Metrics
  const powerBiMetrics = useMemo(() => {
    if (!biData) return null;
    return calculatePowerBiMetrics(
      products,
      categories,
      customers,
      suppliers,
      sales,
      purchases,
      expenses,
      creditPayments,
      expenseCategories,
      biData
    );
  }, [
    products,
    categories,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    creditPayments,
    expenseCategories,
    biData
  ]);

  // Executive Executive PDF Exporter
  const handleExportFullPdfReport = () => {
    if (!biData) return;
    const metricsForPdf = {
      todaySales: biData.kpis.todaySales?.numericValue || 0,
      todayProfit: biData.kpis.todayProfit?.numericValue || 0,
      todayPurchases: biData.kpis.todayPurchases?.numericValue || 0,
      todayExpenses: biData.kpis.todayExpenses?.numericValue || 0,
      outstandingCredit: biData.kpis.outstandingCredit?.numericValue || 0,
      recoveredCredit: biData.kpis.creditRecovered?.numericValue || 0,
      cashInHand: biData.kpis.cashInHand?.numericValue || 0,
      stockValue: biData.kpis.inventoryValue?.numericValue || 0,
    };
    generateDashboard(metricsForPdf, biData.inventoryAnalytics.fastMoving);
  };

  // AI Business Report Orchestrators
  const handleTriggerAiReport = async () => {
    setIsAiReportModalOpen(true);
    setIsAiReportLoading(true);
    setAiReportError(null);
    setAiReportPreviewUrl(null);
    setAiReportInsights(null);
    setAiReportViewMode('interactive');
    try {
      const result = await AIReportService.generateReportAndInsights('preview');
      setAiReportPreviewUrl(result.previewUrl);
      setAiReportInsights(result.insights);
    } catch (err: any) {
      setAiReportError(err?.message || 'Failed to generate AI Business Intelligence Report.');
    } finally {
      setIsAiReportLoading(false);
    }
  };

  const handleDownloadAiReport = async () => {
    try {
      await AIReportService.generateReport('download');
    } catch (err: any) {
      console.error('Download failed', err);
    }
  };

  const handlePrintAiReport = async () => {
    try {
      await AIReportService.generateReport('print');
    } catch (err: any) {
      console.error('Print failed', err);
    }
  };

  const isDbEmpty = products.length === 0 && sales.length === 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950/40 min-h-screen">
      
      {/* Dynamic Header */}
      <DashboardHeader />

      {/* Database Empty States */}
      {isDbEmpty && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-center shadow-sm max-w-2xl mx-auto flex flex-col items-center gap-4 mt-6"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <LayoutDashboard className="h-8 w-8 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Dashboard Database Empty
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
              Your indexed retail inventory and checkout receipt log records are currently clear. Seed demo data to preview active charts immediately.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={isDemoLoading}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isDemoLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Seeding Retail Records...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Seed Demonstration Database
              </>
            )}
          </button>
        </motion.div>
      )}

      {!isDbEmpty && biData && powerBiMetrics && (
        <>
          {/* Top Level Filter Slicers Bar */}
          <BiFilters 
            filters={biFilters} 
            onChange={setBiFilters}
            categories={categories}
            customers={customers}
            suppliers={suppliers}
            paymentMethods={biData?.paymentMethods || ['Cash', 'Card', 'Credit', 'Bank Transfer']}
          />

          {/* Microsoft Power BI Desktop Tab Navigator */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/50 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-900">
              {(['overview', 'sales', 'financials', 'credit', 'inventory'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveReportTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                    activeReportTab === tab
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'overview' && (
                    <>
                      <LayoutDashboard className="h-3.5 w-3.5 stroke-[2]" />
                      Executive Overview
                    </>
                  )}
                  {tab === 'sales' && (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 stroke-[2]" />
                      Sales & Revenue
                    </>
                  )}
                  {tab === 'financials' && (
                    <>
                      <Wallet className="h-3.5 w-3.5 stroke-[2]" />
                      Financials & Profits
                    </>
                  )}
                  {tab === 'credit' && (
                    <>
                      <Scale className="h-3.5 w-3.5 stroke-[2]" />
                      Credit & Collections
                    </>
                  )}
                  {tab === 'inventory' && (
                    <>
                      <PackageOpen className="h-3.5 w-3.5 stroke-[2]" />
                      Inventory & Sourcing
                    </>
                  )}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-850 mx-2" />

              {/* PDF report exports button */}
              <button
                onClick={handleExportFullPdfReport}
                disabled={isPdfLoading}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                {isPdfLoading ? 'Exporting...' : 'Export PDF Executive Report'}
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-850 mx-1" />

              {/* AI Business Report button */}
              <button
                onClick={handleTriggerAiReport}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                AI Business Report
              </button>
            </div>
          </div>

          {/* Dynamic Report Pages Layout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReportTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              
              {/* PAGE 1: EXECUTIVE OVERVIEW */}
              {activeReportTab === 'overview' && (
                <>
                  {/* Top KPI Cards Grid */}
                  <BiKpiGrid kpis={biData.kpis} />

                  {/* 4 Gauge charts section */}
                  <PowerBiGauges
                    salesTargetProgress={powerBiMetrics.salesProgress}
                    salesValue={biData.kpis.todaySales?.numericValue || 0}
                    profitGoalProgress={powerBiMetrics.profitGoalProgress}
                    profitValue={biData.kpis.todayProfit?.numericValue || 0}
                    creditRecoveryProgress={powerBiMetrics.creditRecoveryProgress}
                    creditRecoveredValue={biData.kpis.creditRecovered?.numericValue || 0}
                    creditIssuedValue={(biData.kpis.outstandingCredit?.numericValue || 0) + (biData.kpis.creditRecovered?.numericValue || 0)}
                    inventoryHealthProgress={powerBiMetrics.inventoryHealthProgress}
                    inStockItems={products.filter(p => (p.stock ?? p.currentStock ?? 0) > 0).length}
                    totalItems={products.length}
                  />

                  {/* Operational Core charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart 1: Daily Sales Trend */}
                    <div className="lg:col-span-2">
                      <ChartContainer
                        id="dailySalesTrend"
                        title="Daily Sales Trend & Velocity"
                        description="Historical progression of sales transactions and gross margins"
                      >
                        {(isZoomed) => (
                          <ResponsiveContainer width="100%" height={230}>
                            <AreaChart data={biData.charts.dailySalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#118DFF" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#118DFF" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Legend wrapperStyle={{ fontSize: '10px' }} />
                              <Area type="monotone" name="Sales Revenue" dataKey="sales" stroke="#118DFF" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                              {isZoomed && <Brush dataKey="label" height={18} stroke="#118DFF" />}
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 8: Payment Method Distribution */}
                    <div>
                      <ChartContainer
                        id="paymentMethodDist"
                        title="Payment Option Distribution"
                        description="Share of checkout register payment choices"
                        allowZoom={false}
                      >
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                              <Pie
                                data={biData.charts.paymentMethodDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {biData.charts.paymentMethodDistribution.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={POWERBI_PALETTE[index % POWERBI_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Legend wrapperStyle={{ fontSize: '9px' }} layout="horizontal" align="center" verticalAlign="bottom" />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                  </div>

                  {/* Cash Flow Waterfall & Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart 19: Cash Flow */}
                    <div className="lg:col-span-2">
                      <ChartContainer
                        id="cashFlowWaterfall"
                        title="Cash Flow Waterfall"
                        description="Inflows and outflows running through the retail working register"
                        allowZoom={false}
                      >
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={powerBiMetrics.cashFlowWaterfall} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Bar dataKey="value" name="Register Flow Amount">
                                {powerBiMetrics.cashFlowWaterfall.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Operational Activities Feed Panel */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm text-left flex flex-col h-full max-h-[340px]">
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                          <Clock className="h-4.5 w-4.5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">
                            Recent Store Activities
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400">Ticking register events ledger</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                        {powerBiMetrics.recentActivities.map((act) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs leading-normal">
                            <span className={`px-2 py-1 rounded-lg border font-black text-[9px] uppercase shrink-0 ${act.color}`}>
                              {act.type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-extrabold text-slate-700 dark:text-slate-350 block truncate tracking-tight">{act.title}</span>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{act.description}</p>
                            </div>
                            <span className="font-black text-slate-800 dark:text-slate-200 shrink-0 text-right">{formatCurrency(act.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 8 Small KPI Widgets */}
                  <BiInsights insights={biData.insights} />
                </>
              )}

              {/* PAGE 2: SALES & REVENUE */}
              {activeReportTab === 'sales' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Top Sales KPI Cards */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Today's Sales Revenue</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{biData.kpis.todaySales?.val}</span>
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3.5 w-3.5" /> High volume checkout
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Completed Invoices</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{biData.kpis.todayInvoices?.val}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">Receipt collections checked</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Patron Accounts</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{customers.length} VIPs</span>
                      <span className="text-[10px] text-indigo-500 font-bold mt-1">Active customer bases</span>
                    </div>
                  </div>

                  {/* Visual Charts section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart 1: Daily Sales Trend */}
                    <div className="lg:col-span-2">
                      <ChartContainer id="dailySalesRev" title="Daily Revenue Velocity" description="Detailed daily invoice checkout progress">
                        {(isZoomed) => (
                          <ResponsiveContainer width="100%" height={230}>
                            <AreaChart data={biData.charts.dailySalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Area type="monotone" name="Sales Volume" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.08} />
                              {isZoomed && <Brush dataKey="label" height={18} stroke="#10b981" />}
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 10: Best Selling Categories */}
                    <div>
                      <ChartContainer id="bestCategories" title="Best Selling Categories" description="Category-level gross sales share" allowZoom={false}>
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                              <Pie
                                data={biData.charts.topCategories}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={false}
                              >
                                {biData.charts.topCategories.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={POWERBI_PALETTE[index % POWERBI_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 2: Weekly Sales */}
                    <div>
                      <ChartContainer id="weeklySales" title="Weekly Revenue Runrate" description="Sales aggregated on weekly intervals" allowZoom={false}>
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={biData.charts.weeklySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Bar dataKey="sales" name="Weekly Revenue" fill="#118DFF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 3: Monthly Sales */}
                    <div>
                      <ChartContainer id="monthlySales" title="Monthly Sales Runrate" description="Sales aggregated on calendar months" allowZoom={false}>
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <AreaChart data={biData.charts.monthlySales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Area type="monotone" name="Monthly Sales" dataKey="sales" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.08} strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 15: Sales by Hour */}
                    <div>
                      <ChartContainer id="salesByHour" title="Sales by Hour (Hourly peak)" description="Store visitor peak shopping hours" allowZoom={false}>
                        {() => (
                          <ResponsiveContainer width="100%" height={230}>
                            <LineChart data={powerBiMetrics.salesByHour} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={8} />
                              <YAxis stroke="#94a3b8" fontSize={8} />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Line type="monotone" name="Sales (PKR)" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                    {/* Chart 9: Best Selling Products */}
                    <div className="lg:col-span-3">
                      <ChartContainer id="bestSellingProducts" title="Top Performing Catalog Products" description="Product unit volume leaders" allowZoom={false}>
                        {() => (
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={biData.inventoryAnalytics.fastMoving} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                              <Bar dataKey="quantity" name="Units Sold" fill="#118DFF" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </div>

                  </div>
                </>
              )}

              {/* PAGE 3: FINANCIALS & PROFIT */}
              {activeReportTab === 'financials' && (
                <>
                  {/* Financial core combo and area graphs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Chart 5: Profit vs Expenses */}
                    <ChartContainer id="profitVsExpenses" title="Profit vs Operating Expenses" description="Combo reporting of gross profitability gains and expensed outlays">
                      {(isZoomed) => (
                        <ResponsiveContainer width="100%" height={240}>
                          <ComposedChart data={powerBiMetrics.profitVsExpenses} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                            <Bar dataKey="expenses" name="Operating Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} />
                            {isZoomed && <Brush dataKey="label" height={18} stroke="#10b981" />}
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 20: Monthly Profit Trend */}
                    <ChartContainer id="monthlyProfitTrend" title="Monthly Net Profit Margins" description="Normalized area projection of retail profitability runrates" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={powerBiMetrics.monthlyProfitTrend} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Area type="monotone" name="Estimated Net Margin" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 13: Purchases by Supplier */}
                    <ChartContainer id="supplierPurchases" title="Supplier Outflow Volume" description="Goods acquired and purchases cost grouped by supplier entities" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={230}>
                          <BarChart data={powerBiMetrics.purchasesBySupplier} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Bar dataKey="purchases" name="Purchases Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 14: Monthly Expenses by Category */}
                    <ChartContainer id="expensesByCategory" title="Monthly Operating Expense Slices" description="Operating capital outlays broken down by ledger category" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={230}>
                          <PieChart>
                            <Pie
                              data={powerBiMetrics.expensesByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {powerBiMetrics.expensesByCategory.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={POWERBI_PALETTE[index % POWERBI_PALETTE.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} layout="horizontal" align="center" verticalAlign="bottom" />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                  </div>
                </>
              )}

              {/* PAGE 4: CREDIT & DEBT COLLECTION */}
              {activeReportTab === 'credit' && (
                <>
                  {/* Debt ledger outstanding kpis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Outstanding Accounts Receivable</span>
                      <span className="text-xl font-black text-rose-500 mt-1">{biData.kpis.outstandingCredit?.val}</span>
                      <span className="text-[10px] text-rose-400 font-bold mt-1">Outstanding customer loans</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Recovered Customer Credits</span>
                      <span className="text-xl font-black text-emerald-500 mt-1">{biData.kpis.creditRecovered?.val}</span>
                      <span className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Collection recovery active
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm text-center">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Debt Collection Rate</span>
                      <span className="text-xl font-black text-violet-600 mt-1">{powerBiMetrics.creditRecoveryProgress.toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">Collection recovery efficiency</span>
                    </div>
                  </div>

                  {/* Visual Credit Graphs section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Chart 6: Customer Credit vs Credit Recovered */}
                    <ChartContainer id="creditVsRecovered" title="Customer Credit vs Recoveries" description="Clustered visual audit of total loan liabilities and collections" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={powerBiMetrics.creditVsRecovered} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                            <Bar dataKey="issued" name="Credit Issued" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="recovered" name="Credit Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 17: Customer Loan Aging */}
                    <ChartContainer id="loanAging" title="Accounts Receivable (Loan Aging Brackets)" description="Unpaid invoice customer liabilities staggered by time brackets" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={powerBiMetrics.loanAging} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                            <Bar stackId="a" dataKey="0-30 Days" fill="#10b981" />
                            <Bar stackId="a" dataKey="31-60 Days" fill="#f59e0b" />
                            <Bar stackId="a" dataKey="61-90 Days" fill="#ef4444" />
                            <Bar stackId="a" dataKey="90+ Days" fill="#b91c1c" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 7: Outstanding Credit by Customer */}
                    <ChartContainer id="outstandingCredit" title="Outstanding Liabilities by Customer" description="Concentration of due accounts receivable balances" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={powerBiMetrics.customerCreditTable.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Bar dataKey="remaining" name="Debt Balance" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 18: Credit Collection Trend */}
                    <ChartContainer id="creditRecoveryTrend" title="Credit Collection Timeline" description="Daily collections progression of recovered funds">
                      {(isZoomed) => (
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={biData.charts.creditRecoveryTrend} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Line type="monotone" name="Collections (PKR)" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
                            {isZoomed && <Brush dataKey="label" height={18} stroke="#8b5cf6" />}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                  </div>

                  {/* Customer Credit Debtors detail table list */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                        <Users className="h-4.5 w-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">
                          Active Accounts Receivable Ledger
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">Detailed debtor lists tracking remaining liabilities</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                            <th className="p-3">Customer Name</th>
                            <th className="p-3">Phone Line</th>
                            <th className="p-3 text-right">Total Liabilities</th>
                            <th className="p-3 text-right">Recovered Credit</th>
                            <th className="p-3 text-right">Remaining Balances</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850/45 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {powerBiMetrics.customerCreditTable.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10">
                              <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">{row.name}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-450">{row.phone}</td>
                              <td className="p-3 text-right text-slate-700 dark:text-slate-350">{formatCurrency(row.outstanding)}</td>
                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.recovered)}</td>
                              <td className="p-3 text-right font-black text-rose-500">{formatCurrency(row.remaining)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* PAGE 5: INVENTORY & SOURCING */}
              {activeReportTab === 'inventory' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Chart 11: Inventory Status Category Stacked */}
                    <ChartContainer id="inventoryStatus" title="Inventory Category SKU Levels" description="SKU count breakdown per category stacked by level" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={powerBiMetrics.categoryInventoryStatus} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                            <Bar stackId="a" dataKey="In Stock" fill="#10b981" />
                            <Bar stackId="a" dataKey="Low Stock" fill="#f59e0b" />
                            <Bar stackId="a" dataKey="Out of Stock" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                    {/* Chart 12: Stock Value by Category Treemap */}
                    <ChartContainer id="stockValueCategory" title="Warehouse Assets Capital Distribution" description="Absolute cost-weighted inventory valuation aggregated per category" allowZoom={false}>
                      {() => (
                        <ResponsiveContainer width="100%" height={240}>
                          <Treemap
                            data={powerBiMetrics.categoryStockVal}
                            dataKey="value"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#118DFF"
                          >
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} formatter={(val) => formatCurrency(Number(val))} />
                          </Treemap>
                        </ResponsiveContainer>
                      )}
                    </ChartContainer>

                  </div>

                  {/* Low stock indicators lists table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                        <AlertTriangle className="h-4.5 w-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase tracking-tight">
                          Critical Low Stock Catalog Alert (Reorder Table)
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">Products that fell below safety stock alerts and require restocking</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                            <th className="p-3">Product Catalog Item</th>
                            <th className="p-3 text-right">Alert Quantity Threshold</th>
                            <th className="p-3 text-right">Current Units remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850/45 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {powerBiMetrics.lowStockTable.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-rose-50/10 dark:hover:bg-rose-950/5">
                              <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">{row.name}</td>
                              <td className="p-3 text-right text-slate-450">{row.alertQuantity} units</td>
                              <td className="p-3 text-right font-black text-rose-500 bg-rose-50/10">{row.stock} remaining</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Interactive Multi-Tab Transaction Logs Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm mt-6">
            <BiLedgerTable
              sales={biData.salesLedger}
              purchases={biData.purchasesLedger}
              expenses={biData.expensesLedger}
              creditPayments={biData.creditPaymentsLedger}
            />
          </div>
        </>
      )}

      {/* AI Business Report Modal */}
      <AnimatePresence>
        {isAiReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      AI Business Intelligence Report Generator
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      10-Page Power BI style executive report compiling sales, stock asset status & credit histories
                    </p>
                  </div>
                </div>

                {/* View Mode Switcher */}
                {!isAiReportLoading && !aiReportError && aiReportInsights && (
                  <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => setAiReportViewMode('interactive')}
                      className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                        aiReportViewMode === 'interactive'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                      }`}
                    >
                      Interactive BI Dashboard
                    </button>
                    <button
                      onClick={() => setAiReportViewMode('pdf')}
                      className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                        aiReportViewMode === 'pdf'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                      }`}
                    >
                      PDF Document View (10p)
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAiReport}
                    disabled={isAiReportLoading || !!aiReportError}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/10 transition-all"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download PDF
                  </button>

                  <button
                    onClick={handlePrintAiReport}
                    disabled={isAiReportLoading || !!aiReportError}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 disabled:opacity-50 text-[10px] font-black text-slate-750 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Report
                  </button>

                  <button
                    onClick={() => {
                      setIsAiReportModalOpen(false);
                      setAiReportPreviewUrl(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content / Previewer */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                {isAiReportLoading && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                      AI systems executing deep retail asset analysis...
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 max-w-xs">
                      Computing health indicators, reorder points, credit collections & drawing multi-panel vector charts.
                    </p>
                  </div>
                )}

                {aiReportError && (
                  <div className="flex flex-col items-center gap-3 text-center p-6">
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-2xl">
                      <X className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                      System diagnostics failure
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 max-w-sm">
                      {aiReportError}
                    </p>
                  </div>
                )}

                {!isAiReportLoading && !aiReportError && (
                  <div className="w-full h-full flex flex-col overflow-hidden">
                    {aiReportViewMode === 'interactive' && aiReportInsights ? (
                      <AiInteractiveDashboard insights={aiReportInsights} />
                    ) : (
                      aiReportPreviewUrl && (
                        <iframe
                          src={aiReportPreviewUrl}
                          className="w-full h-full border-none"
                          title="AI Business Intelligence Report Preview"
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
