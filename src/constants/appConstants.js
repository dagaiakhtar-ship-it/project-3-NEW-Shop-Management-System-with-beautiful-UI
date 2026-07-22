/**
 * Application Constants
 * This file serves as the unified config module for application metadata, styling tokens,
 * default store setups, and localization structures.
 */

export const APP_NAME = 'ShopCraft Retail';
export const APP_VERSION = '1.0.0-beta.2';

export const CURRENCY = {
  code: 'USD',
  symbol: '$',
  precision: 2,
};

export const DATE_FORMATS = {
  display: 'YYYY-MM-DD',
  displayWithTime: 'YYYY-MM-DD HH:mm:ss',
  short: 'MM/DD',
  database: 'YYYY-MM-DD',
};

export const THEME_COLORS = {
  light: {
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#6366f1',
  },
  dark: {
    bg: '#0f172a',
    card: '#1e293b',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    primary: '#818cf8',
  },
};

export const DEFAULT_SETTINGS = {
  storeName: 'ShopCraft Retail Store',
  storeAddress: '123 Commerce Avenue, Suite 100',
  storePhone: '+1 (555) 019-2834',
  taxRate: 8.25, // Percentage
  currency: 'USD',
  lowStockThreshold: 10,
  themeMode: 'light',
  backupInterval: 'daily', // daily, weekly, manual
  autoPrintReceipt: false,
};

export const DEFAULT_USER = {
  id: 1,
  name: 'Jane Doe',
  role: 'Store Owner',
  email: 'jane.doe@shopcraft.com',
  avatarUrl: null,
};
