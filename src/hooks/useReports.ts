import { useState, useEffect, useCallback } from 'react';
import { 
  type ReportFilters,
  calculateSalesReport,
  calculatePurchaseReport,
  calculateExpenseReport,
  calculateProfitLoss,
  calculateCustomerReport,
  calculateSupplierReport,
  calculateCreditReport,
  calculateStockReport,
  calculateTopProducts,
  calculateTrendsAndFlows
} from '../database/reportHelpers';
import { db } from '../database/db';

/**
 * 1. Global Reports Dashboard Hook
 * Summarizes high-level shop financial and inventory metrics.
 */
export function useReports(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        plResult,
        creditResult,
        stockResult,
        trendsResult
      ] = await Promise.all([
        calculateProfitLoss(filters),
        calculateCreditReport(filters),
        calculateStockReport(),
        calculateTrendsAndFlows(filters)
      ]);

      setData({
        sales: plResult.metrics.sales,
        purchases: plResult.metrics.purchases,
        expenses: plResult.metrics.expenses,
        netProfit: plResult.metrics.netProfit,
        profitMargin: plResult.metrics.profitMargin,
        outstandingCredit: creditResult.metrics.outstandingCredit,
        cashInHand: trendsResult.cashFlow.netCashFlow,
        stockValue: stockResult.metrics.stockValue,
        cashFlow: trendsResult.cashFlow,
      });
    } catch (err: any) {
      console.error('Error in useReports:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 2. Sales Report Hook
 */
export function useSalesReport(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateSalesReport(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error in useSalesReport:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 3. Purchase Report Hook
 */
export function usePurchaseReport(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculatePurchaseReport(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error in usePurchaseReport:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 4. Expense Report Hook
 */
export function useExpenseReport(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateExpenseReport(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error in useExpenseReport:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 5. Profit & Loss Hook
 */
export function useProfitLoss(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateProfitLoss(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error in useProfitLoss:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 6. Stock & Inventory Report Hook
 */
export function useStockReport(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateStockReport();
      setData(result);
    } catch (err: any) {
      console.error('Error in useStockReport:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 7. Customer Credit & Ledger Report Hook
 */
export function useCreditReport(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateCreditReport(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error in useCreditReport:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}

/**
 * 8. Core Analytics Trends & Product Hook
 */
export function useAnalytics(filters: ReportFilters) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        topProductsResult,
        trendsResult,
        customerResult,
        supplierResult
      ] = await Promise.all([
        calculateTopProducts(filters),
        calculateTrendsAndFlows(filters),
        calculateCustomerReport(filters),
        calculateSupplierReport(filters),
      ]);

      setData({
        topSelling: topProductsResult.topSelling,
        topProfitable: topProductsResult.topProfitable,
        slowMoving: topProductsResult.slowMoving,
        trends: trendsResult.trends,
        cashFlow: trendsResult.cashFlow,
        paymentMethods: trendsResult.paymentMethods,
        topCustomers: customerResult.topCustomers,
        customerMetrics: customerResult.metrics,
        topSuppliers: supplierResult.topSuppliers,
        supplierMetrics: supplierResult.metrics,
      });
    } catch (err: any) {
      console.error('Error in useAnalytics:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, isLoading, error, refetch: fetchReport };
}
