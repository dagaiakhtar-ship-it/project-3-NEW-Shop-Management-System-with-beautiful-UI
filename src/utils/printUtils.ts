import React from 'react';

export type PaperSize =
  | 'A4_Portrait'
  | 'A4_Landscape'
  | 'A5'
  | 'Letter'
  | 'Legal'
  | 'Thermal_80mm'
  | 'Thermal_58mm';

export interface PaperSizeConfig {
  id: PaperSize;
  name: string;
  widthClass: string;
  minHeightClass: string;
  paddingClass: string;
  dimensions: string;
  style: React.CSSProperties;
}

export const PAPER_SIZE_CONFIGS: Record<PaperSize, PaperSizeConfig> = {
  A4_Portrait: {
    id: 'A4_Portrait',
    name: 'A4 Portrait',
    widthClass: 'w-[210mm]',
    minHeightClass: 'min-h-[297mm]',
    paddingClass: 'p-8',
    dimensions: '210mm x 297mm',
    style: { width: '210mm', minHeight: '297mm' }
  },
  A4_Landscape: {
    id: 'A4_Landscape',
    name: 'A4 Landscape',
    widthClass: 'w-[297mm]',
    minHeightClass: 'min-h-[210mm]',
    paddingClass: 'p-8',
    dimensions: '297mm x 210mm',
    style: { width: '297mm', minHeight: '210mm' }
  },
  A5: {
    id: 'A5',
    name: 'A5',
    widthClass: 'w-[148mm]',
    minHeightClass: 'min-h-[210mm]',
    paddingClass: 'p-6',
    dimensions: '148mm x 210mm',
    style: { width: '148mm', minHeight: '210mm' }
  },
  Letter: {
    id: 'Letter',
    name: 'Letter',
    widthClass: 'w-[8.5in]',
    minHeightClass: 'min-h-[11in]',
    paddingClass: 'p-8',
    dimensions: '8.5in x 11in',
    style: { width: '8.5in', minHeight: '11in' }
  },
  Legal: {
    id: 'Legal',
    name: 'Legal',
    widthClass: 'w-[8.5in]',
    minHeightClass: 'min-h-[14in]',
    paddingClass: 'p-8',
    dimensions: '8.5in x 14in',
    style: { width: '8.5in', minHeight: '14in' }
  },
  Thermal_80mm: {
    id: 'Thermal_80mm',
    name: '80mm Thermal Receipt',
    widthClass: 'w-[80mm]',
    minHeightClass: 'min-h-auto',
    paddingClass: 'p-3',
    dimensions: '80mm x Auto',
    style: { width: '80mm', minHeight: 'auto' }
  },
  Thermal_58mm: {
    id: 'Thermal_58mm',
    name: '58mm Thermal Receipt',
    widthClass: 'w-[58mm]',
    minHeightClass: 'min-h-auto',
    paddingClass: 'p-1.5',
    dimensions: '58mm x Auto',
    style: { width: '58mm', minHeight: 'auto' }
  }
};

export function formatCurrency(amount: number, symbol = '$'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: symbol === '$' ? 'USD' : symbol === '€' ? 'EUR' : symbol === '£' ? 'GBP' : 'USD',
  }).format(amount).replace('USD', symbol).replace('EUR', symbol).replace('GBP', symbol);
}

export function formatDateTime(date: Date | string | number): { dateStr: string; timeStr: string } {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { dateStr: 'N/A', timeStr: 'N/A' };
  }
  
  const dateStr = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
  
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  return { dateStr, timeStr };
}

/**
 * Injects a media print css override dynamically for the browser session.
 */
export function injectPrintStyle(paperSize: PaperSize) {
  const existingStyle = document.getElementById('dynamic-print-paper-size');
  if (existingStyle) {
    existingStyle.remove();
  }

  let sizeCss = '';
  switch (paperSize) {
    case 'A4_Portrait':
      sizeCss = 'size: A4 portrait; margin: 10mm;';
      break;
    case 'A4_Landscape':
      sizeCss = 'size: A4 landscape; margin: 10mm;';
      break;
    case 'A5':
      sizeCss = 'size: A5; margin: 8mm;';
      break;
    case 'Letter':
      sizeCss = 'size: letter portrait; margin: 10mm;';
      break;
    case 'Legal':
      sizeCss = 'size: legal portrait; margin: 10mm;';
      break;
    case 'Thermal_80mm':
      sizeCss = 'size: 80mm auto; margin: 0;';
      break;
    case 'Thermal_58mm':
      sizeCss = 'size: 58mm auto; margin: 0;';
      break;
  }

  const style = document.createElement('style');
  style.id = 'dynamic-print-paper-size';
  style.innerHTML = `
    @media print {
      @page {
        ${sizeCss}
      }
      body {
        background-color: white !important;
        color: black !important;
      }
    }
  `;
  document.head.appendChild(style);
}
