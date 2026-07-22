/**
 * Validation Helpers
 * Common functions for form input validations.
 */

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone: string): boolean => {
  // Broad international phone validator
  const re = /^\+?[0-9\s\-()]{7,20}$/;
  return re.test(phone);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export const validatePrice = (price: any): boolean => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

export const validateStock = (stock: any): boolean => {
  const num = parseInt(stock, 10);
  return !isNaN(num) && num >= 0;
};
