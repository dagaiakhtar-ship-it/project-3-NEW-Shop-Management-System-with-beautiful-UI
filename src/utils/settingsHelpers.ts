import { db, type Setting } from '../database/db';

export interface SettingDefinition {
  key: string;
  value: any;
  category: string;
  description: string;
  isSystem: boolean;
}

// Complete set of default values for the 16 settings categories
export const DEFAULT_SETTINGS: Record<string, SettingDefinition> = {
  // General
  'shop_name': {
    key: 'shop_name',
    value: 'ShopCraft Retail',
    category: 'Shop Information',
    description: 'The physical or legal name of the retail store',
    isSystem: true,
  },
  'shop_logo': {
    key: 'shop_logo',
    value: '',
    category: 'Shop Information',
    description: 'Base64 encoded string or path of shop logo image',
    isSystem: true,
  },
  'owner_name': {
    key: 'owner_name',
    value: 'John Doe',
    category: 'Shop Information',
    description: 'Name of the business owner or legal proprietor',
    isSystem: false,
  },
  'business_type': {
    key: 'business_type',
    value: 'Retail Store',
    category: 'Shop Information',
    description: 'Standard business classification e.g. Pharmacy, Supermarket',
    isSystem: false,
  },
  'phone': {
    key: 'phone',
    value: '+1 (555) 832-1920',
    category: 'Shop Information',
    description: 'Primary corporate telephone line',
    isSystem: true,
  },
  'whatsapp': {
    key: 'whatsapp',
    value: '+1 (555) 832-1920',
    category: 'Shop Information',
    description: 'Official customer support WhatsApp channel',
    isSystem: false,
  },
  'email': {
    key: 'email',
    value: 'contact@shopcraft.com',
    category: 'Shop Information',
    description: 'Primary customer support and billing email',
    isSystem: true,
  },
  'website': {
    key: 'website',
    value: 'www.shopcraft.com',
    category: 'Shop Information',
    description: 'Official business URL',
    isSystem: false,
  },
  'tax_number': {
    key: 'tax_number',
    value: 'TAX-84291-SF',
    category: 'Shop Information',
    description: 'Government registered Tax Identification Number',
    isSystem: true,
  },
  'ntn': {
    key: 'ntn',
    value: 'NTN-12948-3',
    category: 'Shop Information',
    description: 'National Tax Number',
    isSystem: false,
  },
  'strn': {
    key: 'strn',
    value: 'STRN-58291-0',
    category: 'Shop Information',
    description: 'Sales Tax Registration Number',
    isSystem: false,
  },
  'address': {
    key: 'address',
    value: '120 Market Street, Suite 4A, San Francisco, CA',
    category: 'Shop Information',
    description: 'Complete physical street address',
    isSystem: true,
  },
  'city': {
    key: 'city',
    value: 'San Francisco',
    category: 'Shop Information',
    description: 'City of operations',
    isSystem: false,
  },
  'country': {
    key: 'country',
    value: 'United States',
    category: 'Shop Information',
    description: 'Country of operations',
    isSystem: false,
  },
  'postal_code': {
    key: 'postal_code',
    value: '94102',
    category: 'Shop Information',
    description: 'Zip / Postal code',
    isSystem: false,
  },
  'business_hours': {
    key: 'business_hours',
    value: '09:00 AM - 09:00 PM',
    category: 'Shop Information',
    description: 'Daily operational schedule shown to customers',
    isSystem: false,
  },
  'footer_message': {
    key: 'footer_message',
    value: 'Thank you for shopping with us!',
    category: 'Shop Information',
    description: 'Greeting displayed on printouts and emails',
    isSystem: false,
  },

  // Receipt Settings
  'receipt_width': {
    key: 'receipt_width',
    value: '80mm',
    category: 'Receipt',
    description: 'Width of thermal slips (e.g. 58mm, 80mm)',
    isSystem: false,
  },
  'thermal_receipt': {
    key: 'thermal_receipt',
    value: true,
    category: 'Receipt',
    description: 'Whether to optimize prints for standard rolls',
    isSystem: false,
  },
  'a4_invoice': {
    key: 'a4_invoice',
    value: false,
    category: 'Receipt',
    description: 'Render formal paper invoices on A4 standard size',
    isSystem: false,
  },
  'show_shop_logo': {
    key: 'show_shop_logo',
    value: true,
    category: 'Receipt',
    description: 'Embed store logo image at the header',
    isSystem: false,
  },
  'show_qr_code': {
    key: 'show_qr_code',
    value: true,
    category: 'Receipt',
    description: 'Generate dynamic QR code for receipt lookup',
    isSystem: false,
  },
  'show_barcode': {
    key: 'show_barcode',
    value: true,
    category: 'Receipt',
    description: 'Display standard 1D barcode on printed drafts',
    isSystem: false,
  },
  'show_tax_number': {
    key: 'show_tax_number',
    value: true,
    category: 'Receipt',
    description: 'Show government tax registration IDs on invoice footer',
    isSystem: false,
  },
  'show_footer_message': {
    key: 'show_footer_message',
    value: true,
    category: 'Receipt',
    description: 'Print general system footer terms',
    isSystem: false,
  },
  'show_thank_you_message': {
    key: 'show_thank_you_message',
    value: true,
    category: 'Receipt',
    description: 'Display appreciation subheader',
    isSystem: false,
  },
  'custom_footer_text': {
    key: 'custom_footer_text',
    value: 'Please retain receipt for exchange within 7 days.',
    category: 'Receipt',
    description: 'Tailored policy statement printed at very bottom',
    isSystem: false,
  },

  // Sales Settings
  'default_payment_method': {
    key: 'default_payment_method',
    value: 'Cash',
    category: 'Sales',
    description: 'Prefilled transaction method in checkout counter',
    isSystem: false,
  },
  'default_tax': {
    key: 'default_tax',
    value: 0,
    category: 'Sales',
    description: 'Default tax percentage applied on checkout sales',
    isSystem: false,
  },
  'default_discount': {
    key: 'default_discount',
    value: 0,
    category: 'Sales',
    description: 'Prefilled discount percentage on counter baskets',
    isSystem: false,
  },
  'allow_negative_stock': {
    key: 'allow_negative_stock',
    value: false,
    category: 'Sales',
    description: 'Enable selling products even if local stock reads zero',
    isSystem: true,
  },
  'require_customer': {
    key: 'require_customer',
    value: false,
    category: 'Sales',
    description: 'Enforce linking a customer profile to authorize sales',
    isSystem: false,
  },
  'require_barcode': {
    key: 'require_barcode',
    value: false,
    category: 'Sales',
    description: 'Force cashiers to use scanner sweeps to avoid type errors',
    isSystem: false,
  },
  'auto_print_receipt': {
    key: 'auto_print_receipt',
    value: true,
    category: 'Sales',
    description: 'Trigger standard print dialog on immediate sale completion',
    isSystem: false,
  },
  'invoice_prefix': {
    key: 'invoice_prefix',
    value: 'INV',
    category: 'Sales',
    description: 'Custom code prefixed onto all sales transaction vouchers',
    isSystem: true,
  },
  'invoice_number_format': {
    key: 'invoice_number_format',
    value: 'INV-YYYYMMDD-{NUM}',
    category: 'Sales',
    description: 'String pattern utilized to format billing keys',
    isSystem: true,
  },

  // Purchase Settings
  'purchase_prefix': {
    key: 'purchase_prefix',
    value: 'PUR',
    category: 'Purchase',
    description: 'Shorthand code prepended on stock procurement slips',
    isSystem: true,
  },
  'auto_update_stock': {
    key: 'auto_update_stock',
    value: true,
    category: 'Purchase',
    description: 'Auto-increment on-hand units on procurement receipt logs',
    isSystem: true,
  },
  'purchase_default_tax': {
    key: 'purchase_default_tax',
    value: 0,
    category: 'Purchase',
    description: 'Default tax rate applied to supply entries',
    isSystem: false,
  },
  'default_supplier': {
    key: 'default_supplier',
    value: '',
    category: 'Purchase',
    description: 'Default preloaded vendor id for manual invoice logs',
    isSystem: false,
  },

  // Customer Credit Settings
  'default_credit_limit': {
    key: 'default_credit_limit',
    value: 5000,
    category: 'Customer Credit',
    description: 'Initial allowable line of credit for accounts',
    isSystem: false,
  },
  'grace_period': {
    key: 'grace_period',
    value: 30,
    category: 'Customer Credit',
    description: 'Authorized days of delay before ledger marks overdue',
    isSystem: false,
  },
  'overdue_reminder_days': {
    key: 'overdue_reminder_days',
    value: 7,
    category: 'Customer Credit',
    description: 'Prior notice buffer before payment milestone due warnings',
    isSystem: false,
  },
  'auto_block_limit': {
    key: 'auto_block_limit',
    value: true,
    category: 'Customer Credit',
    description: 'Halt sales once unpaid credit balance exceeds limit',
    isSystem: true,
  },
  'allow_partial_payment': {
    key: 'allow_partial_payment',
    value: true,
    category: 'Customer Credit',
    description: 'Authorize receiving multiple partial installments on invoices',
    isSystem: false,
  },

  // Inventory Settings
  'low_stock_threshold': {
    key: 'low_stock_threshold',
    value: 5,
    category: 'Inventory',
    description: 'Stock boundary that flags warnings on dashboard alerts',
    isSystem: false,
  },
  'enable_stock_alerts': {
    key: 'enable_stock_alerts',
    value: true,
    category: 'Inventory',
    description: 'Trigger live alert sounds or banners on low-inventory events',
    isSystem: false,
  },
  'enable_stock_history': {
    key: 'enable_stock_history',
    value: true,
    category: 'Inventory',
    description: 'Compile transactional card history for item unit mutations',
    isSystem: true,
  },
  'default_unit': {
    key: 'default_unit',
    value: 'pcs',
    category: 'Inventory',
    description: 'Default unit descriptor e.g. kg, pieces, liters',
    isSystem: false,
  },
  'barcode_format': {
    key: 'barcode_format',
    value: 'EAN13',
    category: 'Inventory',
    description: 'System-wide generated standard (EAN13, Code128, etc)',
    isSystem: false,
  },
  'sku_format': {
    key: 'sku_format',
    value: 'SKU-{CAT}-{NUM}',
    category: 'Inventory',
    description: 'Shorthand SKU code generation layout schema',
    isSystem: false,
  },

  // Expense Settings
  'expense_prefix': {
    key: 'expense_prefix',
    value: 'EXP',
    category: 'Expenses',
    description: 'Prefix prefilled on operating cost entries',
    isSystem: false,
  },
  'default_expense_category': {
    key: 'default_expense_category',
    value: 'Utilities',
    category: 'Expenses',
    description: 'Initial item category selected for ledger additions',
    isSystem: false,
  },
  'recurring_reminder': {
    key: 'recurring_reminder',
    value: true,
    category: 'Expenses',
    description: 'Enable system notifications for upcoming monthly obligations',
    isSystem: false,
  },

  // Dashboard Settings
  'default_date_range': {
    key: 'default_date_range',
    value: '30_days',
    category: 'Dashboard',
    description: 'Prefilled analytic frame on page entrances',
    isSystem: false,
  },
  'refresh_interval': {
    key: 'refresh_interval',
    value: 5,
    category: 'Dashboard',
    description: 'Autoupdate frequency in minutes for home display graphs',
    isSystem: false,
  },
  'default_widgets': {
    key: 'default_widgets',
    value: ['sales', 'expenses', 'credit', 'recent_sales'],
    category: 'Dashboard',
    description: 'Enabled components on dashboard landing metrics',
    isSystem: false,
  },
  'card_layout': {
    key: 'card_layout',
    value: 'grid',
    category: 'Dashboard',
    description: 'Primary structural bento design layout setting',
    isSystem: false,
  },

  // Backup & Sync Settings
  'sync_auto_toggle': {
    key: 'sync_auto_toggle',
    value: false,
    category: 'Backup & Sync',
    description: 'Automatic internet checking triggers updates',
    isSystem: true,
  },
  'sync_interval': {
    key: 'sync_interval',
    value: 15,
    category: 'Backup & Sync',
    description: 'Minutes between scheduled sync requests',
    isSystem: true,
  },
  'sync_conflict_policy': {
    key: 'sync_conflict_policy',
    value: 'manual',
    category: 'Backup & Sync',
    description: 'Resolution method for overlapping local and cloud rows',
    isSystem: true,
  },
  'backup_notifications': {
    key: 'backup_notifications',
    value: true,
    category: 'Backup & Sync',
    description: 'Push desktop banner toasts upon successful uploads',
    isSystem: false,
  },

  // Security Settings
  'session_timeout': {
    key: 'session_timeout',
    value: 30,
    category: 'Security',
    description: 'Inactivity minutes after which user token expires',
    isSystem: true,
  },
  'auto_logout': {
    key: 'auto_logout',
    value: false,
    category: 'Security',
    description: 'Auto-exit current user when idle threshold reached',
    isSystem: true,
  },
  'login_attempts': {
    key: 'login_attempts',
    value: 5,
    category: 'Security',
    description: 'Allowable password entry errors before lockouts',
    isSystem: true,
  },
  'password_policy': {
    key: 'password_policy',
    value: 'medium',
    category: 'Security',
    description: 'Minimum complexity standards (strong, medium, basic)',
    isSystem: true,
  },

  // Notifications
  'low_stock_notification': {
    key: 'low_stock_notification',
    value: true,
    category: 'Notifications',
    description: 'Show banner warnings when inventory drops below boundaries',
    isSystem: false,
  },
  'credit_due_notification': {
    key: 'credit_due_notification',
    value: true,
    category: 'Notifications',
    description: 'Notify when regular customer credit balances clear limit boundaries',
    isSystem: false,
  },
  'backup_completed_notification': {
    key: 'backup_completed_notification',
    value: true,
    category: 'Notifications',
    description: 'Warn or log messages regarding cloud upload completions',
    isSystem: false,
  },
  'backup_failed_notification': {
    key: 'backup_failed_notification',
    value: true,
    category: 'Notifications',
    description: 'Alert user when connection hiccups break automatic sync loops',
    isSystem: false,
  },
  'recurring_expense_notification': {
    key: 'recurring_expense_notification',
    value: true,
    category: 'Notifications',
    description: 'Remind administrative users when routine expenses hit due milestones',
    isSystem: false,
  },
  'daily_summary_notification': {
    key: 'daily_summary_notification',
    value: false,
    category: 'Notifications',
    description: 'Construct end-of-day summary balance sheet indicators',
    isSystem: false,
  },

  // Appearance
  'theme': {
    key: 'theme',
    value: 'light',
    category: 'Appearance',
    description: 'Application background appearance palette',
    isSystem: true,
  },
  'accent_color': {
    key: 'accent_color',
    value: '#4f46e5',
    category: 'Appearance',
    description: 'Custom primary hex accent utilized on highlighters',
    isSystem: false,
  },
  'font_size': {
    key: 'font_size',
    value: 'medium',
    category: 'Appearance',
    description: 'Font scale adjusting interface readability (small, medium, large)',
    isSystem: false,
  },
  'sidebar_style': {
    key: 'sidebar_style',
    value: 'expanded',
    category: 'Appearance',
    description: 'Structure of primary navigation drawer',
    isSystem: false,
  },
  'compact_mode': {
    key: 'compact_mode',
    value: false,
    category: 'Appearance',
    description: 'Minimize layout white margins to show dense grids',
    isSystem: false,
  },

  // Localization
  'language': {
    key: 'language',
    value: 'en',
    category: 'Localization',
    description: 'Selected visual vocabulary settings',
    isSystem: false,
  },
  'currency': {
    key: 'currency',
    value: 'USD',
    category: 'Localization',
    description: 'Currency code utilized in calculations',
    isSystem: true,
  },
  'currency_symbol': {
    key: 'currency_symbol',
    value: '$',
    category: 'Localization',
    description: 'Prefixed visual currency symbol',
    isSystem: true,
  },
  'date_format': {
    key: 'date_format',
    value: 'YYYY-MM-DD',
    category: 'Localization',
    description: 'Selected formatting configuration for calendar fields',
    isSystem: false,
  },
  'time_format': {
    key: 'time_format',
    value: '12_hour',
    category: 'Localization',
    description: 'Display clock standard utilized',
    isSystem: false,
  },
  'number_format': {
    key: 'number_format',
    value: 'comma',
    category: 'Localization',
    description: 'Decimal separator formatting schema used',
    isSystem: false,
  },
  'timezone': {
    key: 'timezone',
    value: 'UTC',
    category: 'Localization',
    description: 'Active operating standard timezone setting',
    isSystem: false,
  },

  // AI Integration
  'ai_enabled': {
    key: 'ai_enabled',
    value: true,
    category: 'AI Integration',
    description: 'Toggle to enable or disable the floating AI assistant bubble',
    isSystem: false,
  },
  'ai_api_key': {
    key: 'ai_api_key',
    value: '',
    category: 'AI Integration',
    description: 'Custom Google Gemini API Key to power the chat assistant',
    isSystem: false,
  },
  'ai_model': {
    key: 'ai_model',
    value: 'gemini-3.5-flash',
    category: 'AI Integration',
    description: 'The active Google Gemini model to use for intelligence requests',
    isSystem: false,
  },
  'ai_persona': {
    key: 'ai_persona',
    value: 'You are an expert Retail Business Intelligence & Financial Analyst for a retail shop. Focus on high-yield inventory advice, debt recovery strategies, and margin protections.',
    category: 'AI Integration',
    description: 'The custom instructions and tone that the AI assistant should adhere to',
    isSystem: false,
  },
  'ai_low_stock_advice': {
    key: 'ai_low_stock_advice',
    value: true,
    category: 'AI Integration',
    description: 'Enable the assistant to proactively formulate inventory restock suggestions',
    isSystem: false,
  }
};

