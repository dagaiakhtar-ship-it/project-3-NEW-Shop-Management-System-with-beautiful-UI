import { APP_INFO } from '../constants/constants';

/**
 * Currency Formatter
 * Formats numbers into standardized currency representation.
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
 * Date Formatter
 * Formats date values into clean, customizable locale formats.
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
 * Time Formatter
 * Formats a Date object or timestamp into localized time-only format.
 */
export const formatTime = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

/**
 * Number Formatter
 * Formats decimals with standard comma group alignments and precise digits.
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (e) {
    return value.toFixed(decimals);
  }
};

/**
 * Percentage Formatter
 * Formats decimal values into tidy percentage indicators (e.g. 0.155 -> 15.5%).
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  try {
    return `${formatNumber(value * 100, decimals)}%`;
  } catch (e) {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};
