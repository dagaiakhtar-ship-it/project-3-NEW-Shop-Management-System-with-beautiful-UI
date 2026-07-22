/**
 * System-wide constants for the Shop Management System
 */

export const APP_INFO = {
  name: 'ShopCraft Retail',
  fullname: 'ShopCraft Retail Management System',
  shortname: 'ShopCraft',
  version: '1.0.0-beta.1',
  copyright: '© 2026 ShopCraft. All rights reserved.',
  supportEmail: 'support@shopcraft.com',
  defaultCurrency: 'USD',
  currencySymbol: '$',
};

export const NAVIGATION_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    description: 'Overview of key performance metrics, sales graphs, and summaries.',
  },
  {
    path: '/categories',
    label: 'Categories',
    icon: 'FolderTree',
    description: 'Manage product groups, subcategories, and departments.',
  },
  {
    path: '/products',
    label: 'Products',
    icon: 'Package',
    description: 'Track inventory, barcodes, pricing, and stock status.',
  },
  {
    path: '/suppliers',
    label: 'Suppliers',
    icon: 'Truck',
    description: 'Vendor details, purchase histories, and pending shipments.',
  },
  {
    path: '/purchases',
    label: 'Purchases',
    icon: 'ShoppingBag',
    description: 'Manage inventory acquisitions, vendor receipts, and bills.',
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: 'Users',
    description: 'Database of clients, contact logs, and credit limits.',
  },
  {
    path: '/sales',
    label: 'Sales (POS)',
    icon: 'ShoppingCart',
    description: 'Check out clients, issue invoices, and track cash receipts.',
  },
  {
    path: '/expenses',
    label: 'Expenses',
    icon: 'Receipt',
    description: 'Track rent, utility bills, employee payouts, and daily operations.',
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: 'BarChart3',
    description: 'Financial statements, profit loss records, and analytics.',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: 'Settings',
    description: 'Configure store info, tax rates, backups, and display parameters.',
  },
];

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: 'Coins' },
  { id: 'CARD', label: 'Card (Credit/Debit)', icon: 'CreditCard' },
  { id: 'MOBILE_MONEY', label: 'Mobile Wallet', icon: 'Smartphone' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'Send' },
  { id: 'CREDIT_ACCOUNT', label: 'Store Credit (Debt)', icon: 'BookOpen' },
];

export const ORDER_STATUS = {
  COMPLETED: { label: 'Completed', color: 'success', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING: { label: 'Pending', color: 'warning', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  CANCELLED: { label: 'Cancelled', color: 'danger', bg: 'bg-red-50 text-red-700 border-red-200' },
  PARTIAL: { label: 'Partially Paid', color: 'secondary', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
};

export const SETTINGS_KEYS = {
  STORE_NAME: 'store_name',
  STORE_ADDRESS: 'store_address',
  STORE_PHONE: 'store_phone',
  TAX_RATE: 'tax_rate',
  CURRENCY: 'currency',
  LOW_STOCK_THRESHOLD: 'low_stock_threshold',
  THEME_MODE: 'theme_mode',
  BACKUP_INTERVAL: 'backup_interval',
};

export const DEFAULT_USER = {
  id: 1,
  name: 'Jane Doe',
  role: 'Store Owner',
  email: 'jane.doe@shopcraft.com',
  avatarUrl: null, // fallback icon will be rendered
};

/**
 * Visual design system tokens (Colors, Spacing, Radius, Animations)
 */
export const DESIGN_TOKENS = {
  colors: {
    primary: '#4f46e5', // indigo-600
    primaryHover: '#4338ca', // indigo-700
    secondary: '#0ea5e9', // sky-500
    secondaryHover: '#0284c7', // sky-600
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    backgroundLight: '#f8fafc', // slate-50
    backgroundDark: '#0f172a', // slate-900
    textLight: '#0f172a',
    textDark: '#f8fafc',
  },
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.25rem',  // 20px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem', // 24px
  },
  animations: {
    durationFast: '150ms',
    durationNormal: '250ms',
    durationSlow: '350ms',
    springTransit: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Standard Application Routes Mapping
 */
export const ROUTES = {
  dashboard: '/',
  categories: '/categories',
  products: '/products',
  suppliers: '/suppliers',
  purchases: '/purchases',
  customers: '/customers',
  sales: '/sales',
  expenses: '/expenses',
  reports: '/reports',
  settings: '/settings',
  login: '/login',
};

/**
 * Centralized Icon Mapping for lucide-react keys
 */
export const ICONS = {
  dashboard: 'LayoutDashboard',
  categories: 'FolderTree',
  products: 'Package',
  suppliers: 'Truck',
  purchases: 'ShoppingBag',
  customers: 'Users',
  sales: 'ShoppingCart',
  expenses: 'Receipt',
  reports: 'BarChart3',
  settings: 'Settings',
  plus: 'Plus',
  trash: 'Trash2',
  edit: 'Edit',
  sync: 'RefreshCw',
  alert: 'AlertTriangle',
  info: 'Info',
};

