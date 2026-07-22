import React from 'react';
import { 
  TrendingUp, 
  Coins, 
  ShoppingBag, 
  Receipt, 
  Package, 
  AlertTriangle, 
  Users, 
  Landmark,
  Tags,
  Truck,
  FolderTree,
  DollarSign
} from 'lucide-react';
import { useDashboardStatistics } from '../../hooks/useDashboardStatistics';
import DashboardCard from './DashboardCard';
import { formatCurrency } from '../../utils/helpers';

export const StatisticsGrid: React.FC = () => {
  const { stats, isLoading, error } = useDashboardStatistics();

  // Cards Skeleton Loader
  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 animate-pulse" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-rose-150/40 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/5 rounded-3xl">
        <AlertTriangle className="h-6 w-6 text-rose-500 mx-auto mb-2" />
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
          Failed to load local metrics. Dexie database error.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Core Financial Operations */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-left">
          Core Registers (Today)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon={TrendingUp}
            change={stats.todaySalesChange}
            changeLabel="vs yesterday"
            variant="indigo"
            id="stats-card-today-sales"
          />
          <DashboardCard
            title="Today's Net Profit"
            value={formatCurrency(stats.todayProfit)}
            icon={Coins}
            change={stats.todayProfitChange}
            changeLabel="vs yesterday"
            variant="emerald"
            id="stats-card-today-profit"
          />
          <DashboardCard
            title="Today's Acquisitions"
            value={formatCurrency(stats.todayPurchases)}
            icon={ShoppingBag}
            change={stats.todayPurchasesChange}
            changeLabel="vs yesterday"
            variant="sky"
            id="stats-card-today-purchases"
          />
          <DashboardCard
            title="Today's Expenses"
            value={formatCurrency(stats.todayExpenses)}
            icon={Receipt}
            change={stats.todayExpensesChange}
            changeLabel="vs yesterday"
            variant="rose"
            id="stats-card-today-expenses"
          />
        </div>
      </div>

      {/* 2. Stock Ledger & Inventory Status */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-left">
          Inventory & Stock Levels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Available Stock"
            value={`${stats.availableStock} units`}
            icon={Package}
            change={0}
            changeLabel="Across catalog"
            variant="violet"
            id="stats-card-available-stock"
          />
          <DashboardCard
            title="Low Stock Alerts"
            value={`${stats.lowStockCount} items`}
            icon={AlertTriangle}
            change={0}
            changeLabel="Require restocking"
            variant="amber"
            id="stats-card-low-stock"
          />
          <DashboardCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Tags}
            change={0}
            changeLabel="Unique SKUs registered"
            variant="slate"
            id="stats-card-total-products"
          />
          <DashboardCard
            title="Total Categories"
            value={stats.totalCategories}
            icon={FolderTree}
            change={0}
            changeLabel="Group segments"
            variant="slate"
            id="stats-card-total-categories"
          />
        </div>
      </div>

      {/* 3. Receivables & Client Base */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-left">
          Receivables & Client Base
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Outstanding Credit"
            value={formatCurrency(stats.outstandingCredit)}
            icon={Landmark}
            change={0}
            changeLabel="Client accounts total debt"
            variant="rose"
            id="stats-card-outstanding-credit"
          />
          <DashboardCard
            title="Credit Customers"
            value={`${stats.creditCustomersCount} accounts`}
            icon={Users}
            change={0}
            changeLabel="Debtors holding debt"
            variant="amber"
            id="stats-card-credit-customers"
          />
          <DashboardCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={Users}
            change={0}
            changeLabel="Registered shoppers"
            variant="slate"
            id="stats-card-total-customers"
          />
          <DashboardCard
            title="Total Suppliers"
            value={stats.totalSuppliers}
            icon={Truck}
            change={0}
            changeLabel="Sourcing supply partners"
            variant="slate"
            id="stats-card-total-suppliers"
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsGrid;
