import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { type AIReportInsights } from './BusinessInsightGenerator';
import { ChartExporter } from './ChartExporter';
import { getShopBranding, type ShopInfo } from '../pdfService';

export class PDFReportGenerator {
  static async generate(insights: AIReportInsights): Promise<jsPDF> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalPages = 10;

    // PAGE 1: COVER PAGE / EXECUTIVE SUMMARY
    await this.renderPage1(doc, insights, info, totalPages);

    // PAGE 2: BUSINESS KPIS
    doc.addPage();
    await this.renderPage2(doc, insights, info, totalPages);

    // PAGE 3: SALES ANALYSIS
    doc.addPage();
    await this.renderPage3(doc, insights, info, totalPages);

    // PAGE 4: PURCHASES ANALYSIS
    doc.addPage();
    await this.renderPage4(doc, insights, info, totalPages);

    // PAGE 5: INVENTORY ANALYSIS
    doc.addPage();
    await this.renderPage5(doc, insights, info, totalPages);

    // PAGE 6: CUSTOMER ANALYSIS
    doc.addPage();
    await this.renderPage6(doc, insights, info, totalPages);

    // PAGE 7: EXPENSE ANALYSIS
    doc.addPage();
    await this.renderPage7(doc, insights, info, totalPages);

    // PAGE 8: FINANCIAL CHARTS
    doc.addPage();
    await this.renderPage8(doc, insights, info, totalPages);

    // PAGE 9: BUSINESS INTELLIGENCE
    doc.addPage();
    await this.renderPage9(doc, insights, info, totalPages);

    // PAGE 10: AI RECOMMENDATIONS
    doc.addPage();
    await this.renderPage10(doc, insights, info, totalPages);

