import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, DollarSign, Package, Users, Percent, 
  ShoppingBag, Award, ShieldAlert, ListPlus, Clock, ArrowUpRight, 
  PieChart, Activity, FileText, Lightbulb, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight, CornerDownRight, BarChart3, HelpCircle as HelpIcon
} from 'lucide-react';
import { type AIReportInsights } from '../services/aiReport/BusinessInsightGenerator';

interface AiInteractiveDashboardProps {
  insights: AIReportInsights;
}

export const AiInteractiveDashboard: React.FC<AiInteractiveDashboardProps> = ({ insights }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'credit' | 'bi' | 'roadmap'>('overview');

  const fmt = (val: number) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPriorityBadgeClass = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
      case 'Medium':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'Low':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-3 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Interactive Viewports</span>
        </div>

        {[
          { id: 'overview', label: 'Executive Overview', icon: FileText, desc: 'Core KPIs & Health Index' },
          { id: 'sales', label: 'Sales & Purchases', icon: TrendingUp, desc: 'Revenue speedways & channels' },
          { id: 'inventory', label: 'Inventory Health', icon: Package, desc: 'Stock assets & velocities' },
          { id: 'credit', label: 'Credit & Expenses', icon: Users, desc: 'Collections & cost centers' },
          { id: 'bi', label: 'System BI Diagnostics', icon: PieChart, desc: 'turnover & micro-metrics' },
          { id: 'roadmap', label: 'Strategic Roadmap', icon: Lightbulb, desc: 'AI action plan & matrix' }
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <div className="text-left leading-none">
                <p className="text-[11px] font-extrabold uppercase tracking-wide">{tab.label}</p>
                <p className={`text-[8.5px] mt-0.5 hidden md:block font-medium ${isActive ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
        
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Health Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">AI Narrative Briefing</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2 uppercase tracking-tight">Executive Narrative Analysis</h4>
                  <p className="text-[12px] font-bold text-slate-400 mt-1">
                    System Periodicity: {insights.metadata.reportPeriod}
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 mt-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    {insights.metadata.executiveSummary}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    COMPILED: {insights.metadata.generatedDate}
                  </span>
                  <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    ANALYST: {insights.metadata.preparedBy}
                  </span>
                </div>
              </div>

              {/* Health Score Circular Gauge */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Store Solvency Health</span>
                
                {/* Visual Gauge */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36">
                    <circle 
                      cx="72" cy="72" r="60" 
                      className="text-slate-100 dark:text-slate-800 stroke-current" 
                      strokeWidth="10" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="72" cy="72" r="60" 
                      className="text-indigo-600 dark:text-indigo-500 stroke-current" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray="377" 
                      strokeDashoffset={377 - (377 * insights.metadata.healthScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-black tracking-tighter text-slate-800 dark:text-slate-100">
                      {insights.metadata.healthScore}%
                    </span>
                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5">
                      Health Score
                    </p>
                  </div>
                </div>

                <div className="mt-4 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/20">
                  STATUS: {insights.metadata.healthStatus}
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-3 max-w-[200px]">
                  Compound rating incorporating cash reserves, inventory turnovers & customer credit collections velocity.
                </p>
              </div>
            </div>

            {/* core KPIs Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              {[
                { label: "Today's Revenue", val: fmt(insights.kpis.todaySales), change: 'Today', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: "Gross Profit", val: fmt(insights.kpis.profit), change: 'Accumulated', icon: TrendingUp, color: 'text-indigo-500 bg-indigo-500/10' },
                { label: "Operating Cost Outflow", val: fmt(insights.kpis.expenses), change: 'Expenses', icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10' },
                { label: "Liquid Cash Reserve", val: fmt(insights.kpis.cashInHand), change: 'On Hand', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{card.label}</span>
                      <div className={`p-1.5 rounded-xl ${card.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-3 tracking-tight">
                      {card.val}
                    </p>
                    <p className="text-[9.5px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-indigo-500" />
                      {card.change}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SALES & PURCHASING */}
        {activeTab === 'sales' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Sales performance details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Top Selling Products */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Top-Selling Product Catalogues</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ranked by gross sales volume and value contribution</p>
                  </div>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2.5">Item Label</th>
                        <th className="pb-2.5">SKU Code</th>
                        <th className="pb-2.5 text-center">Qty Sold</th>
                        <th className="pb-2.5 text-right">Value Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {insights.salesAnalysis.topProducts.map((p, idx) => (
                        <tr key={idx} className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <td className="py-3 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{idx + 1}.</span>
                            {p.name}
                          </td>
                          <td className="py-3 font-mono text-[10.5px] text-slate-400">{p.sku}</td>
                          <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-100">{p.quantity}</td>
                          <td className="py-3 text-right font-black text-indigo-600 dark:text-indigo-400">{fmt(p.revenue)}</td>
                        </tr>
                      ))}
                      {insights.salesAnalysis.topProducts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[11px] text-slate-400 font-bold">
                            No sales transactions recorded in this epoch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoices summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                    Invoice Audit Statistics
                  </h4>
                  <div className="flex flex-col gap-4 mt-2">
                    {[
                      { label: "Total Invoices Compiled", val: insights.salesAnalysis.totalInvoices.toString(), icon: FileText, color: 'text-indigo-500' },
                      { label: "Average Invoice Value", val: fmt(insights.salesAnalysis.averageSale), icon: TrendingUp, color: 'text-emerald-500' },
                      { label: "Peak Single Transaction", val: fmt(insights.salesAnalysis.largestSale), icon: ArrowUpRight, color: 'text-violet-500' },
                      { label: "Base Single Transaction", val: fmt(insights.salesAnalysis.smallestSale), icon: Clock, color: 'text-slate-500' }
                    ].map((row, i) => {
                      const Icon = row.icon;
                      return (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${row.color}`} />
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">{row.label}</span>
                          </div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{row.val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-normal">
                  Invoice trends demonstrate average basket ticket size is currently structured around client preference for cash outlays.
                </div>
              </div>
            </div>

            {/* Sourcing & Suppliers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  Top Sourcing Supplier Channels
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2.5">Supplier Name</th>
                        <th className="pb-2.5">Supplier Code</th>
                        <th className="pb-2.5 text-right">Total Acquisition Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px] font-semibold">
                      {insights.purchasesAnalysis.topSuppliers.map((s, idx) => (
                        <tr key={idx} className="text-slate-600 dark:text-slate-300">
                          <td className="py-3 font-extrabold text-slate-800 dark:text-slate-100">{s.name}</td>
                          <td className="py-3 font-mono text-slate-400">{s.code}</td>
                          <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">{fmt(s.amount)}</td>
                        </tr>
                      ))}
                      {insights.purchasesAnalysis.topSuppliers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 font-bold">
                            No supplier purchases recorded. Sourcing is currently quiet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales Category Distribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  Sector Revenue Contribution
                </h4>
                <div className="flex flex-col gap-4">
                  {insights.salesAnalysis.topCategories.map((c, idx) => {
                    const totalRev = insights.salesAnalysis.topCategories.reduce((s, row) => s + row.revenue, 0) || 1;
                    const pct = Math.round((c.revenue / totalRev) * 100);
                    return (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-700 dark:text-slate-300 uppercase tracking-tight">{c.name}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-black">{fmt(c.revenue)} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {insights.salesAnalysis.topCategories.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-[11px] font-bold">No product category valuations found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY HEALTH */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* KPI top list */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Asset Value (Cost)', val: fmt(insights.inventoryAnalysis.currentStockValue), icon: DollarSign, color: 'text-indigo-500 bg-indigo-500/10' },
                { label: 'Low Stock SKU lines', val: insights.inventoryAnalysis.lowStockCount.toString(), icon: ShieldAlert, color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Out of Stock items', val: insights.inventoryAnalysis.outOfStockCount.toString(), icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10' },
                { label: 'Dead / Idle Stock SKU lines', val: insights.inventoryAnalysis.deadStockCount.toString(), icon: Package, color: 'text-slate-500 bg-slate-500/10' }
              ].map((k, i) => {
                const Icon = k.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">{k.label}</span>
                      <div className={`p-1.5 rounded-xl ${k.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-2.5">{k.val}</p>
                  </div>
                );
              })}
            </div>

            {/* Fast moving vs Slow moving inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Fast Moving */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      High-Velocity SKU Channels
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Products moving with high inventory turnover ratios</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-center">Stock On Hand</th>
                        <th className="pb-2 text-right">Units Dispatched</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {insights.inventoryAnalysis.fastMovingProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5 text-emerald-500" />
                            {p.name}
                          </td>
                          <td className="py-2.5 text-center font-bold">{p.stock}</td>
                          <td className="py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">{p.sold} sold</td>
                        </tr>
                      ))}
                      {insights.inventoryAnalysis.fastMovingProducts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 font-bold">No high-velocity inventory detected yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Slow Moving */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-slate-500">
                      Slow-Moving / Static SKU Assets
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">SKUs flagged with low turnover rates (Overstock risks)</p>
                  </div>
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-center">Stock On Hand</th>
                        <th className="pb-2 text-right">Units Dispatched</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {insights.inventoryAnalysis.slowMovingProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                            {p.name}
                          </td>
                          <td className="py-2.5 text-center font-bold text-rose-500">{p.stock}</td>
                          <td className="py-2.5 text-right font-black text-slate-500">{p.sold} sold</td>
                        </tr>
                      ))}
                      {insights.inventoryAnalysis.slowMovingProducts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 font-bold">No overstock items flagged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREDIT & EXPENSES */}
        {activeTab === 'credit' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Credit KPIs summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Debt recovery panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                    Outstanding Customer Loan Ledgers
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/10">
                      <span className="text-[10px] font-black uppercase text-rose-600 tracking-wide block">Outstanding Principal Debt</span>
                      <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-2">{fmt(insights.customerAnalysis.outstandingLoan)}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/10">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wide block">Recovered Principal Principal</span>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-2">{fmt(insights.customerAnalysis.recoveredLoan)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-3 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500"
                        style={{ width: `${insights.customerAnalysis.creditRecoveryRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 shrink-0">
                      {insights.customerAnalysis.creditRecoveryRate.toFixed(1)}% Recovery Rate
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[10.5px] font-bold text-slate-400 leading-normal">
                  Debt collection indicators are healthy, driven by real-time audit reminders. Maintaining recovery rate above 85% prevents operating reserve exhaustion.
                </div>
              </div>

              {/* Top Customers list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  Premier Accounts Spent
                </h4>
                <div className="flex flex-col gap-3.5">
                  {insights.customerAnalysis.topCustomers.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800/30 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-850 dark:text-slate-100">{c.name}</p>
                        <p className="text-[9px] font-mono text-slate-400">CODE: {c.code} | {c.frequency} transactions</p>
                      </div>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{fmt(c.totalSpent)}</span>
                    </div>
                  ))}
                  {insights.customerAnalysis.topCustomers.length === 0 && (
                    <p className="text-center text-slate-400 py-6 text-[11px] font-bold">No customer accounts registered.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Expenses break down */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Expenses Categories list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                  Operating Costs Allocations
                </h4>
                <div className="flex flex-col gap-4">
                  {insights.expenseAnalysis.expensesByCategory.map((ec, idx) => {
                    const totalEx = insights.expenseAnalysis.expensesByCategory.reduce((s, row) => s + row.amount, 0) || 1;
                    const pct = Math.round((ec.amount / totalEx) * 100);
                    return (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-700 dark:text-slate-300 uppercase tracking-tight">{ec.category}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-black">{fmt(ec.amount)} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {insights.expenseAnalysis.expensesByCategory.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-[11px] font-bold">No active operating expense records compiled.</p>
                  )}
                </div>
              </div>

              {/* Single Highest Expense block */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                    Cost Center Metrics
                  </h4>
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide block">Single Highest Operating Cost Outlay</span>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{insights.expenseAnalysis.highestExpense.title || 'None Listed'}</p>
                      <p className="text-xs font-bold text-rose-600 mt-1">{fmt(insights.expenseAnalysis.highestExpense.amount)}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">RECORDED: {insights.expenseAnalysis.highestExpense.date || 'N/A'}</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Average Expense Entry</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{fmt(insights.expenseAnalysis.averageExpense)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                  Cumulative Cost Center Sum: {fmt(insights.expenseAnalysis.totalExpense)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM BI DIAGNOSTICS */}
        {activeTab === 'bi' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">System BI Diagnostics Parameter Logs</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Automated computational outcomes evaluated over system terminal ledgers</p>
                </div>
                <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Top Dispatched SKU Label", val: insights.biMetrics.highestSellingProduct, desc: "Highest quantitative dispatch sales count" },
                  { label: "Prime Net Profitable Product", val: insights.biMetrics.highestProfitProduct, desc: "Highest calculated profit margin yield" },
                  { label: "Most Valuable Category Seg", val: insights.biMetrics.mostProfitableCategory, desc: "Highest category total cumulative sales" },
                  { label: "Flagged Dead Stock Lines", val: `${insights.biMetrics.slowMovingInventoryCount} items`, desc: "Stock lines with zero dispatch in 30 days" },
                  { label: "Primary Account Debtor", val: insights.biMetrics.customerHighestOutstanding.name || 'None', desc: `Outstanding principal sum: ${fmt(insights.biMetrics.customerHighestOutstanding.balance)}` },
                  { label: "Key Sourcing Supplier", val: insights.biMetrics.supplierHighestPurchases.name || 'None', desc: `Cumulative purchases: ${fmt(insights.biMetrics.supplierHighestPurchases.amount)}` },
                  { label: "Preferred Checkout Gateway", val: insights.biMetrics.mostUsedPaymentMethod, desc: "Payment method with peak invoice counts" },
                  { label: "Highest Daily Sales Vol", val: `${insights.biMetrics.highestSalesDay.date} (${fmt(insights.biMetrics.highestSalesDay.amount)})`, desc: "Historic single-day sales peak" },
                  { label: "Lowest Daily Sales Vol", val: `${insights.biMetrics.lowestSalesDay.date} (${fmt(insights.biMetrics.lowestSalesDay.amount)})`, desc: "Historic single-day sales floor" },
                  { label: "Avg Sales Revenue Velocity", val: `${fmt(insights.biMetrics.averageDailySales)} / day`, desc: "Daily moving revenue threshold" },
                  { label: "Avg Calculated Monthly Profit", val: `${fmt(insights.biMetrics.averageMonthlyProfit)} / mo`, desc: "Calculated monthly profit average" },
                  { label: "Asset Turnover Ratio", val: insights.biMetrics.inventoryTurnover.toFixed(2), desc: "Calculated retail pricing model speed" },
                ].map((row, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">{row.label}</span>
                    <p className="text-[12.5px] font-black text-slate-800 dark:text-slate-100 mt-2.5 truncate">{row.val || 'Unrecorded'}</p>
                    <p className="text-[9.5px] font-medium text-slate-400 mt-1">{row.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STRATEGIC ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">AI-Driven Strategic Action Plans</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Automated recommendations mapped to priority tiers and domain sectors</p>
                </div>
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>

              <div className="flex flex-col gap-4">
                {insights.recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150/60 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-250 dark:hover:border-slate-800 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-900/10">
                          {rec.category}
                        </span>
                        <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getPriorityBadgeClass(rec.priority)}`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <h5 className="text-[12.5px] font-black text-slate-850 dark:text-slate-100 mt-2.5 uppercase tracking-tight">{rec.title}</h5>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-500 mt-1.5">{rec.description}</p>
                    </div>
                  </div>
                ))}
                {insights.recommendations.length === 0 && (
                  <p className="text-center text-slate-400 py-10 text-[11px] font-bold">No strategic roadmap recommendations compiled.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