/**
 * Loads a setting from IndexedDB. Fallbacks to system defaults if missing.
 */
export async function loadSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
  try {
    const record = await db.settings.get(key);
    if (record) {
      return record.value as T;
    }
    // Check fallback defaults
    const systemDefault = DEFAULT_SETTINGS[key];
    if (systemDefault !== undefined) {
      // Save default value to database so that it exists
      await saveSetting(key, systemDefault.value, systemDefault.category, systemDefault.description, systemDefault.isSystem);
      return systemDefault.value as T;
    }
    return defaultValue as T;
  } catch (err) {
    console.error(`Failed to load setting with key: ${key}`, err);
    return (DEFAULT_SETTINGS[key]?.value ?? defaultValue) as T;
  }
}

/**
 * Loads all settings records from the database, seeding any defaults that are absent.
 */
export async function loadAllSettings(): Promise<Setting[]> {
  try {
    const existing = await db.settings.toArray();
    const existingKeys = new Set(existing.map(s => s.key));
    const toAdd: Setting[] = [];

    // Seed missing settings
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (!existingKeys.has(key)) {
        const newRecord: Setting = {
          key: def.key,
          value: def.value,
          category: def.category,
          description: def.description,
          isSystem: def.isSystem,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        toAdd.push(newRecord);
        existing.push(newRecord);
      }
    }

    if (toAdd.length > 0) {
      await db.settings.bulkAdd(toAdd);
    }
    return existing;
  } catch (err) {
    console.error('Failed to load all settings:', err);
    return [];
  }
}

