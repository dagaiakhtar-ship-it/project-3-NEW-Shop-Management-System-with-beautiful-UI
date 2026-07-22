import { useCallback } from 'react';
import { type Sale, type SaleItem, type Customer } from '../database/db';
import { useShopSettings, useReceiptSettings } from './useSettings';

export interface PrintSettings {
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  taxNumber?: string;
  receiptFooter?: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  shopName: 'Super Mart POS',
  shopAddress: 'Commercial Zone, Phase 1, Springfield',
  shopPhone: '+1 (555) 012-3456',
  shopEmail: 'info@supermartpos.com',
  taxNumber: 'STRN-987654321-00',
  receiptFooter: 'Thank you for shopping with us! Please come again.'
};

/**
 * Hook to handle printing of professional sales receipts (both Thermal 80mm/58mm and A4 layouts).
 */
export function useReceiptPrinter() {
  const shop = useShopSettings();
  const receiptSettings = useReceiptSettings();

  const printReceipt = useCallback((
    sale: Sale,
    items: SaleItem[],
    customer: Customer | null,
    format: 'thermal' | 'a4' | 'thermal_58' = 'thermal',
    customSettings?: PrintSettings
  ) => {
    // Merge live settings, custom settings, and defaults
    const settings = {
      shopName: customSettings?.shopName || shop.shopName || 'Super Mart POS',
      shopAddress: customSettings?.shopAddress || shop.address || 'Commercial Zone, Phase 1, Springfield',
      shopPhone: customSettings?.shopPhone || shop.phone || '+1 (555) 012-3456',
      shopEmail: customSettings?.shopEmail || shop.email || 'info@supermartpos.com',
      taxNumber: customSettings?.taxNumber || shop.taxNumber || 'STRN-987654321-00',
      receiptFooter: customSettings?.receiptFooter || receiptSettings.customFooterText || 'Thank you for shopping with us! Please come again.'
    };
    
    // Create an iframe specifically for printing to avoid messing with the page style
    const iframeId = 'pos-print-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }
    
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      console.error('Cannot access iframe document for printing');
      return;
    }

    const isThermal = format === 'thermal' || format === 'thermal_58';
    const isThermal58 = format === 'thermal' || format === 'thermal_58';
    const titleText = isThermal ? 'Receipt' : 'Invoice';
    const customerName = customer ? customer.fullName || customer.name : (sale.customerName || 'Walk-in Customer');
    const customerPhone = customer ? customer.phone : '';
    const customerAddress = customer ? customer.address : '';
    
    const formattedDate = sale.saleDate 
      ? new Date(sale.saleDate).toLocaleString() 
      : sale.createdAt 
        ? new Date(sale.createdAt).toLocaleString() 
        : new Date().toLocaleString();

    let itemsHtml = '';
    items.forEach((item, index) => {
      const name = item.productName || `Product #${item.productId}`;
      const qty = item.quantity;
      const sPrice = item.sellingPrice ?? item.price ?? 0;
      const disc = item.discount ?? 0;
      const total = item.total ?? item.subtotal ?? (sPrice * qty);
      
      if (isThermal) {
        itemsHtml += `
          <tr style="border-bottom: 1px dashed #ddd;">
            <td style="padding: 4px 0; text-align: left; word-break: break-word; vertical-align: top;">
              <div style="font-weight: bold; color: #000; font-size: ${isThermal58 ? '10px' : '11px'};">${name}</div>
              <div style="font-size: ${isThermal58 ? '9px' : '10px'}; color: #444; margin-top: 1px;">
                ${qty} × $${sPrice.toFixed(2)}
                ${disc > 0 ? `<span style="color: #c62828; font-weight: bold; margin-left: 4px;">(Disc: -$${disc.toFixed(2)})</span>` : ''}
              </div>
            </td>
            <td style="padding: 4px 0; text-align: right; vertical-align: bottom; font-weight: bold; font-mono; font-size: ${isThermal58 ? '10px' : '11px'}; color: #000; width: 25%; font-family: monospace;">$${total.toFixed(2)}</td>
          </tr>
        `;
      } else {
        itemsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; text-align: center; color: #64748b;">${index + 1}</td>
            <td style="padding: 10px 8px; text-align: left;">
              <strong style="display: block; color: #0f172a; font-size: 13px;">${name}</strong>
              <small style="color: #64748b; font-size: 11px; font-family: monospace;">Barcode: ${item.barcode || 'N/A'}</small>
            </td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #334155;">$${sPrice.toFixed(2)}</td>
            <td style="padding: 10px 8px; text-align: center; font-family: monospace; color: #334155; font-weight: bold;">${qty}</td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #ef4444;">${disc > 0 ? `-$${disc.toFixed(2)}` : '$0.00'}</td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a; font-weight: bold;">$${total.toFixed(2)}</td>
          </tr>
        `;
      }
    });

    const subtotal = sale.subtotal ?? 0;
    const discount = sale.discount ?? 0;
    const tax = sale.tax ?? 0;
    const shipping = sale.shipping ?? 0;
    const otherCharges = sale.otherCharges ?? 0;
    const grandTotal = sale.grandTotal ?? sale.total ?? 0;
    const paidAmount = sale.paidAmount ?? 0;
    const remainingAmount = sale.remainingAmount ?? 0;
    const cashReceived = sale.cashReceived ?? 0;
    const changeReturned = sale.changeReturned ?? sale.changeAmount ?? 0;

    let contentHtml = '';

    if (isThermal58) {
      // Direct Thermal 58mm Layout
      contentHtml = `
        <html>
        <head>
          <title>${titleText} - ${sale.invoiceNo}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              width: 58mm;
              max-width: 58mm;
              padding: 2mm 1.5mm;
              font-size: 10px;
              color: #000;
              line-height: 1.3;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header-title { 
              font-size: 13px; 
              font-weight: 900; 
              margin-bottom: 2px; 
              text-transform: uppercase;
              letter-spacing: 0.3px;
              color: #000;
            }
            .divider { 
              border-bottom: 1.2px dashed #000; 
              margin: 6px 0; 
            }
            .info-grid {
              font-size: 9.5px;
              margin-bottom: 4px;
              line-height: 1.3;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1.5px;
            }
            .totals-table td { 
              padding: 2px 0; 
              font-size: 9.5px;
            }
            .grand-total-row {
              font-weight: 900; 
              font-size: 11px; 
              border-top: 1.2px solid #000; 
              border-bottom: 1.2px solid #000;
              text-transform: uppercase;
            }
            .grand-total-row td {
              padding: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">${settings.shopName}</div>
            <div style="font-size: 9px; font-weight: 500; margin-bottom: 1px;">${settings.shopAddress}</div>
            <div style="font-size: 9px; font-weight: 500;">Tel: ${settings.shopPhone}</div>
            ${receiptSettings.showTaxNumber && settings.taxNumber ? `<div style="font-size: 8.5px; margin-top: 1px; font-weight: bold;">Tax ID: ${settings.taxNumber}</div>` : ''}
            <div class="bold" style="margin-top: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #000; display: inline-block; padding: 1px 5px; border-radius: 2px;">SALES RECEIPT</div>
          </div>
 
          <div class="divider"></div>
 
          <div class="info-grid">
            <div class="info-row">
              <strong>Inv No:</strong>
              <span style="font-family: monospace; font-weight: bold;">${sale.invoiceNumber || sale.invoiceNo}</span>
            </div>
            <div class="info-row">
              <strong>Date:</strong>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <strong>Cashier:</strong>
              <span>${sale.createdBy || 'Cashier'}</span>
            </div>
            <div class="info-row">
              <strong>Customer:</strong>
              <span>${customerName}</span>
            </div>
          </div>
 
          <div class="divider"></div>
 
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 3px;">
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; padding-bottom: 3px; font-weight: bold; font-size: 9px;">Item Description</th>
                <th style="text-align: right; padding-bottom: 3px; font-weight: bold; font-size: 9px; width: 25%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
 
          <table class="totals-table" style="width: 100%; border-collapse: collapse; margin-top: 2px;">
            <tr>
              <td style="text-align: left;">Subtotal:</td>
              <td style="text-align: right; font-family: monospace;">$${subtotal.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `<tr><td style="text-align: left; font-weight: bold; color: #000;">Discount:</td><td style="text-align: right; font-family: monospace; font-weight: bold; color: #000;">-$${discount.toFixed(2)}</td></tr>` : ''}
            ${tax > 0 ? `<tr><td style="text-align: left;">Tax:</td><td style="text-align: right; font-family: monospace;">+$${tax.toFixed(2)}</td></tr>` : ''}
            ${shipping > 0 ? `<tr><td style="text-align: left;">Shipping:</td><td style="text-align: right; font-family: monospace;">+$${shipping.toFixed(2)}</td></tr>` : ''}
            ${otherCharges > 0 ? `<tr><td style="text-align: left;">Other:</td><td style="text-align: right; font-family: monospace;">+$${otherCharges.toFixed(2)}</td></tr>` : ''}
            
            <tr class="grand-total-row">
              <td style="text-align: left;">GRAND TOTAL:</td>
              <td style="text-align: right; font-family: monospace; font-size: 11.5px;">$${grandTotal.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td style="text-align: left; padding-top: 3px;">Amount Paid:</td>
              <td style="text-align: right; padding-top: 3px; font-family: monospace; font-weight: bold;">$${paidAmount.toFixed(2)}</td>
            </tr>
            ${remainingAmount > 0 ? `<tr style="font-weight: bold; color: #000;"><td style="text-align: left;">Outstanding:</td><td style="text-align: right; font-family: monospace;">+$${remainingAmount.toFixed(2)}</td></tr>` : ''}
            ${changeReturned > 0 ? `<tr style="font-weight: bold; color: #000;"><td style="text-align: left;">Change:</td><td style="text-align: right; font-family: monospace;">$${changeReturned.toFixed(2)}</td></tr>` : ''}
          </table>
 
          <div class="divider"></div>
 
          <div class="center" style="font-size: 8.5px; line-height: 1.3;">
            <div><strong>Method:</strong> ${sale.paymentMethod} | ${sale.paymentStatus || 'Paid'}</div>
          </div>
 
          <div class="divider"></div>
 
          <div class="center" style="margin-top: 5px;">
            ${receiptSettings.showQrCode ? `
            <div style="display: inline-block; border: 1px solid #000; padding: 2px; background: #fff; margin-bottom: 2px;">
              <div style="width: 30px; height: 30px; background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 5px 5px;"></div>
            </div>
            ` : ''}

            ${receiptSettings.showThankYouMessage ? `
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-top: 2px;">${shop.footerMessage || 'Thank you!'}</div>
            ` : ''}

            ${receiptSettings.showFooterMessage && settings.receiptFooter ? `
            <div style="font-size: 8px; margin-top: 2px; font-style: italic; max-width: 95%; margin-left: auto; margin-right: auto; line-height: 1.2;">
              ${settings.receiptFooter}
            </div>
            ` : ''}

            <div style="font-size: 7px; color: #555; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Powered by Vertex POS</div>
          </div>
        </body>
        </html>
      `;
    } else if ((format as string) === 'thermal') {
      // Thermal 80mm/58mm layout (Fluid responsive widths)
      contentHtml = `
        <html>
        <head>
          <title>${titleText} - ${sale.invoiceNo}</title>
          <style>
            @page { size: auto; margin: 0; }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              width: 100%;
              max-width: 100%;
              padding: 4mm 3mm;
              font-size: 11px;
              color: #000;
              line-height: 1.35;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header-title { 
              font-size: 15px; 
              font-weight: 900; 
              margin-bottom: 3px; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000;
            }
            .divider { 
              border-bottom: 1.5px dashed #000; 
              margin: 8px 0; 
            }
            .info-grid {
              font-size: 10.5px;
              margin-bottom: 6px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .totals-table td { 
              padding: 3px 0; 
              font-size: 11px;
            }
            .grand-total-row {
              font-weight: 900; 
              font-size: 13px; 
              border-top: 1.5px solid #000; 
              border-bottom: 1.5px solid #000;
              text-transform: uppercase;
            }
            .grand-total-row td {
              padding: 6px 0;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">${settings.shopName}</div>
            <div style="font-size: 10.5px; font-weight: 500; margin-bottom: 2px;">${settings.shopAddress}</div>
            <div style="font-size: 10.5px; font-weight: 500;">Tel: ${settings.shopPhone}</div>
            ${receiptSettings.showTaxNumber && settings.taxNumber ? `<div style="font-size: 10px; margin-top: 2px; font-weight: bold;">Tax ID: ${settings.taxNumber}</div>` : ''}
            <div class="bold" style="margin-top: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #000; display: inline-block; padding: 2px 8px; border-radius: 2px;">SALES RECEIPT</div>
          </div>
 
          <div class="divider"></div>
 
          <div class="info-grid">
            <div class="info-row">
              <strong>Invoice No:</strong>
              <span style="font-family: monospace; font-weight: bold;">${sale.invoiceNumber || sale.invoiceNo}</span>
            </div>
            <div class="info-row">
              <strong>Date:</strong>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <strong>Cashier:</strong>
              <span>${sale.createdBy || 'Cashier'}</span>
            </div>
            <div class="info-row">
              <strong>Sale Type:</strong>
              <span>${sale.saleType || 'Cash Sale'}</span>
            </div>
            <div class="info-row">
              <strong>Customer:</strong>
              <span>${customerName}</span>
            </div>
          </div>
 
          <div class="divider"></div>
 
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 4px;">
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; padding-bottom: 4px; font-weight: bold; font-size: 10.5px;">Item Description</th>
                <th style="text-align: right; padding-bottom: 4px; font-weight: bold; font-size: 10.5px; width: 25%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
 
          <table class="totals-table" style="width: 100%; border-collapse: collapse; margin-top: 4px;">
            <tr>
              <td style="text-align: left;">Subtotal:</td>
              <td style="text-align: right; font-family: monospace;">$${subtotal.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `<tr><td style="text-align: left; font-weight: bold; color: #000;">Discount:</td><td style="text-align: right; font-family: monospace; font-weight: bold; color: #000;">-$${discount.toFixed(2)}</td></tr>` : ''}
            ${tax > 0 ? `<tr><td style="text-align: left;">Sales Tax:</td><td style="text-align: right; font-family: monospace;">+$${tax.toFixed(2)}</td></tr>` : ''}
            ${shipping > 0 ? `<tr><td style="text-align: left;">Shipping:</td><td style="text-align: right; font-family: monospace;">+$${shipping.toFixed(2)}</td></tr>` : ''}
            ${otherCharges > 0 ? `<tr><td style="text-align: left;">Other Charges:</td><td style="text-align: right; font-family: monospace;">+$${otherCharges.toFixed(2)}</td></tr>` : ''}
            
            <tr class="grand-total-row">
              <td style="text-align: left;">GRAND TOTAL:</td>
              <td style="text-align: right; font-family: monospace; font-size: 14px;">$${grandTotal.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td style="text-align: left; padding-top: 5px;">Amount Paid:</td>
              <td style="text-align: right; padding-top: 5px; font-family: monospace; font-weight: bold;">$${paidAmount.toFixed(2)}</td>
            </tr>
            ${remainingAmount > 0 ? `<tr style="font-weight: bold; color: #000;"><td style="text-align: left;">Outstanding Loan:</td><td style="text-align: right; font-family: monospace;">+$${remainingAmount.toFixed(2)}</td></tr>` : ''}
            ${changeReturned > 0 ? `<tr style="font-weight: bold; color: #000;"><td style="text-align: left;">Change Returned:</td><td style="text-align: right; font-family: monospace;">$${changeReturned.toFixed(2)}</td></tr>` : ''}
          </table>
 
          <div class="divider"></div>
 
          <div class="center" style="font-size: 10px; line-height: 1.4;">
            <div><strong>Payment Method:</strong> ${sale.paymentMethod}</div>
            <div><strong>Payment Status:</strong> ${sale.paymentStatus || 'Paid'}</div>
          </div>
 
          <div class="divider"></div>
 
          <div class="center" style="margin-top: 8px;">
            ${receiptSettings.showQrCode ? `
            <div style="display: inline-block; border: 1.5px solid #000; padding: 4px; background: #fff; margin-bottom: 4px;">
              <div style="width: 40px; height: 40px; background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 6px 6px;"></div>
            </div>
            <div style="font-size: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 6px;">Scan to Verify Invoice</div>
            ` : ''}

            ${receiptSettings.showThankYouMessage ? `
            <div style="font-size: 10.5px; font-weight: bold; text-transform: uppercase; margin-top: 4px;">${shop.footerMessage || 'Thank you for shopping with us!'}</div>
            ` : ''}

            ${receiptSettings.showFooterMessage && settings.receiptFooter ? `
            <div style="font-size: 9.5px; margin-top: 4px; font-style: italic; max-width: 95%; margin-left: auto; margin-right: auto; line-height: 1.3;">
              ${settings.receiptFooter}
            </div>
            ` : ''}

            <div style="font-size: 7.5px; color: #555; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Powered by Vertex POS</div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Standard A4 Invoice styling (Premium corporate letterhead)
      contentHtml = `
        <html>
        <head>
          <title>${titleText} - ${sale.invoiceNo}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              font-size: 13px;
              line-height: 1.5;
              background: #fff;
            }
            .invoice-box {
              max-width: 840px;
              margin: auto;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
            }
            .shop-name { 
              font-size: 26px; 
              font-weight: 900; 
              color: #0f172a; 
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .shop-details {
              font-size: 12px;
              color: #64748b;
              line-height: 1.4;
            }
            .invoice-title { 
              font-size: 28px; 
              font-weight: 900; 
              color: #2563eb; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              text-align: right;
            }
            .meta-value {
              font-family: monospace;
              font-weight: bold;
              color: #0f172a;
            }
            .grid-container {
              display: table;
              width: 100%;
              margin-bottom: 30px;
            }
            .grid-column {
              display: table-cell;
              width: 50%;
              vertical-align: top;
            }
            .card {
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 12px;
              background-color: #f8fafc;
              margin-right: 10px;
            }
            .card-right {
              margin-right: 0;
              margin-left: 10px;
            }
            .card h3 { 
              margin-top: 0; 
              margin-bottom: 10px; 
              font-size: 12px; 
              font-weight: 800;
              text-transform: uppercase;
              border-bottom: 1.5px solid #cbd5e1; 
              padding-bottom: 6px; 
              color: #475569; 
              letter-spacing: 0.5px;
            }
            .card-row {
              margin-bottom: 4px;
              font-size: 12.5px;
            }
            .table-items {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .table-items th {
              background-color: #0f172a;
              color: white;
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 12px 10px;
              border: 1px solid #0f172a;
            }
            .totals-wrapper {
              width: 100%;
              margin-top: 15px;
            }
            .totals-table {
              width: 320px;
              float: right;
              border-collapse: collapse;
              font-size: 13px;
            }
            .totals-table td {
              padding: 7px 8px;
              border-bottom: 1px solid #f1f5f9;
            }
            .grand-total-row {
              font-weight: 900;
              font-size: 15px;
              background-color: #0f172a;
              color: #ffffff;
            }
            .grand-total-row td {
              border-bottom: none;
              padding: 10px 8px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              font-size: 12px;
              color: #64748b;
              clear: both;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table class="header-table">
              <tr>
                <td style="vertical-align: top; padding-bottom: 20px;">
                  <div class="shop-name">${settings.shopName}</div>
                  <div class="shop-details" style="margin-top: 5px;">
                    <div>${settings.shopAddress}</div>
                    <div>Phone: ${settings.shopPhone} | Email: ${settings.shopEmail}</div>
                    ${settings.taxNumber ? `<div>Government Tax ID: <strong>${settings.taxNumber}</strong></div>` : ''}
                  </div>
                </td>
                <td style="vertical-align: top; text-align: right; padding-bottom: 20px;">
                  <div class="invoice-title">${titleText}</div>
                  <div class="shop-details" style="margin-top: 5px; text-align: right;">
                    <div><strong>Invoice Number:</strong> <span class="meta-value">${sale.invoiceNumber || sale.invoiceNo}</span></div>
                    <div><strong>Issue Date:</strong> <span>${formattedDate}</span></div>
                    <div><strong>Issued By:</strong> <span>${sale.createdBy || 'Cashier'}</span></div>
                  </div>
                </td>
              </tr>
            </table>

            <div class="grid-container">
              <div class="grid-column">
                <div class="card">
                  <h3>Bill To / Customer Information</h3>
                  <div class="card-row"><strong>Name:</strong> ${customerName}</div>
                  ${customerPhone ? `<div class="card-row"><strong>Contact Phone:</strong> ${customerPhone}</div>` : ''}
                  ${customerAddress ? `<div class="card-row"><strong>Address:</strong> ${customerAddress}</div>` : ''}
                </div>
              </div>
              <div class="grid-column">
                <div class="card card-right">
                  <h3>Transaction Details</h3>
                  <div class="card-row"><strong>Sale Category:</strong> ${sale.saleType || 'Cash Sale'}</div>
                  <div class="card-row"><strong>Payment Mode:</strong> ${sale.paymentMethod}</div>
                  <div class="card-row"><strong>Settlement Status:</strong> <span style="font-weight: bold; color: ${sale.paymentStatus === 'Paid' ? '#16a34a' : '#dc2626'}">${sale.paymentStatus || 'Paid'}</span></div>
                </div>
              </div>
            </div>

            <table class="table-items">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">#</th>
                  <th style="width: 48%; text-align: left;">Product / Service Description</th>
                  <th style="width: 12%; text-align: right;">Unit Price</th>
                  <th style="width: 8%; text-align: center;">Qty</th>
                  <th style="width: 12%; text-align: right;">Discount</th>
                  <th style="width: 15%; text-align: right;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals-wrapper">
              <div style="display: inline-block; vertical-align: top; margin-top: 10px;">
                <div style="border: 1px solid #cbd5e1; padding: 10px; background: #fff; border-radius: 8px;">
                  <div style="width: 64px; height: 64px; background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 8px 8px;"></div>
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 5px; text-align: center; font-weight: bold;">Verify Transaction</div>
              </div>
              
              <table class="totals-table">
                <tr>
                  <td>Cart Subtotal:</td>
                  <td style="text-align: right; font-family: monospace;">$${subtotal.toFixed(2)}</td>
                </tr>
                ${discount > 0 ? `<tr><td>Order Discount:</td><td style="text-align: right; font-family: monospace; color: #ef4444; font-weight: bold;">-$${discount.toFixed(2)}</td></tr>` : ''}
                ${tax > 0 ? `<tr><td>Sales Tax:</td><td style="text-align: right; font-family: monospace;">+$${tax.toFixed(2)}</td></tr>` : ''}
                ${shipping > 0 ? `<tr><td>Shipping Charges:</td><td style="text-align: right; font-family: monospace;">+$${shipping.toFixed(2)}</td></tr>` : ''}
                ${otherCharges > 0 ? `<tr><td>Other Charges:</td><td style="text-align: right; font-family: monospace;">+$${otherCharges.toFixed(2)}</td></tr>` : ''}
                <tr class="grand-total-row">
                  <td>TOTAL AMOUNT DUE:</td>
                  <td style="text-align: right; font-family: monospace;">$${grandTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Amount Settled:</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #16a34a;">$${paidAmount.toFixed(2)}</td>
                </tr>
                ${remainingAmount > 0 ? `<tr style="color: #dc2626; font-weight: bold;"><td>Outstanding Credit Debt:</td><td style="text-align: right; font-family: monospace;">+$${remainingAmount.toFixed(2)}</td></tr>` : ''}
                ${changeReturned > 0 ? `<tr style="color: #2563eb; font-weight: bold;"><td>Change Returned:</td><td style="text-align: right; font-family: monospace;">$${changeReturned.toFixed(2)}</td></tr>` : ''}
              </table>
            </div>

            <div class="footer">
              <p style="font-weight: bold; color: #0f172a; margin-bottom: 5px;">${settings.receiptFooter}</p>
              <p style="margin-top: 0; font-size: 11px;">Thank you for your valuable partnership. For any query or service request, feel free to email: ${settings.shopEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    doc.open();
    doc.write(contentHtml);
    doc.close();

    // Trigger printing once content loaded
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }, [shop, receiptSettings]);

  return {
    printReceipt,
  };
}
