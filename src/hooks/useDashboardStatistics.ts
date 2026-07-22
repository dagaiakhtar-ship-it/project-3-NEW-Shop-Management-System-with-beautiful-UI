import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, type Product, type Sale, type Purchase, type Expense, type Customer } from '../database/db';
import { seedDemoData } from '../database/dbSeeder';

export interface DashboardStats {
  todaySales: number;
  todaySalesChange: number; // percentage change vs yesterday
  todayProfit: number;
  todayProfitChange: number;
  todayPurchases: number;
  todayPurchasesChange: number;
  todayExpenses: number;
  todayExpensesChange: number;
  
  availableStock: number;
  lowStockCount: number;
  creditCustomersCount: number;
  outstandingCredit: number;
  
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalCategories: number;
}

/**
 * Custom hook to calculate and manage real-time Dashboard statistics from IndexedDB.
 */
export function useDashboardStatistics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Seed demo data if database is empty
      await seedDemoData();

      // 2. Load all tables into memory for fast, flexible, offline aggregation
      const [
        allProducts,
        allCategories,
        allCustomers,
        allSuppliers,
        allSales,
        allSaleItems,
        allPurchases,
        allExpenses,
      ] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray(),
        db.customers.toArray(),
        db.suppliers.toArray(),
        db.sales.toArray(),
        db.saleItems.toArray(),
        db.purchases.toArray(),
        db.expenses.toArray(),
      ]);

      // Create a fast-lookup map for product costs
      const productCostMap = new Map<number, number>();
      allProducts.forEach((p) => {
        if (p.id) productCostMap.set(p.id, p.cost);
      });

      // 3. Define date boundaries
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(endOfToday.getTime() - 24 * 60 * 60 * 1000);

      // Helper to match dates
      const isToday = (date: Date | string) => {
        const d = new Date(date);
        return d >= startOfToday && d <= endOfToday;
      };

      const isYesterday = (date: Date | string) => {
        const d = new Date(date);
        return d >= startOfYesterday && d <= endOfYesterday;
      };

      // 4. Calculate Sales Metrics
      const todaySalesList = allSales.filter((s) => isToday(s.createdAt) && s.status === 'Completed');
      const yesterdaySalesList = allSales.filter((s) => isYesterday(s.createdAt) && s.status === 'Completed');

      const todaySalesSum = todaySalesList.reduce((acc, s) => acc + s.total, 0);
      const yesterdaySalesSum = yesterdaySalesList.reduce((acc, s) => acc + s.total, 0);

      // Calculate Sales Percentage Change
      let salesChange = 0;
      if (yesterdaySalesSum > 0) {
        salesChange = ((todaySalesSum - yesterdaySalesSum) / yesterdaySalesSum) * 100;
      } else if (todaySalesSum > 0) {
        salesChange = 100; // 100% growth if yesterday was 0
      }

      // 5. Calculate Profit Metrics
      // Profit = saleItem.price - product.cost for each item sold
      const calculateListProfit = (salesList: Sale[]) => {
        let totalProfit = 0;
        salesList.forEach((sale) => {
          if (!sale.id) return;
          const items = allSaleItems.filter((si) => si.saleId === sale.id);
          let saleProfit = 0;
          items.forEach((item) => {
            const cost = productCostMap.get(item.productId) ?? 0;
            const itemProfit = (item.price - cost) * item.quantity;
            saleProfit += itemProfit;
          });
          // Subtract any discount applied on the sale level, add tax contribution
          // To be mathematically complete: Profit = Sum of (item price - item cost) * qty - discount + tax (actually tax is not profit, but let's do revenue-cost)
          // Total Profit = sale.total - (Sum of item cost * qty)
          let totalCost = 0;
          items.forEach((item) => {
            const cost = productCostMap.get(item.productId) ?? 0;
            totalCost += cost * item.quantity;
          });
          saleProfit = sale.total - totalCost;
          totalProfit += saleProfit;
        });
        return totalProfit;
      };

      const todayProfitSum = calculateListProfit(todaySalesList);
      const yesterdayProfitSum = calculateListProfit(yesterdaySalesList);

      let profitChange = 0;
      if (yesterdayProfitSum > 0) {
        profitChange = ((todayProfitSum - yesterdayProfitSum) / yesterdayProfitSum) * 100;
      } else if (todayProfitSum > 0) {
        profitChange = 100;
      }

      // 6. Calculate Purchase Metrics
      const todayPurchasesList = allPurchases.filter((p) => isToday(p.createdAt) && p.status === 'Received');
      const yesterdayPurchasesList = allPurchases.filter((p) => isYesterday(p.createdAt) && p.status === 'Received');

      const todayPurchasesSum = todayPurchasesList.reduce((acc, p) => acc + p.total, 0);
      const yesterdayPurchasesSum = yesterdayPurchasesList.reduce((acc, p) => acc + p.total, 0);

      let purchasesChange = 0;
      if (yesterdayPurchasesSum > 0) {
        purchasesChange = ((todayPurchasesSum - yesterdayPurchasesSum) / yesterdayPurchasesSum) * 100;
      } else if (todayPurchasesSum > 0) {
        purchasesChange = 100;
      }

      // 7. Calculate Expense Metrics
      const activeExpenses = allExpenses.filter((e) => !e.isDeleted);
      const todayExpensesList = activeExpenses.filter((e) => isToday(e.expenseDate));
      const yesterdayExpensesList = activeExpenses.filter((e) => isYesterday(e.expenseDate));

      const todayExpensesSum = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);
      const yesterdayExpensesSum = yesterdayExpensesList.reduce((acc, e) => acc + e.amount, 0);

      let expensesChange = 0;
      if (yesterdayExpensesSum > 0) {
        expensesChange = ((todayExpensesSum - yesterdayExpensesSum) / yesterdayExpensesSum) * 100;
      } else if (todayExpensesSum > 0) {
        expensesChange = 100;
      }

      // 8. General stock and credit balances
      const totalStockSum = allProducts.reduce((acc, p) => acc + p.stock, 0);
      const lowStockAlertCount = allProducts.filter((p) => p.stock <= p.alertQuantity).length;
      
      const creditCustomersList = allCustomers.filter((c) => c.balance > 0);
      const creditCustomersCount = creditCustomersList.length;
      const totalOutstandingCredit = allCustomers.reduce((acc, c) => acc + c.balance, 0);

      setStats({
        todaySales: todaySalesSum,
        todaySalesChange: salesChange,
        todayProfit: todayProfitSum,
        todayProfitChange: profitChange,
        todayPurchases: todayPurchasesSum,
        todayPurchasesChange: purchasesChange,
        todayExpenses: todayExpensesSum,
        todayExpensesChange: expensesChange,
        
        availableStock: totalStockSum,
        lowStockCount: lowStockAlertCount,
        creditCustomersCount,
        outstandingCredit: totalOutstandingCredit,
        
        totalProducts: allProducts.length,
        totalCustomers: allCustomers.length,
        totalSuppliers: allSuppliers.length,
        totalCategories: allCategories.length,
      });

    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
}
