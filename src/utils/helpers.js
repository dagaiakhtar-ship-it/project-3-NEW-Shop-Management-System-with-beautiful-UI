/**
 * General helper utilities for formatting and offline storage operations
 */

import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

export { formatCurrency, formatDate };


/**
 * Formats a decimal percentage to a localized percent string
 * @param {number|string} value Decimal value (e.g. 0.0825 or 8.25 depending on scale)
 * @param {boolean} [isAlreadyScaled] If true, does not multiply by 100
 * @returns {string} Formatted percent (e.g. "8.25%")
 */
export function formatPercentage(value, isAlreadyScaled = true) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue) || numericValue === null || numericValue === undefined) {
    return '0%';
  }
  
  const scaled = isAlreadyScaled ? numericValue : numericValue * 100;
  return `${scaled.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/**
 * Formats standard integers or floats to localized string notation
 * @param {number|string} value Raw number
 * @param {number} [fractionDigits] Decimals count (default 0)
 * @returns {string} Formatted number
 */
export function formatNumber(value, fractionDigits = 0) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue) || numericValue === null || numericValue === undefined) {
    return '0';
  }
  
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * LocalStorage Safe Wrapper Helper
 */
export const localStorageHelper = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`LocalStorage read error for key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`LocalStorage write error for key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`LocalStorage deletion error for key "${key}":`, error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }
};

/**
 * IndexedDB Query Mappers and calculations
 */
export const indexedDbHelper = {
  /**
   * Sums specified fields inside records list (useful for total values)
   * @param {Array<object>} records DB records list
   * @param {string} fieldName Target property name
   * @returns {number} Sum total
   */
  sumField: (records = [], fieldName) => {
    return records.reduce((acc, curr) => {
      const val = parseFloat(curr[fieldName]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  },

  /**
   * Safe transaction mapper with rollback alerts
   * @param {Dexie.Table} table Dexie table target
   * @param {string|number} id Key
   * @param {object} updates Update patch mapping
   */
  safeUpdate: async (table, id, updates) => {
    try {
      const updatedCount = await table.update(id, updates);
      return updatedCount > 0;
    } catch (error) {
      console.error(`IndexedDB SafeUpdate error on table "${table.name}":`, error);
      throw error;
    }
  }
};
