/**
 * Shop Management System Configurations
 * Centralized settings for App details, Themes, Database schemas, Routes, and Animations.
 */

// 1. Application Config
export const appConfig = {
  appName: 'ShopCraft Retail',
  fullname: 'ShopCraft Single Shop Retail Management',
  version: '1.0.0',
  defaultCurrency: 'USD',
  currencySymbol: '$',
  taxRateDefault: 0.0825, // 8.25%
  lowStockAlertThreshold: 10,
  itemsPerPageDefault: 10,
};

// 2. Theme Config
export const themeConfig = {
  defaultTheme: 'light' as 'light' | 'dark',
  storageKey: 'shop-theme-mode',
  darkClass: 'dark',
};

// 3. Database Config
export const dbConfig = {
  name: 'RetailShopDatabase',
  version: 1,
  tables: {
    categories: '++id, name, description, createdAt',
    products: '++id, name, categoryId, sku, costPrice, sellingPrice, stock, minStock, status, createdAt',
    suppliers: '++id, name, phone, email, address, balance, createdAt',
    customers: '++id, name, phone, email, creditLimit, balance, createdAt',
    sales: '++id, invoiceNo, customerId, subtotal, taxAmount, totalAmount, paymentMethod, status, createdAt',
    saleItems: '++id, saleId, productId, quantity, unitPrice, total, createdAt',
    purchases: '++id, referenceNo, supplierId, totalAmount, status, paymentMethod, createdAt',
    purchaseItems: '++id, purchaseId, productId, quantity, unitPrice, total, createdAt',
    expenses: '++id, title, category, amount, description, date, createdAt',
  },
};

// 4. Route Config
export const routeConfig = {
  homePath: '/',
  loginPath: '/login',
  publicRoutes: ['/login'],
  transitionType: 'fade' as 'fade' | 'slide' | 'scale',
};

// 5. Animation Config (Framers / Transitions)
export const animationConfig = {
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  cardHover: {
    whileHover: { y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
    transition: { duration: 0.15 },
  },
  buttonTap: {
    whileTap: { scale: 0.97 },
  },
  modalEntrance: {
    initial: { opacity: 0, scale: 0.95, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 15 },
    transition: { type: 'spring', duration: 0.35, bounce: 0.15 },
  },
};
