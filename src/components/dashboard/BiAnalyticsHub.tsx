import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  UserCheck, 
  Truck, 
  FileSpreadsheet, 
  ArrowUpRight, 
  TrendingUp, 
  AlertCircle, 
  Layers, 
  Activity,
  UserPlus,
  ArrowRightLeft
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface BiAnalyticsHubProps {
  inventory: {
    inventoryValue: number;
    fastMoving: any[];
    slowMoving: any[];
    deadStock: any[];
    lowStock: any[];
    outOfStock: any[];
  };
  customer: {
    topCustomers: any[];
    newCustomersCount: number;
    repeatCustomersCount: number;
    outstandingCustomers: any[];
    recentPayments: any[];
  };
  supplier: {
    topSuppliers: any[];
    recentPurchases: any[];
    outstandingSuppliers: any[];
  };
}

type TabType = 'inventory' | 'customer' | 'supplier';

export const BiAnalyticsHub: React.FC<BiAnalyticsHubProps> = ({ inventory, customer, supplier }) => {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm text-left flex flex-col h-full min-h-[460px]">
      
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/40 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Activity className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 tracking-tight uppercase">
              Advanced BI Analytics Suite
            </h4>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              Deep performance drilling of store inventories, active debtors, and sourcing operations
            </p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-950 p-1 border border-slate-100 dark:border-slate-850">
          {(['inventory', 'customer', 'supplier'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 shadow text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'inventory' && <Package className="h-3.5 w-3.5" />}
              {tab === 'customer' && <UserCheck className="h-3.5 w-3.5" />}
              {tab === 'supplier' && <Truck className="h-3.5 w-3.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Deep Dive
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1">
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
            {/* Left Box: Fast vs Slow Moving */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Fast-Moving Products (Top Sellers)
                </h5>
                <div className="space-y-2">
                  {inventory.fastMoving.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 py-3">No sales in this filtered range.</div>
                  ) : (
                    inventory.fastMoving.map((p, i) => (
                      <div key={p.sku + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100/60 dark:border-slate-800/50 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-150 truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{p.sku}</span>
                        </div>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-950/20">
                          {p.qty} sold
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <Layers className="h-3.5 w-3.5" />
                  Slow-Moving / Dead Stock Alert
                </h5>
                <div className="space-y-2">
                  {inventory.slowMoving.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 py-3">No slow products in shelves.</div>
                  ) : (
                    inventory.slowMoving.map((p, i) => (
                      <div key={p.sku + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-100/60 dark:border-slate-800/50 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{p.sku}</span>
                        </div>
                        <span className="font-black text-slate-500 dark:text-slate-400">
                          {p.stock} units left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Box: Low Stock vs Out of Stock Lists */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  Low Stock Threshold Warning
                </h5>
                <div className="space-y-2">
                  {inventory.lowStock.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-emerald-500 font-bold py-3">All catalog levels stable!</div>
                  ) : (
                    inventory.lowStock.slice(0, 3).map((p, i) => (
                      <div key={p.sku + i} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/5 border border-rose-100 dark:border-rose-950/20 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-rose-900 dark:text-rose-200 truncate">{p.name}</span>
                          <span className="text-[10px] text-rose-400 font-bold">{p.sku}</span>
                        </div>
                        <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          {p.stock} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Out of Stock Shelves (Null Count)
                </h5>
                <div className="space-y-2">
                  {inventory.outOfStock.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-emerald-500 font-bold py-3">No out of stock items in store catalog.</div>
                  ) : (
                    inventory.outOfStock.slice(0, 3).map((p, i) => (
                      <div key={p.sku + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-700 dark:text-slate-350 truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-450 font-bold">{p.sku}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-red-500 dark:text-red-400">
                          Empty Stock
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full text-left">
            {/* Left Box: Top Spenders & Outstanding Debt */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Top Customers (LTV / High Spenders)
                </h5>
                <div className="space-y-2">
                  {customer.topCustomers.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 py-3">No transactions logged.</div>
                  ) : (
                    customer.topCustomers.map((c, i) => (
                      <div key={c.name + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-100/60 dark:border-slate-800/50 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-150 truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{c.phone}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(c.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Box: Debtors & Recent Debt Payments Received */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Outstanding Customer Debts (Receivables)
                </h5>
                <div className="space-y-2">
                  {customer.outstandingCustomers.length === 0 ? (
                    <div className="text-xs text-slate-450 dark:text-emerald-500 font-bold py-3">No active debtor accounts!</div>
                  ) : (
                    customer.outstandingCustomers.map((c, i) => (
                      <div key={c.name + i} className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 border border-orange-100 dark:border-orange-950/20 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-850 dark:text-slate-150 truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-450 font-bold">{c.phone}</span>
                        </div>
                        <span className="font-black text-orange-600 dark:text-orange-400">
                          {formatCurrency(c.balance)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <UserPlus className="h-3.5 w-3.5" />
                  Active Buyer Segment Statistics
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100 text-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">New Registrations</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{customer.newCustomersCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100 text-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Repeat Buyers</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{customer.repeatCustomersCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full text-left">
            {/* Left Box: Top Suppliers & Outstanding Balances */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Top Vendors by Sourcing Volumes
                </h5>
                <div className="space-y-2">
                  {supplier.topSuppliers.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 py-3">No supplier records found.</div>
                  ) : (
                    supplier.topSuppliers.map((s, i) => (
                      <div key={s.name + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-100/60 dark:border-slate-800/50 text-xs">
                        <span className="font-bold text-slate-850 dark:text-slate-150 truncate">{s.name}</span>
                        <span className="font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
                          {formatCurrency(s.volume)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Box: Recent Purchases & Balances */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Recent Stock Acquisitions
                </h5>
                <div className="space-y-2">
                  {supplier.recentPurchases.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 py-3">No recent purchases logged.</div>
                  ) : (
                    supplier.recentPurchases.map((p, i) => (
                      <div key={p.supplierName + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100 text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-750 dark:text-slate-350 truncate">{p.supplierName}</span>
                          <span className="text-[10px] text-slate-450 font-bold">{formatDate(p.date)}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(p.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Outstanding Supplier Accounts Payable
                </h5>
                <div className="space-y-2">
                  {supplier.outstandingSuppliers.length === 0 ? (
                    <div className="text-xs text-slate-450 dark:text-emerald-500 font-bold py-3">All suppliers fully paid!</div>
                  ) : (
                    supplier.outstandingSuppliers.map((s, i) => (
                      <div key={s.name + i} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-100 dark:border-amber-950/20 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{s.name}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {formatCurrency(s.balance)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BiAnalyticsHub;
