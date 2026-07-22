import dayjs from 'dayjs';
import { DATE_FORMATS } from '../constants/appConstants';

/**
 * Formats a date string, object, or timestamp using Day.js
 * @param {string|Date|number} date Target date to format
 * @param {string} [formatStr] Optional custom format pattern (defaults to YYYY-MM-DD)
 * @returns {string} Formatted date text
 */
export function formatDate(date, formatStr = DATE_FORMATS.display) {
  if (!date) return '-';
  
  // Handle case where formatStr is passed as a boolean (like showTime from other helpers.ts)
  if (formatStr === true) {
    formatStr = DATE_FORMATS.displayWithTime;
  } else if (formatStr === false) {
    formatStr = DATE_FORMATS.display;
  }
  
  // Guard to ensure formatStr is always a string
  if (typeof formatStr !== 'string') {
    formatStr = String(formatStr);
  }
  
  const d = dayjs(date);
  if (!d.isValid()) return 'Invalid Date';
  
  return d.format(formatStr);
}

/**
 * Formats a date with full date-time notation.
 * @param {string|Date|number} date Target date to format
 * @returns {string} Formatted date-time text
 */
export function formatDateTime(date) {
  return formatDate(date, DATE_FORMATS.displayWithTime);
}

/**
 * Formats relative time from now (e.g. "3 hours ago")
 * @param {string|Date|number} date Target date
 * @returns {string} Relative time text
 */
export function formatFromNow(date) {
  if (!date) return '-';
  
  const d = dayjs(date);
  if (!d.isValid()) return 'Invalid Date';
  
  // Custom simple relative time calculation to keep imports minimal, or standard dayjs
  const diffMs = Date.now() - d.valueOf();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

export default formatDate;