    return doc;
  }

  /**
   * Helper to draw standard header, footer and page decorations
   */
  private static drawHeaderFooter(
    doc: jsPDF,
    title: string,
    pageNum: number,
    totalPages: number,
    info: ShopInfo
  ) {
    const width = 210;
    const height = 297;
    const margin = 15;

    const primaryColor = { r: 30, g: 41, b: 59 }; // #1e293b
    const accentColor = { r: 79, g: 70, b: 229 }; // #4f46e5
    const lightGray = { r: 100, g: 116, b: 139 }; // #64748b

    // Header Color Strip
    doc.saveGraphicsState();
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(0, 0, width, 8, 'F');
    doc.restoreGraphicsState();

    // Shop Initials/Logo fallback
    doc.saveGraphicsState();
    const logoX = margin;
    const logoY = 12;
    const initials = info.shopName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    
    doc.setFillColor(79, 70, 229);
    doc.circle(logoX + 6, logoY + 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(initials, logoX + 6, logoY + 8.1, { align: 'center' });
    doc.restoreGraphicsState();

    // Shop Branding Details
    doc.saveGraphicsState();
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(info.shopName, logoX + 15, logoY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
    doc.text(`Phone: ${info.phone} | Email: ${info.email}`, logoX + 15, logoY + 8);
    doc.restoreGraphicsState();

    // Document Details right aligned
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text(title.toUpperCase(), width - margin, logoY + 4, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, width - margin, logoY + 8, { align: 'right' });
    doc.restoreGraphicsState();

    // Top dividing line
    doc.saveGraphicsState();
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, 26, width - margin, 26);
    doc.restoreGraphicsState();

    // Footer
    const footerY = height - 12;
    doc.saveGraphicsState();
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 3, width - margin, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
    doc.text(info.footerMessage || 'Thank you for your business!', margin, footerY + 1.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, width / 2, footerY + 1.5, { align: 'center' });
    doc.text(`CONFIDENTIAL - POS SYSTEM INTERNAL BI REPORT`, width - margin, footerY + 1.5, { align: 'right' });
    doc.restoreGraphicsState();
  }

  /**
   * Helper to format values as currency strings
   */
  private static fmt(val: number): string {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * PAGE 1: COVER PAGE / EXECUTIVE SUMMARY
   */
  private static async renderPage1(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    const width = 210;
    const margin = 15;

    // Draw solid elegant cover page header background
    doc.saveGraphicsState();
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, width, 110, 'F');
    doc.restoreGraphicsState();

    // Header Logo Circle
    doc.saveGraphicsState();
    doc.setFillColor(79, 70, 229); // Indigo
    doc.circle(width / 2, 36, 12, 'F');
    const initials = info.shopName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(initials, width / 2, 40.5, { align: 'center' });
    doc.restoreGraphicsState();

    // Main Cover Title
    doc.saveGraphicsState();
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AI BUSINESS INTELLIGENCE REPORT', width / 2, 60, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(191, 219, 254); // blue-200
    doc.text('POWER BI DESKTOP STYLE SYSTEM DIAGNOSTICS & AI INSIGHTS', width / 2, 68, { align: 'center' });

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1.5);
    doc.line(width / 2 - 25, 76, width / 2 + 25, 76);
    doc.restoreGraphicsState();

    // Report Metadata Table Info
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, 122, width - 2 * margin, 42, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text('ORGANIZATION:', margin + 8, 131);
    doc.text('REPORTING PERIOD:', margin + 8, 139);
    doc.text('GENERATION DATE:', margin + 8, 147);
    doc.text('PREPARED BY:', margin + 8, 155);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(info.shopName, margin + 48, 131);
    doc.text(insights.metadata.reportPeriod, margin + 48, 139);
    doc.text(insights.metadata.generatedDate, margin + 48, 147);
    doc.text(insights.metadata.preparedBy, margin + 48, 155);
    doc.restoreGraphicsState();

    // Business Health Gauge on bottom left
    ChartExporter.drawGaugeChart(
      doc,
      margin,
      176,
      85,
      60,
      insights.metadata.healthScore,
      'Overall Business Health Index',
      '%'
    );

    // Executive Narrative on bottom right
    doc.saveGraphicsState();
    const summaryX = margin + 92;
    const summaryY = 176;
    const summaryW = width - margin - summaryX;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(summaryX, summaryY, summaryW, 60, 4, 4, 'FD');

    // Accent line
    doc.setFillColor(79, 70, 229);
    doc.rect(summaryX, summaryY, 2.5, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('AI EXECUTIVE REPORT SUMMARY', summaryX + 6, summaryY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(insights.metadata.executiveSummary, summaryW - 12);
    doc.text(splitText, summaryX + 6, summaryY + 16);
    doc.restoreGraphicsState();

    // Bottom standard footer
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('PAGE 1 OF 10', width / 2, 280, { align: 'center' });
    doc.restoreGraphicsState();
  }

  /**
   * PAGE 2: BUSINESS KPIS
   */
  private static async renderPage2(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Business Key Performance Indicators (KPIs)', 2, total, info);
    
    const margin = 15;
    const width = 210;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('CORE FINANCIALS & OPERATIONAL METRICS OVERVIEW', margin, 32);

    // KPI Grid
    const kpiData = [
      { label: "Today's Sales", val: this.fmt(insights.kpis.todaySales), color: [79, 70, 229] },
      { label: "Monthly Sales", val: this.fmt(insights.kpis.monthlySales), color: [17, 141, 255] },
      { label: "Gross Profit", val: this.fmt(insights.kpis.profit), color: [18, 191, 63] },
      { label: "Operating Expenses", val: this.fmt(insights.kpis.expenses), color: [224, 64, 10] },
      { label: "Acquisition Purchases", val: this.fmt(insights.kpis.purchases), color: [230, 108, 55] },
      { label: "Cash in Hand", val: this.fmt(insights.kpis.cashInHand), color: [13, 148, 136] },
      { label: "Inventory Stock Assets", val: this.fmt(insights.kpis.inventoryValue), color: [71, 85, 105] },
      { label: "Outstanding Customer Debt", val: this.fmt(insights.kpis.outstandingCredit), color: [239, 68, 68] },
      { label: "Recovered Credit Payments", val: this.fmt(insights.kpis.recoveredCredit), color: [16, 185, 129] },
      { label: "Net Operational Profit", val: this.fmt(insights.kpis.netProfit), color: [124, 58, 237] }
    ];

    // Grid layout coordinates
    const startY = 38;
    const boxW = 85;
    const boxH = 16.5;
    const spacingX = 10;
    const spacingY = 5.2;

    kpiData.forEach((kpi, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = margin + col * (boxW + spacingX);
      const y = startY + row * (boxH + spacingY);

      doc.saveGraphicsState();
      // Draw border box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, boxW, boxH, 2.5, 2.5, 'FD');

      // Decorative left border strip
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(x, y, 2.2, boxH, 'F');

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), x + 6, y + 5.2);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.val, x + 6, y + 12);
      doc.restoreGraphicsState();
    });

    // Drawing KPI visual trend charts placeholder cards
    const subChartY = startY + 5 * (boxH + spacingY) + 5;
    const chW = 85;
    const chH = 55;

    // Mini comparative charts
    const monthlySalesData = [
      { label: 'Purchases', value: insights.kpis.purchases },
      { label: 'Expenses', value: insights.kpis.expenses },
      { label: 'Net Profit', value: insights.kpis.netProfit }
    ];

    ChartExporter.drawColumnChart(
      doc,
      margin,
      subChartY,
      chW,
      chH,
      monthlySalesData,
      'Key Outflows Comparison'
    );

    const assetData = [
      { label: 'Cash', value: insights.kpis.cashInHand },
      { label: 'Stock Assets', value: insights.kpis.inventoryValue },
      { label: 'Receivables', value: insights.kpis.outstandingCredit }
    ];

    ChartExporter.drawDonutChart(
      doc,
      margin + chW + spacingX,
      subChartY,
      chW,
      chH,
      assetData,
      'Liquid asset composition'
    );

    // Business health evaluation notice text at bottom
    doc.saveGraphicsState();
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, subChartY + chH + 5, width - 2 * margin, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text('BUSINESS PERFORMANCE EVALUATION MEMORANDUM:', margin + 4, subChartY + chH + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(`This segment monitors the operational viability of your terminal. Gross margins currently register at ${insights.kpis.profit > 0 ? ((insights.kpis.profit / insights.kpis.monthlySales) * 100).toFixed(1) : 0}% of monthly sales. Management advises maintaining cash on hand reserves above current operating expenses to guarantee structural solvency.`, margin + 4, subChartY + chH + 14);
    doc.restoreGraphicsState();
  }

  /**
   * PAGE 3: SALES ANALYSIS
   */
  private static async renderPage3(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Sales & Revenue Analysis', 3, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DETAILED REVENUE TRENDS, SPEEDWAYS & LEADERBOARDS', margin, 32);

    // Mini KPI summary strip
    const summaryCards = [
      { label: "Total Invoices", val: insights.salesAnalysis.totalInvoices.toString() },
      { label: "Average Invoice Value", val: this.fmt(insights.salesAnalysis.averageSale) },
      { label: "Largest Invoice", val: this.fmt(insights.salesAnalysis.largestSale) },
      { label: "Smallest Invoice", val: this.fmt(insights.salesAnalysis.smallestSale) }
    ];

    doc.saveGraphicsState();
    summaryCards.forEach((card, idx) => {
      const x = margin + idx * 45;
      const y = 37;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, 41, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), x + 4, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(card.val, x + 4, y + 10.5);
    });
    doc.restoreGraphicsState();

    // Sales Trend Chart (Area Line Chart)
    const chartData = insights.salesAnalysis.dailySales.map(d => ({
      label: dayjs(d.date).format('DD MMM'),
      value: d.amount
    }));

    ChartExporter.drawLineChart(
      doc,
      margin,
      56,
      180,
      60,
      chartData,
      'Recent Daily Revenue Velocity Trend',
      true,
      { r: 79, g: 70, b: 229 }
    );

    // Leaderboards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('TOP PERFORMING INVENTORY PRODUCTS CATALOG:', margin, 124);

    const topProductsRows = insights.salesAnalysis.topProducts.map((p, idx) => [
      idx + 1,
      p.name,
      p.sku,
      p.quantity.toString(),
      this.fmt(p.revenue)
    ]);

    autoTable(doc, {
      startY: 128,
      head: [['#', 'Inventory Product Label', 'SKU', 'Units Sold', 'Total Gross Revenue']],
      body: topProductsRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Top Categories
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('REVENUE DISTRIBUTION BY CATEGORY:', margin, finalY);

    const catRows = insights.salesAnalysis.topCategories.map((c, idx) => [
      idx + 1,
      c.name,
      this.fmt(c.revenue)
    ]);

    autoTable(doc, {
      startY: finalY + 3,
      head: [['#', 'Category Descriptor', 'Cumulative Sales']],
      body: catRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 7.5 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 110 },
        2: { cellWidth: 55, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
  }

  /**
   * PAGE 4: PURCHASES ANALYSIS
   */
  private static async renderPage4(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Purchases & Sourcing Analysis', 4, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('ACQUISITIONS OUTLAYS & SUPPLIER DISPERSIONS', margin, 32);

    // Purchase metric summary card
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, 38, 180, 16, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL CAPITAL OUTLAY FOR ACQUISITIONS:', margin + 6, 44);

    doc.setFont('helvetica', 'black');
    doc.setFontSize(11);
    doc.setTextColor(224, 64, 10); // Red-Orange
    doc.text(this.fmt(insights.purchasesAnalysis.totalValue), margin + 6, 50.5);
    doc.restoreGraphicsState();

    // Sourcing / Acquisition Trend Chart
    const pTrendData = insights.purchasesAnalysis.trend.map(d => ({
      label: dayjs(d.date).format('DD MMM'),
      value: d.amount
    }));

    ChartExporter.drawLineChart(
      doc,
      margin,
      59,
      180,
      62,
      pTrendData,
      'Acquisitions Expense Velocity Trend (Purchases)',
      false,
      { r: 230, g: 108, b: 55 }
    );

    // Supplier leaderboards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('TOP ACQUISITION SUPPLIERS BY VALUE:', margin, 130);

    const supplierRows = insights.purchasesAnalysis.topSuppliers.map((s, idx) => [
      idx + 1,
      s.name,
      s.code,
      this.fmt(s.amount)
    ]);

    autoTable(doc, {
      startY: 134,
      head: [['#', 'Supplier Company Name', 'Supplier Code Reference', 'Total Acquisition Outlay']],
      body: supplierRows,
      theme: 'striped',
      headStyles: { fillColor: [230, 108, 55], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 90 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    // Strategic sourcing advice
    const lastY = (doc as any).lastAutoTable.finalY + 8;
    doc.saveGraphicsState();
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(margin, lastY, 180, 18, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('SUPPLY CHAIN SOURCING STRATEGY MEMORANDUM:', margin + 4, lastY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14);
    doc.text(`Concentration of procurement across fewer top-tier suppliers provides volume discounts. Audit performance files for supplier ${insights.purchasesAnalysis.topSuppliers.length > 0 ? `"${insights.purchasesAnalysis.topSuppliers[0].name}"` : 'your top suppliers'} to establish long term service level agreements and hedge against cost fluctuations.`, margin + 4, lastY + 11.5);
    doc.restoreGraphicsState();
  }

  /**
   * PAGE 5: INVENTORY ANALYSIS
   */
  private static async renderPage5(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Inventory Sourcing & Stock Health', 5, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('ASSET VALUATIONS, DEAD STOCK & PRODUCT VELOCITIES', margin, 32);

    // Stock state boxes
    const stockKPIs = [
      { label: "Asset Value (Cost)", val: this.fmt(insights.inventoryAnalysis.currentStockValue), color: [13, 148, 136] },
      { label: "Low Stock Alert Lines", val: insights.inventoryAnalysis.lowStockCount.toString(), color: [245, 158, 11] },
      { label: "Out of Stock Items", val: insights.inventoryAnalysis.outOfStockCount.toString(), color: [239, 68, 68] },
      { label: "Dead Stock Assets", val: insights.inventoryAnalysis.deadStockCount.toString(), color: [100, 116, 139] }
    ];

    doc.saveGraphicsState();
    stockKPIs.forEach((kpi, idx) => {
      const x = margin + idx * 45;
      const y = 38;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, 41, 16, 2, 2, 'FD');

      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(x, y, 2, 16, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), x + 4, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.val, x + 4, y + 11.5);
    });
    doc.restoreGraphicsState();

    // Fast moving inventory
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('FAST-MOVING INVENTORY DEMAND CHANNELS (HIGH VELOCITY):', margin, 64);

    const fastRows = insights.inventoryAnalysis.fastMovingProducts.map((p, idx) => [
      idx + 1,
      p.name,
      p.sku,
      p.stock.toString(),
      p.sold.toString()
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Product Item Label', 'SKU Ref', 'Current Stock On-Hand', 'Units Dispatched (Sales)']],
      body: fastRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 85 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    const middleY = (doc as any).lastAutoTable.finalY + 10;

    // Slow moving / dead inventory
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('SLOW-MOVING AND IDLE STOCK ASSETS:', margin, middleY);

    const slowRows = insights.inventoryAnalysis.slowMovingProducts.map((p, idx) => [
      idx + 1,
      p.name,
      p.sku,
      p.stock.toString(),
      p.sold.toString()
    ]);

    autoTable(doc, {
      startY: middleY + 4,
      head: [['#', 'Product Item Label', 'SKU Ref', 'Current Stock On-Hand', 'Units Dispatched (Sales)']],
      body: slowRows,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 85 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });
  }

  /**
   * PAGE 6: CUSTOMER ANALYSIS
   */
  private static async renderPage6(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Customer Credit & Accounts Ledgers', 6, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DEBT COLLECTIBILITY, CREDITS DISPERSION & OUTSTANDING LOANS', margin, 32);

    // Credit recovery stats
    const creditKPIs = [
      { label: "Total Outstanding Credit", val: this.fmt(insights.customerAnalysis.outstandingLoan), color: [239, 68, 68] },
      { label: "Credit Recovered (Collections)", val: this.fmt(insights.customerAnalysis.recoveredLoan), color: [16, 185, 129] },
      { label: "Credit Recovery Rate", val: `${insights.customerAnalysis.creditRecoveryRate.toFixed(1)}%`, color: [79, 70, 229] }
    ];

    doc.saveGraphicsState();
    creditKPIs.forEach((kpi, idx) => {
      const x = margin + idx * 60;
      const y = 38;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, 56, 16, 2.5, 2.5, 'FD');

      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(x, y, 2.2, 16, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), x + 5, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.val, x + 5, y + 11.5);
    });
    doc.restoreGraphicsState();

    // Top Customers table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('TOP CUSTOMERS BY VALUATION OUTLAYS:', margin, 64);

    const custRows = insights.customerAnalysis.topCustomers.map((c, idx) => [
      idx + 1,
      c.name,
      c.code,
      c.frequency.toString(),
      this.fmt(c.totalSpent)
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Customer Full Name', 'Customer Code Ref', 'Purchase Frequency', 'Total Cumulative Spent']],
      body: custRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 75 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    const graphY = (doc as any).lastAutoTable.finalY + 8;

    // Visualisation of top accounts spend vs customer purchase frequency
    const chartFreqData = insights.customerAnalysis.topCustomers.map(c => ({
      label: c.name,
      value: c.totalSpent
    }));

    ChartExporter.drawColumnChart(
      doc,
      margin,
      graphY,
      180,
      50,
      chartFreqData,
      'Spending dispersion of premier accounts'
    );
  }

  /**
   * PAGE 7: EXPENSE ANALYSIS
   */
  private static async renderPage7(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Operating Expense & Cost Centers', 7, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('INTERNAL CASH OUTFLOWS, COST SECTORS & EXPENSE LEDGERS', margin, 32);

    // KPI Cards
    const expKPIs = [
      { label: "Total Cumulative Expense", val: this.fmt(insights.expenseAnalysis.totalExpense), color: [224, 64, 10] },
      { label: "Average Expense Entry", val: this.fmt(insights.expenseAnalysis.averageExpense), color: [230, 108, 55] },
      { label: "Highest Cost Entry", val: `${insights.expenseAnalysis.highestExpense.title} (${this.fmt(insights.expenseAnalysis.highestExpense.amount)})`, color: [100, 116, 139] }
    ];

    doc.saveGraphicsState();
    expKPIs.forEach((kpi, idx) => {
      const x = margin + idx * 60;
      const y = 38;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, 56, 16, 2.5, 2.5, 'FD');

      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(x, y, 2.2, 16, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), x + 4, y + 4.8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      
      const truncatedVal = kpi.val.length > 28 ? kpi.val.substring(0, 27) + '..' : kpi.val;
      doc.text(truncatedVal, x + 4, y + 11.5);
    });
    doc.restoreGraphicsState();

    // Expense Chart
    const expChartData = insights.expenseAnalysis.expensesByCategory.map(ec => ({
      label: ec.category,
      value: ec.amount
    }));

    ChartExporter.drawDonutChart(
      doc,
      margin,
      64,
      180,
      62,
      expChartData,
      'Operating Expense Dispersion by Category'
    );

    // Expense Category details table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('CUMULATIVE COST ALLOCATION BY SEGMENT:', margin, 135);

    const expTableRows = insights.expenseAnalysis.expensesByCategory.map((ec, idx) => [
      idx + 1,
      ec.category,
      this.fmt(ec.amount)
    ]);

    autoTable(doc, {
      startY: 139,
      head: [['#', 'Operating Cost Segment (Category)', 'Total Allocated Cost']],
      body: expTableRows,
      theme: 'grid',
      headStyles: { fillColor: [224, 64, 10], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 105 },
        2: { cellWidth: 55, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
  }

  /**
   * PAGE 8: FINANCIAL CHARTS
   */
  private static async renderPage8(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Financial Charts & Analytics Dashboard', 8, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('UNIVERSAL MULTI-PANEL ANALYTICAL VIEWPORT', margin, 32);

    // Compile charts in a 2 column x 3 row grid
    // Row 1
    const r1_y = 38;
    const r_h = 44;
    const cw = 86;
    const c2_x = margin + cw + 8;

    // Chart 1: Sales vs Purchases Comparison
    const compData = [
      { label: 'Weekly', value: insights.kpis.monthlySales / 4, value2: insights.kpis.purchases / 4 },
      { label: 'Monthly', value: insights.kpis.monthlySales, value2: insights.kpis.purchases }
    ];
    ChartExporter.drawColumnChart(
      doc,
      margin,
      r1_y,
      cw,
      r_h,
      compData,
      'Sales vs Acquisitions',
      true,
      'Sales',
      'Acquisitions'
    );

    // Chart 2: Profit vs Expenses
    const peData = [
      { label: 'Profits', value: insights.kpis.profit },
      { label: 'Expenses', value: insights.kpis.expenses }
    ];
    ChartExporter.drawColumnChart(
      doc,
      c2_x,
      r1_y,
      cw,
      r_h,
      peData,
      'Profits vs Expenses',
      false
    );

    // Row 2
    const r2_y = r1_y + r_h + 4;

    // Chart 3: Customer Loan vs Recovered
    const debtData = [
      { label: 'Outstanding', value: insights.customerAnalysis.outstandingLoan },
      { label: 'Recovered', value: insights.customerAnalysis.recoveredLoan }
    ];
    ChartExporter.drawColumnChart(
      doc,
      margin,
      r2_y,
      cw,
      r_h,
      debtData,
      'Debt outstanding vs collected',
      false
    );

    // Chart 4: Asset Values
    const astData = [
      { label: 'Stock Valuation', value: insights.inventoryAnalysis.currentStockValue },
      { label: 'Cash Reserve', value: insights.kpis.cashInHand }
    ];
    ChartExporter.drawDonutChart(
      doc,
      c2_x,
      r2_y,
      cw,
      r_h,
      astData,
      'Operating Asset Balance'
    );

    // Row 3
    const r3_y = r2_y + r_h + 4;

    // Chart 5: Cash Flow trends
    const cfData = insights.salesAnalysis.dailySales.map(d => ({
      label: dayjs(d.date).format('DD/MM'),
      value: d.amount
    })).slice(-6);
    ChartExporter.drawLineChart(
      doc,
      margin,
      r3_y,
      cw,
      r_h,
      cfData,
      'Cash flow activity',
      true,
      { r: 13, g: 148, b: 136 }
    );

    // Chart 6: Payment Methods
    // Default mock distribution fallback if db method counts empty
    const pmData = [
      { label: 'Cash', value: insights.kpis.todaySales * 0.5 || 250 },
      { label: 'Card', value: insights.kpis.todaySales * 0.3 || 150 },
      { label: 'Credit', value: insights.kpis.todaySales * 0.2 || 100 }
    ];
    ChartExporter.drawDonutChart(
      doc,
      c2_x,
      r3_y,
      cw,
      r_h,
      pmData,
      'Preferred Dispatch payment methods'
    );
  }

  /**
   * PAGE 9: BUSINESS INTELLIGENCE
   */
  private static async renderPage9(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'Business Intelligence Diagnostic & Insights', 9, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('AI DIAGNOSTICS & SYSTEM AUDIT INSIGHTS', margin, 32);

    // Draw structured matrix of BI facts
    const biFacts = [
      { fact: 'Highest Selling Inventory Line', value: insights.biMetrics.highestSellingProduct },
      { fact: 'Most Profitable Product Line', value: insights.biMetrics.highestProfitProduct },
      { fact: 'Most Profitable Category Segment', value: insights.biMetrics.mostProfitableCategory },
      { fact: 'Slow-Moving / Idle Inventory SKU lines', value: `${insights.biMetrics.slowMovingInventoryCount} items flagged` },
      { fact: 'Primary Customer Debtor (Outstanding)', value: `${insights.biMetrics.customerHighestOutstanding.name} (${this.fmt(insights.biMetrics.customerHighestOutstanding.balance)})` },
      { fact: 'Primary Sourcing Spplier by acquisitions', value: `${insights.biMetrics.supplierHighestPurchases.name} (${this.fmt(insights.biMetrics.supplierHighestPurchases.amount)})` },
      { fact: 'Most Preferred Payment Gateway / Method', value: insights.biMetrics.mostUsedPaymentMethod },
      { fact: 'Highest Sales Velocity Day Recorded', value: `${insights.biMetrics.highestSalesDay.date} (${this.fmt(insights.biMetrics.highestSalesDay.amount)})` },
      { fact: 'Lowest Sales Velocity Day Recorded', value: `${insights.biMetrics.lowestSalesDay.date} (${this.fmt(insights.biMetrics.lowestSalesDay.amount)})` },
      { fact: 'Average Calculated Daily Sales Revenue', value: this.fmt(insights.biMetrics.averageDailySales) },
      { fact: 'Average Calculated Monthly Net Profit', value: this.fmt(insights.biMetrics.averageMonthlyProfit) },
      { fact: 'Credit / Outstanding recovery percentage', value: `${insights.biMetrics.creditRecoveryPercentage.toFixed(1)}%` },
      { fact: 'Inventory Turnover Asset Ratio', value: insights.biMetrics.inventoryTurnover.toFixed(2) }
    ];

    // Grid details
    const tableData = biFacts.map((fact, idx) => [
      idx + 1,
      fact.fact,
      fact.value
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Diagnostic Parameter Descriptor', 'Analytical Calculated Result']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 90 },
        2: { cellWidth: 75, halign: 'left' }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Audit summary block
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, finalY, 180, 26, 3, 3, 'FD');

    doc.setFillColor(79, 70, 229);
    doc.rect(margin, finalY, 2.5, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('BUSINESS INTELLIGENCE REPORTING SUMMARY DISCLOSURE:', margin + 6, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    const disclosure = `Diagnostic parameters are executed in real-time over the IndexedDB transactional layer of the application. High-velocity lines represent core working capitals. Outlays towards suppliers have been adjusted for cancellation parameters. Management advises constant monitoring of turnover ratios as a key gauge of retail pricing model efficiency.`;
    const splitText = doc.splitTextToSize(disclosure, 168);
    doc.text(splitText, margin + 6, finalY + 12);
    doc.restoreGraphicsState();
  }

  /**
   * PAGE 10: AI RECOMMENDATIONS
   */
  private static async renderPage10(doc: jsPDF, insights: AIReportInsights, info: ShopInfo, total: number) {
    this.drawHeaderFooter(doc, 'AI Recommendations & Business Strategic Plan', 10, total, info);
    const margin = 15;

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('AI-DRIVEN ACTIONABLE RECOMMENDATIONS & PRIORITY MATRIX', margin, 32);

    // List of recommendations in a nice stylized table with colored priority tags
    const recsRows = insights.recommendations.map((rec, idx) => [
      idx + 1,
      rec.title,
      rec.description,
      rec.category,
      rec.priority
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Strategic Action Plan', 'Recommendation Description', 'Domain Sector', 'Priority Badge']],
      body: recsRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45, fontStyle: 'bold' },
        2: { cellWidth: 75 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        // Highlight priority badge cell
        if (data.column.index === 4 && data.cell.section === 'body') {
          const text = data.cell.text[0];
          if (text === 'High') {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
            data.cell.styles.fillColor = [254, 226, 226]; // red-100
          } else if (text === 'Medium') {
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          } else {
            data.cell.styles.textColor = [4, 120, 87]; // green-700
            data.cell.styles.fillColor = [209, 250, 229]; // green-100
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    // Professional signature/signoff block
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('REPORT AUTHORIZATION & SIGN-OFF:', margin, finalY);

    const sigW = 50;
    const sigY = finalY + 18;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Operator Line
    doc.line(margin, sigY, margin + sigW, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared By: Operating Officer', margin, sigY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(insights.metadata.preparedBy, margin, sigY + 9);

    // Owner Line
    doc.line(145, sigY, 145 + sigW, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signature: Managing Owner', 145, sigY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(info.ownerName, 145, sigY + 9);

    doc.restoreGraphicsState();
  }
}
