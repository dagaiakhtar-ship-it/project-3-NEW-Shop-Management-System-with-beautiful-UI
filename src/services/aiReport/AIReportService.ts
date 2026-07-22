import { db } from '../../database/db';
import { getShopBranding } from '../pdfService';
import { BusinessInsightGenerator, type AIReportInsights } from './BusinessInsightGenerator';
import { PDFReportGenerator } from './PDFReportGenerator';
import { PDFService } from '../pdfService';
import { jsPDF } from 'jspdf';

export class AIReportService {
  /**
   * Orchestrates the complete generation of the 10-page Power BI style report.
   * Runs analytical calculations over ALL data in IndexedDB.
   */
  static async generateReport(mode: 'download' | 'preview' | 'print' = 'download'): Promise<string | null> {
    const result = await this.generateReportAndInsights(mode);
    return result.previewUrl;
  }

  /**
   * Generates both the rich analytical insights and the PDF document output.
   */
  static async generateReportAndInsights(mode: 'download' | 'preview' | 'print' = 'preview'): Promise<{ insights: AIReportInsights; previewUrl: string | null }> {
    try {
      // 1. Fetch raw lists from Dexie tables
      const [
        products,
        categories,
        customers,
        suppliers,
        sales,
        saleItems,
        purchases,
        expenses,
        expenseCategories,
        creditPayments,
        creditAccounts,
        auditLogs,
        stockHistory,
        branding
      ] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray(),
        db.customers.toArray(),
        db.suppliers.toArray(),
        db.sales.toArray(),
        db.saleItems.toArray(),
        db.purchases.toArray(),
        db.expenses.toArray(),
        db.expenseCategories.toArray(),
        db.creditPayments.toArray(),
        db.creditAccounts.toArray(),
        db.auditLogs.toArray(),
        db.stockHistory.toArray(),
        getShopBranding()
      ]);

      const operatorUser = 'Enterprise Architect';

      // 2. Feed datasets to BusinessInsightGenerator to run full analytics
      const insights = BusinessInsightGenerator.generate({
        products,
        categories,
        customers,
        suppliers,
        sales,
        saleItems,
        purchases,
        expenses,
        expenseCategories,
        creditPayments,
        creditAccounts,
        auditLogs,
        stockHistory,
        shopName: branding.shopName,
        operatorUser
      });

      // 3. Render 10-page PDF document
      const doc = await PDFReportGenerator.generate(insights);

      // 4. Handle output according to requested mode
      const previewUrl = PDFService.handlePDFOutput(doc, 'AI_Business_Intelligence_Report', mode);
      return { insights, previewUrl: previewUrl || null };
    } catch (error) {
      console.error('Error generating AI Business Report and Insights:', error);
      throw error;
    }
  }
}

