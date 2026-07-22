import { APP_INFO } from '../constants/constants';

/**
 * Formats a numeric value into a standard currency string representation
 */
export const formatCurrency = (
  value: number,
  currencySymbol = APP_INFO.currencySymbol,
  currency = APP_INFO.defaultCurrency
): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    })
      .format(value)
      .replace('$', currencySymbol);
  } catch (e) {
    return `${currencySymbol}${value.toFixed(2)}`;
  }
};

/**
 * Formats a Date object or string into a readable display format
 */
export const formatDate = (date: Date | string | number, showTime = false): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (showTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
};

/**
 * Generates a unique barcode/SKU for items automatically
 */
export const generateSKU = (categoryName = 'GEN'): string => {
  const prefix = categoryName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generates a standard sequential-like custom Invoice No
 */
export const generateInvoiceNo = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Generates a Purchase Order Reference No
 */
export const generatePurchaseRefNo = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}${month}${day}-${random}`;
};

/**
 * Safely calculates margin percentage
 */
export const calculateMargin = (cost: number, price: number): number => {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
};

/**
 * Safely parses input value to safe float, default to 0
 */
export const parseSafeFloat = (val: any): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};
