import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a standard RFC4122 v4 unique identifier (UUID)
 * Useful for transaction hashes, offline records, and syncing tokens.
 * @returns {string} Unique UUID
 */
export function generateId() {
  return uuidv4();
}

/**
 * Generates a short, random, alphanumeric tracking ID
 * Ideal for sales receipt references or customer account codes (e.g., "TX-8291A")
 * @param {string} [prefix] Optional prefix for the ID (e.g. "TX")
 * @param {number} [length] Length of random segment (default 8)
 * @returns {string} Short tracking ID
 */
export function generateShortId(prefix = 'TX', length = 8) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return prefix ? `${prefix}-${result}` : result;
}

export default generateId;
