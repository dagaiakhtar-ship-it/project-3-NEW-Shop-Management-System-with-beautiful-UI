import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { loadSetting } from '../utils/settingsHelpers';
import dayjs from 'dayjs';

export interface ShopInfo {
  shopName: string;
  shopLogo: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  taxNumber: string;
  ntn: string;
  strn: string;
  footerMessage: string;
}

export interface PDFGeneratorOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'thermal';
  currentUser?: string;
  showWatermark?: boolean;
}

// Global utility to load current shop branding configuration
export async function getShopBranding(): Promise<ShopInfo> {
  const shopName = await loadSetting('shop_name', 'ShopCraft Retail');
  const shopLogo = await loadSetting('shop_logo', '');
  const ownerName = await loadSetting('owner_name', 'John Doe');
  const phone = await loadSetting('phone', '+1 (555) 832-1920');
  const whatsapp = await loadSetting('whatsapp', '+1 (555) 832-1920');
  const email = await loadSetting('email', 'contact@shopcraft.com');
  const website = await loadSetting('website', 'www.shopcraft.com');
  const taxNumber = await loadSetting('tax_number', 'TAX-84291-SF');
  const ntn = await loadSetting('ntn', 'NTN-12948-3');
  const strn = await loadSetting('strn', 'STRN-58291-0');
  const address = await loadSetting('address', '120 Market Street, Suite 4A, San Francisco, CA');
  const footerMessage = await loadSetting('footer_message', 'Thank you for shopping with us!');

  return {
    shopName,
    shopLogo,
    ownerName,
    phone,
    whatsapp,
    email,
    website,
    address,
    taxNumber,
    ntn,
    strn,
    footerMessage,
  };
}

// Draw professional background and branding templates on A4 page
function drawPageDecorations(
  doc: jsPDF,
  info: ShopInfo,
  title: string,
  options: PDFGeneratorOptions,
  pageNum: number,
  totalPages: number
) {
  const isLandscape = options.orientation === 'landscape';
  const width = isLandscape ? 297 : 210;
  const height = isLandscape ? 210 : 297;
  const margin = 15;

  // Primary Theme Colors (Professional Slate / Navy)
  const primaryColor = { r: 30, g: 41, b: 59 }; // #1e293b
  const accentColor = { r: 79, g: 70, b: 229 }; // #4f46e5
  const lightGray = { r: 100, g: 116, b: 139 }; // #64748b

  // 1. Watermark if requested
  if (options.showWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(241, 245, 249); // slate-100
    doc.setFontSize(isLandscape ? 60 : 50);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'CONFIDENTIAL - FOR INTERNAL USE ONLY',
      width / 2,
      height / 2,
      { align: 'center', angle: isLandscape ? 30 : 45 }
    );
    doc.restoreGraphicsState();
  }

  // 2. Main Page Header Bar (only on A4/Letter size, not thermal)
  doc.saveGraphicsState();
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, width, 8); // Top solid banner
  doc.restoreGraphicsState();

  // 3. Shop Logo or Brand Initials
  const logoX = margin;
  const logoY = 14;
  if (info.shopLogo && info.shopLogo.startsWith('data:image/')) {
    try {
      doc.addImage(info.shopLogo, 'PNG', logoX, logoY, 18, 18);
    } catch (e) {
      console.warn('Failed to embed custom base64 logo image into PDF', e);
      drawFallbackLogo(doc, info.shopName, logoX, logoY);
    }
  } else {
    drawFallbackLogo(doc, info.shopName, logoX, logoY);
  }

  // 4. Shop Information
  doc.saveGraphicsState();
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(info.shopName, logoX + 22, logoY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  const detailsLine1 = `Phone: ${info.phone} | Email: ${info.email}`;
  const detailsLine2 = `Address: ${info.address}`;
  const detailsLine3 = `Tax ID: ${info.taxNumber} | NTN: ${info.ntn} | STRN: ${info.strn}`;
  doc.text(detailsLine1, logoX + 22, logoY + 9);
  doc.text(detailsLine2, logoX + 22, logoY + 13);
  doc.text(detailsLine3, logoX + 22, logoY + 17);
  doc.restoreGraphicsState();

  // 5. Document Type Title and Date Info
  doc.saveGraphicsState();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
  doc.text(title.toUpperCase(), width - margin, logoY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, width - margin, logoY + 9, { align: 'right' });
  doc.text(`Operator: ${options.currentUser || 'Administrator'}`, width - margin, logoY + 13, { align: 'right' });
  doc.text(`Website: ${info.website}`, width - margin, logoY + 17, { align: 'right' });
  doc.restoreGraphicsState();

  // Thin dividing line below header
  doc.saveGraphicsState();
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, 35, width - margin, 35);
  doc.restoreGraphicsState();

  // 6. Professional Page Footer
  const footerY = height - 10;
  doc.saveGraphicsState();
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 4, width - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
  doc.text(info.footerMessage || 'Thank you for your business!', margin, footerY);
  doc.text(`Page ${pageNum} of ${totalPages}`, width / 2, footerY, { align: 'center' });
  doc.text(`System Reference: POS-PDF-PRT-V9`, width - margin, footerY, { align: 'right' });
  doc.restoreGraphicsState();
}

