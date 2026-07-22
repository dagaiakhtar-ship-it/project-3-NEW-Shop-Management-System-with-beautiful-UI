import { useState, useCallback } from 'react';
import { PDFService, getShopBranding, ShopInfo } from '../services/pdfService';
import { useAuthStore } from '../store/authStore';
import showToast from '../utils/toast';

export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const { currentUser } = useAuthStore();

  const handleAsyncGeneration = useCallback(
    async (
      title: string,
      generationPromise: () => Promise<string | null>
    ) => {
      setIsGenerating(true);
      setCurrentTitle(title);
      try {
        const result = await generationPromise();
        if (result && typeof result === 'string') {
          setPreviewUrl(result);
        }
        return result;
      } catch (err: any) {
        console.error(`PDF Generation failed for: ${title}`, err);
        showToast.error(`PDF Generation Failed: ${err.message || 'Error occurred.'}`);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generateInvoice = useCallback(
    async (sale: any, items: any[], mode: 'download' | 'preview' | 'print' = 'download') => {
      return handleAsyncGeneration(`Invoice_${sale.invoiceNo}`, () =>
        PDFService.generateInvoicePDF(sale, items, mode, currentUser?.fullName || currentUser?.username || 'Cashier')
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateThermalReceipt = useCallback(
    async (sale: any, items: any[], mode: 'download' | 'preview' | 'print' = 'download') => {
      return handleAsyncGeneration(`Receipt_${sale.invoiceNo}`, () =>
        PDFService.generateThermalReceiptPDF(sale, items, mode, currentUser?.fullName || currentUser?.username || 'Cashier')
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generatePurchase = useCallback(
    async (purchase: any, items: any[], mode: 'download' | 'preview' | 'print' = 'download') => {
      return handleAsyncGeneration(`Purchase_${purchase.purchaseNumber}`, () =>
        PDFService.generatePurchasePDF(purchase, items, mode, currentUser?.fullName || currentUser?.username || 'Buyer')
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateExpense = useCallback(
    async (expense: any, mode: 'download' | 'preview' | 'print' = 'download') => {
      return handleAsyncGeneration(`Expense_${expense.expenseNumber}`, () =>
        PDFService.generateExpensePDF(expense, mode, currentUser?.fullName || currentUser?.username || 'Accountant')
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateCustomerStatement = useCallback(
    async (
      customer: any,
      transactions: any[],
      meta: { openingBalance: number; closingBalance: number; outstanding: number },
      mode: 'download' | 'preview' | 'print' = 'download'
    ) => {
      return handleAsyncGeneration(`Statement_${customer.customerCode}`, () =>
        PDFService.generateCustomerStatementPDF(
          customer,
          transactions,
          meta,
          mode,
          currentUser?.fullName || currentUser?.username || 'Credit Officer'
        )
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateSupplierStatement = useCallback(
    async (
      supplier: any,
      purchases: any[],
      meta: { outstanding: number; totalPurchased: number },
      mode: 'download' | 'preview' | 'print' = 'download'
    ) => {
      return handleAsyncGeneration(`SupplierStatement_${supplier.supplierCode}`, () =>
        PDFService.generateSupplierStatementPDF(
          supplier,
          purchases,
          meta,
          mode,
          currentUser?.fullName || currentUser?.username || 'Purchasing Officer'
        )
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateDashboard = useCallback(
    async (
      metrics: {
        todaySales: number;
        todayProfit: number;
        todayPurchases: number;
        todayExpenses: number;
        outstandingCredit: number;
        recoveredCredit: number;
        cashInHand: number;
        stockValue: number;
      },
      topProducts: any[],
      mode: 'download' | 'preview' | 'print' = 'download'
    ) => {
      return handleAsyncGeneration('Dashboard_Summary', () =>
        PDFService.generateDashboardPDF(
          metrics,
          topProducts,
          mode,
          currentUser?.fullName || currentUser?.username || 'Administrator'
        )
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateProductCatalog = useCallback(
    async (products: any[], mode: 'download' | 'preview' | 'print' = 'download') => {
      return handleAsyncGeneration('Product_Catalog', () =>
        PDFService.generateProductCatalogPDF(products, mode, currentUser?.fullName || currentUser?.username || 'Inventory Officer')
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const generateGenericReport = useCallback(
    async (
      title: string,
      headers: string[],
      rows: any[][],
      summaryCards: { label: string; value: string }[] = [],
      orientation: 'portrait' | 'landscape' = 'portrait',
      mode: 'download' | 'preview' | 'print' = 'download'
    ) => {
      return handleAsyncGeneration(title, () =>
        PDFService.generateGenericReportPDF(
          title,
          headers,
          rows,
          summaryCards,
          orientation,
          mode,
          currentUser?.fullName || currentUser?.username || 'System Auditor'
        )
      );
    },
    [handleAsyncGeneration, currentUser]
  );

  const closePreview = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  return {
    isGenerating,
    previewUrl,
    currentTitle,
    closePreview,
    generateInvoice,
    generateThermalReceipt,
    generatePurchase,
    generateExpense,
    generateCustomerStatement,
    generateSupplierStatement,
    generateDashboard,
    generateProductCatalog,
    generateGenericReport,
  };
}
