import { useState, useEffect, useCallback } from 'react';
import { db } from '../database/db';
import { formatDate } from '../utils/helpers';

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ChartDataPoint {
  label: string;
  sales: number;
  costs: number;
  profit: number;
}

export interface ExpenseCategoryPoint {
  category: string;
  amount: number;
}

export interface ExpenseMonthPoint {
  month: string;
  amount: number;
}

export interface StockDistributionPoint {
  name: string;
  value: number;
}

export interface CategoryDistributionPoint {
  name: string;
  count: number;
  value: number; // monetary value of stock in this category
}

export interface ActivityItem {
  id: string;
  type: 'login' | 'sale' | 'purchase' | 'expense' | 'credit' | 'setting';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  description: string;
  timestamp: Date;
}

/**
 * Main coordinating custom hook for the comprehensive Dashboard pages,
 * implementing date filtration, analytics datasets, activity timelines, and real-time alerts.
 */
export function useDashboard() {
  const [filterType, setFilterType] = useState<DateFilterType>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Analytics State
  const [salesChartData, setSalesChartData] = useState<ChartDataPoint[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryPoint[]>([]);
  const [expenseMonthly, setExpenseMonthly] = useState<ExpenseMonthPoint[]>([]);
  const [stockDistribution, setStockDistribution] = useState<StockDistributionPoint[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionPoint[]>([]);
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load tables
      const [
        allProducts,
        allCategories,
        allSales,
        allSaleItems,
        allPurchases,
        allExpenses,
        allCustomers,
        allSuppliers,
        allCreditPayments,
        allExpenseCategories,
      ] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray(),
        db.sales.toArray(),
        db.saleItems.toArray(),
        db.purchases.toArray(),
        db.expenses.toArray(),
        db.customers.toArray(),
        db.suppliers.toArray(),
        db.creditPayments.toArray(),
        db.expenseCategories.toArray(),
      ]);

      // Product cost & category map for calculation
      const productCostMap = new Map<number, number>();
      const productPriceMap = new Map<number, number>();
      const productNameMap = new Map<number, string>();
      const productCategoryMap = new Map<number, number>();

      allProducts.forEach((p) => {
        if (p.id) {
          productCostMap.set(p.id, p.cost);
          productPriceMap.set(p.id, p.price);
          productNameMap.set(p.id, p.name);
          productCategoryMap.set(p.id, p.categoryId);
        }
      });

      const categoryNameMap = new Map<number, string>();
      allCategories.forEach((c) => {
        if (c.id) categoryNameMap.set(c.id, c.name);
      });

      const expenseCategoryNameMap = new Map<number, string>();
      allExpenseCategories.forEach((ec) => {
        if (ec.id) expenseCategoryNameMap.set(ec.id, ec.name);
      });

      const customerNameMap = new Map<number, string>();
      allCustomers.forEach((cust) => {
        if (cust.id) customerNameMap.set(cust.id, cust.name);
      });

      const supplierNameMap = new Map<number, string>();
      allSuppliers.forEach((s) => {
        if (s.id) supplierNameMap.set(s.id, s.companyName || s.name);
      });

      // 1. Determine Date Boundaries based on filter
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (filterType) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'week':
          // Start of last 7 days
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'month':
          // Start of last 30 days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'year':
          // Start of last 12 months
          startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      // Filter lists based on selected range
      const filterByRange = (date: Date) => {
        const d = new Date(date);
        return d >= startDate && d <= endDate;
      };

      const filteredSales = allSales.filter((s) => filterByRange(s.createdAt) && s.status === 'Completed');
      const filteredPurchases = allPurchases.filter((p) => filterByRange(p.createdAt) && p.status === 'Received');
      const filteredExpenses = allExpenses.filter((e) => filterByRange(e.expenseDate));

      // 2. Generate Sales & Profits Chart Data points
      const chartPoints: ChartDataPoint[] = [];

      if (filterType === 'today') {
        // Hourly segments (e.g. 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm, 10pm)
        const hours = [8, 10, 12, 14, 16, 18, 20, 22];
        hours.forEach((hour) => {
          const hourSales = filteredSales.filter((s) => {
            const h = new Date(s.createdAt).getHours();
            return h >= hour - 1 && h <= hour;
          });

          const salesSum = hourSales.reduce((acc, s) => acc + s.total, 0);
          
          let costSum = 0;
          hourSales.forEach((sale) => {
            const items = allSaleItems.filter((si) => si.saleId === sale.id);
            items.forEach((item) => {
              const cost = productCostMap.get(item.productId) ?? 0;
              costSum += cost * item.quantity;
            });
          });

          const label = `${hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}`;
          chartPoints.push({
            label,
            sales: salesSum,
            costs: costSum,
            profit: Math.max(0, salesSum - costSum),
          });
        });
      } else if (filterType === 'week') {
        // Past 7 days day-by-day
        for (let i = 6; i >= 0; i--) {
          const targetDay = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const daySales = filteredSales.filter((s) => {
            const d = new Date(s.createdAt);
            return d.getDate() === targetDay.getDate() && d.getMonth() === targetDay.getMonth();
          });

          const salesSum = daySales.reduce((acc, s) => acc + s.total, 0);
          
          let costSum = 0;
          daySales.forEach((sale) => {
            const items = allSaleItems.filter((si) => si.saleId === sale.id);
            items.forEach((item) => {
              const cost = productCostMap.get(item.productId) ?? 0;
              costSum += cost * item.quantity;
            });
          });

          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          chartPoints.push({
            label: daysOfWeek[targetDay.getDay()],
            sales: salesSum,
            costs: costSum,
            profit: Math.max(0, salesSum - costSum),
          });
        }
      } else if (filterType === 'month' || filterType === 'custom') {
        // Group by weeks or 5-day intervals
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const numIntervals = totalDays <= 7 ? totalDays : 6;
        const daysPerInterval = Math.max(1, Math.ceil(totalDays / numIntervals));

        for (let i = 0; i < numIntervals; i++) {
          const intervalStart = new Date(startDate.getTime() + i * daysPerInterval * 24 * 60 * 60 * 1000);
          const intervalEnd = new Date(intervalStart.getTime() + (daysPerInterval - 1) * 24 * 60 * 60 * 1000);
          
          const intervalSales = filteredSales.filter((s) => {
            const d = new Date(s.createdAt);
            return d >= intervalStart && d <= intervalEnd;
          });

          const salesSum = intervalSales.reduce((acc, s) => acc + s.total, 0);
          let costSum = 0;
          intervalSales.forEach((sale) => {
            const items = allSaleItems.filter((si) => si.saleId === sale.id);
            items.forEach((item) => {
              const cost = productCostMap.get(item.productId) ?? 0;
              costSum += cost * item.quantity;
            });
          });

          const label = `${intervalStart.getMonth() + 1}/${intervalStart.getDate()}`;
          chartPoints.push({
            label,
            sales: salesSum,
            costs: costSum,
            profit: Math.max(0, salesSum - costSum),
          });
        }
      } else if (filterType === 'year') {
        // Monthly segments over last 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const m = d.getMonth();
          const y = d.getFullYear();

          const monthSales = allSales.filter((s) => {
            const sd = new Date(s.createdAt);
            return sd.getMonth() === m && sd.getFullYear() === y && s.status === 'Completed';
          });

          const salesSum = monthSales.reduce((acc, s) => acc + s.total, 0);
          let costSum = 0;
          monthSales.forEach((sale) => {
            const items = allSaleItems.filter((si) => si.saleId === sale.id);
            items.forEach((item) => {
              const cost = productCostMap.get(item.productId) ?? 0;
              costSum += cost * item.quantity;
            });
          });

          chartPoints.push({
            label: `${monthNames[m]} ${y.toString().slice(-2)}`,
            sales: salesSum,
            costs: costSum,
            profit: Math.max(0, salesSum - costSum),
          });
        }
      }

      setSalesChartData(chartPoints);

      // 3. Expense overview data
      // Categories Distribution
      const catMap = new Map<string, number>();
      filteredExpenses.forEach((exp) => {
        const catName = exp.category || expenseCategoryNameMap.get(exp.categoryId) || 'Other';
        const currentVal = catMap.get(catName) ?? 0;
        catMap.set(catName, currentVal + exp.amount);
      });

      const expenseCatPoints: ExpenseCategoryPoint[] = Array.from(catMap.entries()).map(([category, amount]) => ({
        category,
        amount,
      }));
      setExpenseCategories(expenseCatPoints.sort((a, b) => b.amount - a.amount));

      // Monthly expenses (last 6 months)
      const monthlyExp: ExpenseMonthPoint[] = [];
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();

        const monthExpensesList = allExpenses.filter((e) => {
          const ed = new Date(e.expenseDate);
          return ed.getMonth() === m && ed.getFullYear() === y;
        });

        monthlyExp.push({
          month: monthNamesShort[m],
          amount: monthExpensesList.reduce((acc, e) => acc + e.amount, 0),
        });
      }
      setExpenseMonthly(monthlyExp);

      // 4. Product distribution (Pie Chart)
      // Stock Distribution
      const productStockPoints: StockDistributionPoint[] = allProducts
        .map((p) => ({
          name: p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name,
          value: p.stock,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Take top 5 products by stock count
      setStockDistribution(productStockPoints);

      // Category Stock Volume Distribution
      const categoryStockMap = new Map<number, { count: number; value: number }>();
      allProducts.forEach((p) => {
        const entry = categoryStockMap.get(p.categoryId) ?? { count: 0, value: 0 };
        entry.count += p.stock;
        entry.value += p.stock * p.price;
        categoryStockMap.set(p.categoryId, entry);
      });

      const categoryPoints: CategoryDistributionPoint[] = Array.from(categoryStockMap.entries()).map(([catId, stats]) => ({
        name: categoryNameMap.get(catId) || 'Uncategorized',
        count: stats.count,
        value: stats.value,
      }));
      setCategoryDistribution(categoryPoints);

      // 5. Recent Activity Timeline
      const activityTimeline: ActivityItem[] = [];

      // Add recent sales
      filteredSales.slice(0, 4).forEach((s) => {
        activityTimeline.push({
          id: `sale-${s.id}`,
          type: 'sale',
          title: `POS Sale Completed`,
          description: `Invoice ${s.invoiceNo} issued for ${customerNameMap.get(s.customerId!) || 'Guest'}. Amount: $${s.total.toFixed(2)}`,
          timestamp: s.createdAt,
          user: 'System Admin',
        });
      });

      // Add recent purchases
      filteredPurchases.slice(0, 3).forEach((p) => {
        activityTimeline.push({
          id: `purchase-${p.id}`,
          type: 'purchase',
          title: `Inventory Stock Received`,
          description: `Reference ${p.referenceNo} recorded from supplier ${supplierNameMap.get(p.supplierId!) || 'Vendor'}. Paid: $${p.total.toFixed(2)}`,
          timestamp: p.createdAt,
          user: 'Inventory Manager',
        });
      });

      // Add recent expenses
      filteredExpenses.slice(0, 3).forEach((e) => {
        const catName = e.category || expenseCategoryNameMap.get(e.categoryId) || 'Other';
        activityTimeline.push({
          id: `expense-${e.id}`,
          type: 'expense',
          title: `Store Expense Logged`,
          description: `${catName} expense: ${e.description || e.title || 'No description'} for $${e.amount.toFixed(2)}`,
          timestamp: e.expenseDate,
          user: 'Accountant',
        });
      });

      // Add recent credit payments
      allCreditPayments.slice(0, 3).forEach((cp) => {
        activityTimeline.push({
          id: `credit-${cp.id}`,
          type: 'credit',
          title: `Credit Payment Settled`,
          description: `Amount of $${cp.amount.toFixed(2)} paid via ${cp.paymentMethod} (Ref: ${cp.referenceNo || 'None'})`,
          timestamp: cp.createdAt,
          user: 'Accounts Receivable',
        });
      });

      // Sort chronological descending
      activityTimeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activityTimeline.slice(0, 10));

      // 6. Notification Panel Builder (alerts)
      const alerts: NotificationItem[] = [];

      // Check low stock products
      const lowStockList = allProducts.filter((p) => p.stock <= p.alertQuantity);
      if (lowStockList.length > 0) {
        alerts.push({
          id: 'alert-lowstock',
          type: 'warning',
          title: 'Inventory Alert: Low Stock',
          description: `${lowStockList.length} products have reached or fallen below critical warning levels and require replenishment.`,
          timestamp: new Date(),
        });
      }

      // Check credit outstanding
      const creditTotal = allCustomers.reduce((acc, c) => acc + c.balance, 0);
      const creditCustomers = allCustomers.filter((c) => c.balance > 0).length;
      if (creditTotal > 0) {
        alerts.push({
          id: 'alert-credit',
          type: 'info',
          title: 'Pending Customer Credits',
          description: `${creditCustomers} accounts are carrying outstanding debt. Total receivables: $${creditTotal.toFixed(2)}.`,
          timestamp: new Date(),
        });
      }

      // Today's summary
      const todaySalesVal = allSales.filter((s) => {
        const sd = new Date(s.createdAt);
        const todayRef = new Date();
        return sd.getDate() === todayRef.getDate() && sd.getMonth() === todayRef.getMonth() && s.status === 'Completed';
      }).reduce((acc, s) => acc + s.total, 0);

      alerts.push({
        id: 'alert-todaysales',
        type: todaySalesVal > 0 ? 'success' : 'info',
        title: "Today's Revenue Stream",
        description: todaySalesVal > 0 
          ? `Congratulations! Total register receipts today have cleared $${todaySalesVal.toFixed(2)} across multiple checkout items.`
          : 'No checkout receipts recorded yet today. Launch the POS Sales panel to log orders.',
        timestamp: new Date(),
      });

      // Backup status
      alerts.push({
        id: 'alert-backup',
        type: 'success',
        title: 'Offline Database Synchronized',
        description: 'Dexie IndexedDB (Local Sandbox) running securely. Cloud sheets backups can be linked under settings.',
        timestamp: new Date(),
      });

      setNotifications(alerts);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, customStartDate, customEndDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isLoading,
    error,
    salesChartData,
    expenseCategories,
    expenseMonthly,
    stockDistribution,
    categoryDistribution,
    activities,
    notifications,
    refetch: fetchDashboardData,
  };
}