// Fallback visual vector logo for shop
function drawFallbackLogo(doc: jsPDF, name: string, x: number, y: number) {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  doc.saveGraphicsState();
  doc.setFillColor(79, 70, 229); // #4f46e5 (Indigo accent)
  doc.circle(x + 9, y + 9, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(initials, x + 9, y + 12, { align: 'center' });
  doc.restoreGraphicsState();
}

// Global PDF Class containing generation logic for all systems
export class PDFService {
  /**
   * Universal helper to trigger PDF blob download, print window, or data-URI preview
   */
  static handlePDFOutput(doc: jsPDF, filename: string, mode: 'download' | 'preview' | 'print' = 'download'): any {
    if (mode === 'download') {
      doc.save(`${filename}.pdf`);
      return null;
    } else if (mode === 'print') {
      const blobUrl = doc.output('bloburl');
      const stringData = blobUrl instanceof URL ? blobUrl.toString() : (blobUrl as string);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = stringData;
      document.body.appendChild(iframe);
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      return null;
    } else {
      // Returns a data blob URL which can be loaded inside the custom preview dialog
      const blobUrl = doc.output('bloburl');
      return blobUrl instanceof URL ? blobUrl.toString() : (blobUrl as string);
    }
  }

  /**
   * 1. A4 INVOICE / RECEIPT PDF
   */
  static async generateInvoicePDF(
    sale: any,
    items: any[],
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const isLetter = false;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Cashier',
      showWatermark: sale.isDeleted || sale.status === 'Cancelled',
    };

    // Draw header / footer on first page
    drawPageDecorations(doc, info, 'TAX INVOICE', options, 1, 1);

    // Render Invoice Meta Grid
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('BILL TO:', 15, 43);
    doc.text('INVOICE DETAILS:', 115, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Customer Name: ${sale.customerName || sale.customer?.fullName || 'Walk-in Customer'}`, 15, 48);
    doc.text(`Phone / WhatsApp: ${sale.customer?.phone || 'N/A'}`, 15, 53);
    doc.text(`Address: ${sale.customer?.address || 'N/A'}`, 15, 58);
    doc.text(`Customer Code: ${sale.customer?.customerCode || 'CUST-WALKIN'}`, 15, 63);

    doc.text(`Invoice No: ${sale.invoiceNo}`, 115, 48);
    doc.text(`Date & Time: ${dayjs(sale.createdAt).format('YYYY-MM-DD hh:mm A')}`, 115, 53);
    doc.text(`Payment Status: ${sale.status || 'Completed'}`, 115, 58);
    doc.text(`Payment Method: ${sale.paymentMethod || 'Cash'}`, 115, 63);
    doc.restoreGraphicsState();

    // Table of Items
    const tableData = items.map((item, index) => [
      index + 1,
      item.productName || item.product?.name || 'Unknown Product',
      item.sku || item.product?.sku || '',
      item.quantity,
      `$${parseFloat(item.price || item.unitPrice || 0).toFixed(2)}`,
      `$${parseFloat(item.discount || 0).toFixed(2)}`,
      `$${parseFloat(item.taxAmount || 0).toFixed(2)}`,
      `$${parseFloat(item.subtotal || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Item Details', 'SKU', 'Qty', 'Unit Price', 'Disc', 'Tax', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 55 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 15, halign: 'right' },
        7: { cellWidth: 25, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
    });

    // Totals Block
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const labelX = 135;
    const valX = 195;

    doc.text('Subtotal:', labelX, finalY);
    doc.text(`$${parseFloat(sale.subtotal || 0).toFixed(2)}`, valX, finalY, { align: 'right' });

    doc.text('Total Discount:', labelX, finalY + 5);
    doc.text(`-$${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, valX, finalY + 5, { align: 'right' });

    doc.text('Total Tax:', labelX, finalY + 10);
    doc.text(`+$${parseFloat(sale.totalTax || 0).toFixed(2)}`, valX, finalY + 10, { align: 'right' });

    const isPaidInFull = sale.receivedAmount !== undefined && parseFloat(sale.receivedAmount) === parseFloat(sale.grandTotal || sale.totalAmount || 0);

    if (sale.receivedAmount !== undefined && !isPaidInFull) {
      doc.text('Received Amount:', labelX, finalY + 15);
      doc.text(`$${parseFloat(sale.receivedAmount || 0).toFixed(2)}`, valX, finalY + 15, { align: 'right' });

      doc.text('Change Due:', labelX, finalY + 20);
      doc.text(`$${parseFloat(sale.changeAmount || 0).toFixed(2)}`, valX, finalY + 20, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(79, 70, 229);
    const grandTotalY = (sale.receivedAmount !== undefined && !isPaidInFull) ? finalY + 26 : finalY + 17;
    doc.text('Grand Total:', labelX, grandTotalY);
    doc.text(`$${parseFloat(sale.grandTotal || sale.totalAmount || 0).toFixed(2)}`, valX, grandTotalY, { align: 'right' });

    // Terms and payment guidelines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('TERMS & CONDITIONS:', 15, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Payment is due instantly upon checkout completion.', 15, finalY + 5);
    doc.text('2. Please inspect goods before finalizing the POS purchase.', 15, finalY + 9);
    doc.text('3. Electronic products carry manufacturer warranty card specs only.', 15, finalY + 13);
    doc.text('4. Return requests require the original physical receipt present.', 15, finalY + 17);
    doc.restoreGraphicsState();

    // Re-draw decor to assert page counts
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'TAX INVOICE', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, `Invoice_${sale.invoiceNo}`, mode);
  }

  /**
   * 2. THERMAL RECEIPT (80mm) PDF
   */
  static async generateThermalReceiptPDF(
    sale: any,
    items: any[],
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const width = 80; // 80mm
    // Height is dynamic relative to items
    const minHeight = 120 + items.length * 10;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, minHeight],
    });

    // Draw Minimalist Header
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(info.shopName, width / 2, 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(info.address, width / 2, 12, { align: 'center', maxWidth: 70 });
    doc.text(`Tel: ${info.phone} | Tax: ${info.taxNumber}`, width / 2, 19, { align: 'center' });

    // Divider
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('========================================', width / 2, 23, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`POS SLIP - ${sale.invoiceNo}`, width / 2, 27, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Date: ${dayjs(sale.createdAt).format('YYYY-MM-DD HH:mm')}`, 5, 32);
    doc.text(`Cashier: ${operatorUser || 'POS Terminal'}`, 5, 36);
    doc.text(`Customer: ${sale.customerName || 'Walk-In'}`, 5, 40);

    doc.text('----------------------------------------------------------------------------------', width / 2, 44, { align: 'center' });
    doc.restoreGraphicsState();

    // Table elements
    let currentY = 48;
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Item / Details', 5, currentY);
    doc.text('Qty', 45, currentY, { align: 'center' });
    doc.text('Price', 58, currentY, { align: 'right' });
    doc.text('Total', 75, currentY, { align: 'right' });
    doc.restoreGraphicsState();

    currentY += 4;
    items.forEach(item => {
      doc.saveGraphicsState();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const name = item.productName || item.product?.name || 'Product';
      doc.text(name.substring(0, 24), 5, currentY);
      doc.text(`${item.quantity}`, 45, currentY, { align: 'center' });
      doc.text(`$${parseFloat(item.price || item.unitPrice || 0).toFixed(2)}`, 58, currentY, { align: 'right' });
      doc.text(`$${parseFloat(item.subtotal || 0).toFixed(2)}`, 75, currentY, { align: 'right' });
      doc.restoreGraphicsState();
      currentY += 4.5;
    });

    currentY += 1;
    doc.saveGraphicsState();
    doc.setFont('courier', 'normal');
    doc.text('----------------------------------------------------------------------------------', 5, currentY);
    doc.restoreGraphicsState();

    currentY += 5;
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Subtotal:', 45, currentY, { align: 'right' });
    doc.text(`$${parseFloat(sale.subtotal || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    currentY += 4;
    doc.text('Discount:', 45, currentY, { align: 'right' });
    doc.text(`-$${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    currentY += 4;
    doc.text('Tax Amount:', 45, currentY, { align: 'right' });
    doc.text(`+$${parseFloat(sale.totalTax || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('GRAND TOTAL:', 45, currentY, { align: 'right' });
    doc.text(`$${parseFloat(sale.grandTotal || sale.totalAmount || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    const isThermalPaidInFull = sale.receivedAmount !== undefined && parseFloat(sale.receivedAmount) === parseFloat(sale.grandTotal || sale.totalAmount || 0);

    if (sale.receivedAmount !== undefined && !isThermalPaidInFull) {
      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Cash Received:', 45, currentY, { align: 'right' });
      doc.text(`$${parseFloat(sale.receivedAmount).toFixed(2)}`, 75, currentY, { align: 'right' });

      currentY += 4;
      doc.text('Change Due:', 45, currentY, { align: 'right' });
      doc.text(`$${parseFloat(sale.changeAmount || 0).toFixed(2)}`, 75, currentY, { align: 'right' });
    }

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(info.footerMessage, width / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Software Powered by ShopCraft Suite', width / 2, currentY, { align: 'center' });
    doc.restoreGraphicsState();

    return PDFService.handlePDFOutput(doc, `ThermalSlip_${sale.invoiceNo}`, mode);
  }

  /**
   * 3. PURCHASE INVOICE / ORDER PDF
   */
  static async generatePurchasePDF(
    purchase: any,
    items: any[],
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Purchasing Officer',
    };

    drawPageDecorations(doc, info, 'PURCHASE RECORD', options, 1, 1);

    // Meta Details
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SUPPLIER INFO:', 15, 43);
    doc.text('ACQUISITION META:', 115, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Company Name: ${purchase.supplier?.companyName || 'Unknown Supplier'}`, 15, 48);
    doc.text(`Representative: ${purchase.supplier?.contactName || 'N/A'}`, 15, 53);
    doc.text(`Phone: ${purchase.supplier?.phone || 'N/A'}`, 15, 58);
    doc.text(`Supplier Code: ${purchase.supplier?.supplierCode || 'N/A'}`, 15, 63);

    doc.text(`Purchase No: ${purchase.purchaseNumber}`, 115, 48);
    doc.text(`Reference No: ${purchase.referenceNo || 'N/A'}`, 115, 53);
    doc.text(`Status: ${purchase.status || 'Received'}`, 115, 58);
    doc.text(`Date Loaded: ${dayjs(purchase.createdAt).format('YYYY-MM-DD hh:mm A')}`, 115, 63);
    doc.restoreGraphicsState();

    const tableData = items.map((item, index) => [
      index + 1,
      item.productName || item.product?.name || 'Unknown Item',
      item.sku || item.product?.sku || '',
      item.quantity,
      `$${parseFloat(item.costPrice || item.purchasePrice || item.unitPrice || 0).toFixed(2)}`,
      `$${parseFloat(item.taxAmount || 0).toFixed(2)}`,
      `$${parseFloat(item.subtotal || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Acquired Item', 'SKU', 'Quantity', 'Unit Cost', 'Tax App', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [47, 79, 79], textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 65 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal Cost:', 135, finalY);
    doc.text(`$${parseFloat(purchase.subtotal || 0).toFixed(2)}`, 195, finalY, { align: 'right' });

    doc.text('Other Charges:', 135, finalY + 5);
    doc.text(`+$${parseFloat(purchase.otherCharges || 0).toFixed(2)}`, 195, finalY + 5, { align: 'right' });

    doc.text('Discount Applied:', 135, finalY + 10);
    doc.text(`-$${parseFloat(purchase.discount || 0).toFixed(2)}`, 195, finalY + 10, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('NET OUTLAY:', 135, finalY + 17);
    doc.text(`$${parseFloat(purchase.grandTotal || purchase.totalAmount || 0).toFixed(2)}`, 195, finalY + 17, { align: 'right' });
    doc.restoreGraphicsState();

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'PURCHASE RECORD', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, `Purchase_${purchase.purchaseNumber}`, mode);
  }

  /**
   * 4. EXPENSE VOUCHER PDF
   */
  static async generateExpensePDF(
    expense: any,
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Accounts Officer',
    };

    drawPageDecorations(doc, info, 'EXPENSE PAYMENT VOUCHER', options, 1, 1);

    // Render Voucher Grid
    doc.saveGraphicsState();
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, 42, 180, 55, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`VOUCHER NO: ${expense.expenseNumber}`, 20, 49);
    doc.text(`DATE: ${dayjs(expense.expenseDate).format('YYYY-MM-DD')}`, 140, 49);

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 53, 190, 53);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Expense Title: ${expense.title}`, 20, 60);
    doc.text(`Category: ${expense.categoryName || 'General Office'}`, 20, 66);
    doc.text(`Recurrency: ${expense.isRecurring ? 'Monthly Recurring' : 'One-time Payment'}`, 20, 72);
    doc.text(`Status: ${expense.status || 'Approved'}`, 20, 78);
    doc.text(`Payment Method: ${expense.paymentMethod || 'Cash'}`, 20, 84);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`AMOUNT PAID: $${parseFloat(expense.amount || 0).toFixed(2)}`, 130, 84);
    doc.restoreGraphicsState();

    // Narrative description block
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VOUCHER NARRATION / BUSINESS JUSTIFICATION:', 15, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(expense.description || 'No additional narration provided for this corporate expenditure record.', 15, 111, { maxWidth: 180 });
    doc.restoreGraphicsState();

    // Signatures
    const sigY = 170;
    doc.saveGraphicsState();
    doc.setLineWidth(0.5);
    doc.setDrawColor(180, 180, 180);

    doc.line(15, sigY, 65, sigY);
    doc.text('Prepared By Cashier', 22, sigY + 5);

    doc.line(78, sigY, 128, sigY);
    doc.text('Accounts Auditor Signature', 82, sigY + 5);

    doc.line(140, sigY, 190, sigY);
    doc.text('Approved By Proprietor', 147, sigY + 5);
    doc.restoreGraphicsState();

    return PDFService.handlePDFOutput(doc, `ExpenseVoucher_${expense.expenseNumber}`, mode);
  }

  /**
   * 5. CUSTOMER LEDGER STATEMENT PDF
   */
  static async generateCustomerStatementPDF(
    customer: any,
    transactions: any[],
    meta: { openingBalance: number; closingBalance: number; outstanding: number },
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Credit Desk',
    };

    drawPageDecorations(doc, info, 'CUSTOMER CREDIT STATEMENT', options, 1, 1);

    // Profile Summary Header
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CREDIT CUSTOMER PROFILE:', 15, 43);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Customer Name: ${customer.fullName}`, 15, 48);
    doc.text(`Phone/Mobile: ${customer.phone || 'N/A'}`, 15, 53);
    doc.text(`Address: ${customer.address || 'N/A'}`, 15, 58);
    doc.text(`Credit Code: ${customer.customerCode}`, 15, 63);

    // Right Box with Summary Metrics
    doc.setDrawColor(210, 214, 219);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, 39, 75, 27, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.text(`Opening Ledger Balance:`, 123, 44);
    doc.text(`$${meta.openingBalance.toFixed(2)}`, 190, 44, { align: 'right' });

    doc.text(`Total Debits / Charges:`, 123, 49);
    doc.text(`$${transactions.reduce((acc, t) => acc + (t.type === 'Debit' ? t.amount : 0), 0).toFixed(2)}`, 190, 49, { align: 'right' });

    doc.text(`Total Credits / Payments:`, 123, 54);
    doc.text(`$${transactions.reduce((acc, t) => acc + (t.type === 'Credit' ? t.amount : 0), 0).toFixed(2)}`, 190, 54, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`Net Outstanding Balance:`, 123, 61);
    doc.text(`$${meta.outstanding.toFixed(2)}`, 190, 61, { align: 'right' });
    doc.restoreGraphicsState();

    const tableData = transactions.map((t, index) => [
      index + 1,
      dayjs(t.date).format('YYYY-MM-DD HH:mm'),
      t.referenceNo || 'N/A',
      t.description || 'Transaction',
      t.type === 'Debit' ? `$${t.amount.toFixed(2)}` : '-',
      t.type === 'Credit' ? `$${t.amount.toFixed(2)}` : '-',
      `$${t.runningBalance.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Date & Time', 'Reference', 'Description', 'Charges (Dr)', 'Payments (Cr)', 'Running Bal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 32 },
        2: { cellWidth: 25 },
        3: { cellWidth: 48 },
        4: { cellWidth: 23, halign: 'right' },
        5: { cellWidth: 23, halign: 'right' },
        6: { cellWidth: 24, halign: 'right' },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'CUSTOMER CREDIT STATEMENT', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, `CustomerStatement_${customer.customerCode}`, mode);
  }

  /**
   * 6. SUPPLIER LEDGER STATEMENT PDF
   */
  static async generateSupplierStatementPDF(
    supplier: any,
    purchases: any[],
    meta: { outstanding: number; totalPurchased: number },
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Purchasing Desk',
    };

    drawPageDecorations(doc, info, 'SUPPLIER OUTSTANDING LEDGER', options, 1, 1);

    // Profile Header
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('SUPPLIER ACCOUNT PROFILE:', 15, 43);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Company Name: ${supplier.companyName}`, 15, 48);
    doc.text(`Representative: ${supplier.contactName || 'N/A'}`, 15, 53);
    doc.text(`Phone: ${supplier.phone || 'N/A'}`, 15, 58);
    doc.text(`Supplier Code: ${supplier.supplierCode}`, 15, 63);

    // Summary Box
    doc.setDrawColor(210, 214, 219);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, 39, 75, 25, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Material Purchased:`, 123, 44);
    doc.text(`$${meta.totalPurchased.toFixed(2)}`, 190, 44, { align: 'right' });

    doc.text(`Total Settled Outlays:`, 123, 49);
    doc.text(`$${(meta.totalPurchased - meta.outstanding).toFixed(2)}`, 190, 49, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Current Payable Credit:`, 123, 56);
    doc.text(`$${meta.outstanding.toFixed(2)}`, 190, 56, { align: 'right' });
    doc.restoreGraphicsState();

    const tableData = purchases.map((p, index) => [
      index + 1,
      dayjs(p.createdAt).format('YYYY-MM-DD HH:mm'),
      p.purchaseNumber,
      p.referenceNo || 'N/A',
      p.status || 'Received',
      `$${parseFloat(p.grandTotal || p.totalAmount || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Acquisition Date', 'Purchase Number', 'Supplier Ref', 'Status', 'Invoice Outlay']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [47, 79, 79], textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30, halign: 'right' },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'SUPPLIER OUTSTANDING LEDGER', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, `SupplierStatement_${supplier.supplierCode}`, mode);
  }

  /**
   * 7. DASHBOARD SUMMARY PDF
   */
  static async generateDashboardPDF(
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
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'portrait',
      pageSize: 'a4',
      currentUser: operatorUser || 'Executive Auditor',
    };

    drawPageDecorations(doc, info, 'DASHBOARD EXECUTIVE SUMMARY', options, 1, 1);

    // Grid of Business Metrics (Two-column card blocks)
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('REAL-TIME ENTERPRISE METRICS (TODAY):', 15, 43);

    const drawMetricCard = (label: string, value: string, x: number, y: number, color: [number, number, number]) => {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, 85, 16, 2, 2, 'FD');
      
      // left indicator strip
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, 3, 16, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + 6, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      doc.text(value, x + 6, y + 12);
    };

    const red: [number, number, number] = [220, 38, 38];
    const green: [number, number, number] = [22, 163, 74];
    const indigo: [number, number, number] = [79, 70, 229];
    const amber: [number, number, number] = [217, 119, 6];

    drawMetricCard("Today's Gross Sales", `$${metrics.todaySales.toFixed(2)}`, 15, 48, green);
    drawMetricCard("Today's Net Profit", `$${metrics.todayProfit.toFixed(2)}`, 110, 48, green);

    drawMetricCard("Today's Purchases Outlay", `$${metrics.todayPurchases.toFixed(2)}`, 15, 68, red);
    drawMetricCard("Today's Operating Expenses", `$${metrics.todayExpenses.toFixed(2)}`, 110, 68, red);

    drawMetricCard("Active Outstanding Credit", `$${metrics.outstandingCredit.toFixed(2)}`, 15, 88, amber);
    drawMetricCard("Recovered Customer Credit", `$${metrics.recoveredCredit.toFixed(2)}`, 110, 88, indigo);

    drawMetricCard("Total Liquid Cash-in-Hand", `$${metrics.cashInHand.toFixed(2)}`, 15, 108, green);
    drawMetricCard("Assets Valuation (Stock Value)", `$${metrics.stockValue.toFixed(2)}`, 110, 108, indigo);
    doc.restoreGraphicsState();

    // Top Products Selling Table
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('CURRENT TOP SELLING PRODUCT CATALOG:', 15, 134);
    doc.restoreGraphicsState();

    const topProdRows = topProducts.map((p, index) => [
      index + 1,
      p.productName || p.name || 'Catalog Product',
      p.sku || 'N/A',
      p.categoryName || 'General',
      p.quantitySold || p.salesCount || 0,
      `$${parseFloat(p.revenue || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 138,
      head: [['#', 'Product Catalog Item', 'SKU', 'Category', 'Units Dispatched', 'Total Value Revenue']],
      body: topProdRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'DASHBOARD EXECUTIVE SUMMARY', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, 'Dashboard_Executive_Summary', mode);
  }

  /**
   * 8. PRODUCT CATALOG / PRICE & STOCK LIST PDF
   */
  static async generateProductCatalogPDF(
    products: any[],
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation: 'landscape',
      pageSize: 'a4',
      currentUser: operatorUser || 'Inventory Officer',
    };

    drawPageDecorations(doc, info, 'OFFLINE INVENTORY CATALOG & COST SHEET', options, 1, 1);

    const tableData = products.map((p, idx) => [
      idx + 1,
      p.sku,
      p.name,
      p.categoryName || 'General',
      p.supplierName || 'General',
      `$${parseFloat(p.costPrice || 0).toFixed(2)}`,
      `$${parseFloat(p.sellingPrice || 0).toFixed(2)}`,
      p.stockQuantity,
      p.stockQuantity <= (p.alertQuantity || 5) ? 'LOW STOCK' : 'IN STOCK',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'SKU ID', 'Product Specification Item', 'Category', 'Vendor / Supplier', 'Cost Price', 'Retail Price', 'Qty On Hand', 'Health']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 65 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40 },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 25, halign: 'center' },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, 'OFFLINE INVENTORY CATALOG & COST SHEET', options, i, pageCount);
    }

    return PDFService.handlePDFOutput(doc, 'Product_Catalog_Price_Sheet', mode);
  }

  /**
   * 9. GENERIC TABLE REPORT PDF
   * (Supports Sales Report, Purchase Report, Expense Report, Credit Reports, Logs, Settings etc.)
   */
  static async generateGenericReportPDF(
    title: string,
    headers: string[],
    rows: any[][],
    summaryCards: { label: string; value: string }[] = [],
    orientation: 'portrait' | 'landscape' = 'portrait',
    mode: 'download' | 'preview' | 'print' = 'download',
    operatorUser?: string
  ): Promise<any> {
    const info = await getShopBranding();
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const options: PDFGeneratorOptions = {
      orientation,
      pageSize: 'a4',
      currentUser: operatorUser || 'System Auditor',
    };

    drawPageDecorations(doc, info, title, options, 1, 1);

    let startY = 40;

    // Optional executive summary boxes
    if (summaryCards.length > 0) {
      doc.saveGraphicsState();
      const cardWidth = orientation === 'landscape' ? 60 : 42;
      const spacing = 5;
      summaryCards.forEach((card, index) => {
        const x = 15 + index * (cardWidth + spacing);
        const y = 40;
        
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, 14, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label.toUpperCase(), x + 3, y + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(card.value, x + 3, y + 10);
      });
      doc.restoreGraphicsState();
      startY = 60;
    }

    autoTable(doc, {
      startY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 15, right: 15 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPageDecorations(doc, info, title, options, i, pageCount);
    }

    const cleanFilename = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return PDFService.handlePDFOutput(doc, cleanFilename, mode);
  }
}