/**
 * Saves or updates a setting in the database.
 */
export async function saveSetting(
  key: string,
  value: any,
  category?: string,
  description?: string,
  isSystem?: boolean
): Promise<void> {
  try {
    const existing = await db.settings.get(key);
    const def = DEFAULT_SETTINGS[key];
    
    const record: Setting = {
      key,
      value,
      category: category || existing?.category || def?.category || 'General',
      description: description || existing?.description || def?.description || '',
      isSystem: isSystem !== undefined ? isSystem : (existing?.isSystem !== undefined ? existing.isSystem : (def?.isSystem || false)),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    await db.settings.put(record);
    
    // Trigger live visual shifts if the theme or layout settings are updated
    if (key === 'theme') {
      applyThemeToDOM(value);
    }
  } catch (err) {
    console.error(`Failed to save setting with key: ${key}`, err);
    throw err;
  }
}

/**
 * Helper to apply light/dark theme directly to the DOM for immediate effect.
 */
export function applyThemeToDOM(theme: 'light' | 'dark' | 'system') {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  
  let target: 'light' | 'dark' = 'light';
  if (theme === 'system') {
    target = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    target = theme;
  }
  
  root.classList.add(target);
  // Also save a fallback item in localstorage for instant pre-mounting index loading
  localStorage.setItem('theme-settings-theme', target);
}

/**
 * Resets a single setting to its system default.
 */
export async function resetSetting(key: string): Promise<any> {
  try {
    const def = DEFAULT_SETTINGS[key];
    if (def) {
      await saveSetting(key, def.value, def.category, def.description, def.isSystem);
      return def.value;
    }
    await db.settings.delete(key);
    return null;
  } catch (err) {
    console.error(`Failed to reset setting: ${key}`, err);
    throw err;
  }
}

/**
 * Exports all settings into a JSON string formatted for downloading.
 */
export async function exportSettings(): Promise<string> {
  try {
    const all = await loadAllSettings();
    return JSON.stringify(all, null, 2);
  } catch (err) {
    console.error('Failed to export settings:', err);
    throw err;
  }
}

/**
 * Imports settings from a valid JSON string, validating the keys.
 */
export async function importSettings(jsonData: string): Promise<void> {
  try {
    const parsed = JSON.parse(jsonData);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid backup format. Must be an array of settings.');
    }
    
    const validKeys = new Set(Object.keys(DEFAULT_SETTINGS));
    const toPut: Setting[] = [];

    for (const item of parsed) {
      if (item && item.key) {
        toPut.push({
          key: item.key,
          value: item.value,
          category: item.category || 'General',
          description: item.description || '',
          isSystem: !!item.isSystem,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (toPut.length > 0) {
      await db.settings.bulkPut(toPut);
      
      // Look for theme adjustment
      const themeItem = toPut.find(s => s.key === 'theme');
      if (themeItem) {
        applyThemeToDOM(themeItem.value);
      }
    }
  } catch (err) {
    console.error('Failed to import settings:', err);
    throw err;
  }
}
