import { CURRENCY } from '../constants/appConstants';

/**
 * Formats a raw number into a stylized localized currency string.
 * @param {number|string} amount Numeric amount to format
 * @param {object} [options] Custom overrides for currency symbol or code
 * @returns {string} Styled currency output (e.g. "$1,250.00")
 */
export function formatCurrency(amount, options = {}) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return '$0.00';
  }

  const currencySymbol = options.symbol || CURRENCY.symbol;
  const precision = options.precision !== undefined ? options.precision : CURRENCY.precision;

  try {
    const formatted = new Intl.NumberFormat(navigator.language || 'en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(numericAmount);

    return `${currencySymbol}${formatted}`;
  } catch (error) {
    // Elegant fallback if Intl is unsupported or errors
    return `${currencySymbol}${numericAmount.toFixed(precision)}`;
  }
}

export default formatCurrency;
