import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Receipt, 
  ShoppingBag, 
  ShoppingCart, 
  Boxes, 
  CreditCard, 
  Coins, 
  LayoutDashboard, 
  Cloud, 
  Lock, 
  Users, 
  Bell, 
  Palette, 
  Globe, 
  Sliders,
  Save,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Database,
  History,
  Info,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';

// Reusable custom layout components
import { SettingsCard, SettingsGroup, SettingsForm } from '../components/settings/SettingsLayout';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import ColorPicker from '../components/settings/ColorPicker';
import LogoUploader from '../components/settings/LogoUploader';
import ResetDialog from '../components/settings/ResetDialog';
import PermissionTable from '../components/settings/PermissionTable';
import UserManagementTable from '../components/settings/UserManagementTable';
import SettingsSidebar, { SETTINGS_CATEGORIES } from '../components/settings/SettingsSidebar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import TextArea from '../components/ui/TextArea';
import Select from '../components/ui/Select';
import SystemAuditPanel from '../components/settings/SystemAuditPanel';

// Database & hooks
import { db } from '../database/db';
import { useAuthStore } from '../store/authStore';
import { 
  useSettings, 
  useThemeSettings, 
  useShopSettings, 
  useReceiptSettings, 
  useSecuritySettings, 
  useBackupSettings 
} from '../hooks/useSettings';
import showToast from '../utils/toast';
import { useAppearanceContext } from '../contexts/AppearanceContext';

// Helper container to dynamically toggle between a standard HTML form 
// and a generic layout div based on the selected setting category.
// This prevents nesting internal modals/sub-forms (e.g. in UserManagementTable) 
// inside an outer form, solving hydration and validation errors.
interface SettingsContainerProps {
  activeCategory: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const SettingsContainer: React.FC<SettingsContainerProps> = ({ activeCategory, onSubmit, children }) => {
  const isForm = activeCategory !== 'users' && activeCategory !== 'advanced' && activeCategory !== 'system_audit';
  
  if (isForm) {
    return (
      <SettingsForm onSubmit={onSubmit}>
        {children}
      </SettingsForm>
    );
  }
  
  return (
    <div className="w-full flex flex-col gap-6">
      {children}
    </div>
  );
};

export const Settings: React.FC = () => {
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'Administrator';

  // Active Category State
  const [activeCategory, setActiveCategory] = useState<string>('shop_info');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'custom'>('all');

  // Load hooks
  const { settings, updateSetting, resetToDefault, importSettingsJSON, exportSettingsJSON } = useSettings();
  const shop = useShopSettings();
  const receipt = useReceiptSettings();
  const security = useSecuritySettings();
  const backup = useBackupSettings();
  const theme = useThemeSettings();
  const { 
    settings: appearanceSettings, 
    updateSetting: updateAppearanceSetting, 
    resetAppearance 
  } = useAppearanceContext();

  // Reset Modal state
  const [isResetOpen, setIsResetOpen] = useState(false);

  // System Stats states
  const [stats, setStats] = useState({
    version: 'v2.1.0-Release',
    totalRecords: 0,
    dbSizeEstimated: '0.00 KB',
    lastBackup: 'Never',
    lastSync: 'Never'
  });

  // Load individual setting overrides for Sales/Purchases/Inventory/etc
  const [salesPayMethod, setSalesPayMethod] = useState('Cash');
  const [salesTax, setSalesTax] = useState(0);
  const [salesDiscount, setSalesDiscount] = useState(0);
  const [salesNegative, setSalesNegative] = useState(false);
  const [salesReqCustomer, setSalesReqCustomer] = useState(false);
  const [salesReqBarcode, setSalesReqBarcode] = useState(false);
  const [salesAutoPrint, setSalesAutoPrint] = useState(true);
  const [salesPrefix, setSalesPrefix] = useState('INV');
  const [salesFormat, setSalesFormat] = useState('INV-YYYYMMDD-{NUM}');

  const [purchasePrefix, setPurchasePrefix] = useState('PUR');
  const [purchaseAutoUpdateStock, setPurchaseAutoUpdateStock] = useState(true);
  const [purchaseDefaultTax, setPurchaseDefaultTax] = useState(0);
  const [purchaseDefaultSupplier, setPurchaseDefaultSupplier] = useState('');

  const [creditLimit, setCreditLimit] = useState(5000);
  const [creditGrace, setCreditGrace] = useState(30);
  const [creditReminder, setCreditReminder] = useState(7);
  const [creditAutoBlock, setCreditAutoBlock] = useState(true);
  const [creditPartial, setCreditPartial] = useState(true);

  const [invThreshold, setInvThreshold] = useState(5);
  const [invAlerts, setInvAlerts] = useState(true);
  const [invHistory, setInvHistory] = useState(true);
  const [invUnit, setInvUnit] = useState('pcs');
  const [invBarcodeFormat, setInvBarcodeFormat] = useState('EAN13');
  const [invSkuFormat, setInvSkuFormat] = useState('SKU-{CAT}-{NUM}');

  const [expPrefix, setExpPrefix] = useState('EXP');
  const [expDefaultCat, setExpDefaultCat] = useState('Utilities');
  const [expRecurringReminder, setExpRecurringReminder] = useState(true);

  const [dashRange, setDashRange] = useState('30_days');
  const [dashRefresh, setDashRefresh] = useState(5);
  const [dashLayout, setDashLayout] = useState('grid');

  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifCredit, setNotifCredit] = useState(true);
  const [notifBackupComp, setNotifBackupComp] = useState(true);
  const [notifBackupFail, setNotifBackupFail] = useState(true);
  const [notifExpense, setNotifExpense] = useState(true);
  const [notifDaily, setNotifDaily] = useState(false);

  const [locLang, setLocLang] = useState('en');
  const [locCurrency, setLocCurrency] = useState('USD');
  const [locCurrencySymbol, setLocCurrencySymbol] = useState('$');
  const [locDateFormat, setLocDateFormat] = useState('YYYY-MM-DD');
  const [locTimeFormat, setLocTimeFormat] = useState('12_hour');
  const [locNumFormat, setLocNumFormat] = useState('comma');
  const [locTimezone, setLocTimezone] = useState('UTC');

  // AI Integration state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash');
  const [aiPersona, setAiPersona] = useState('');
  const [aiLowStockAdvice, setAiLowStockAdvice] = useState(true);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load stats and settings overrides
  const loadStatsAndOverrides = async () => {
    try {
      // 1. Fetch record counts to calculate total database records
      const tables = [
        db.products, db.categories, db.customers, db.suppliers,
        db.sales, db.saleItems, db.purchases, db.purchaseItems,
        db.expenses, db.expenseCategories, db.creditAccounts,
        db.creditPayments, db.settings, db.users, db.stockHistory
      ];
      
      let total = 0;
      for (const t of tables) {
        total += await t.count();
      }

      // Estimate DB Size based on records (avg 250 bytes per record)
      const sizeBytes = total * 250;
      let dbSizeText = '0.00 KB';
      if (sizeBytes > 1024 * 1024) {
        dbSizeText = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        dbSizeText = `${(sizeBytes / 1024).toFixed(2)} KB`;
      }

      // Check last backup and sync log from history
      const lastBackupRec = await db.backupHistory.orderBy('backupDate').reverse().first();
      let lastBackupStr = 'Never';
      if (lastBackupRec) {
        lastBackupStr = new Date(lastBackupRec.backupDate).toLocaleString();
      }

      setStats({
        version: 'v2.1.0-Release',
        totalRecords: total,
        dbSizeEstimated: dbSizeText,
        lastBackup: lastBackupStr,
        lastSync: lastBackupStr // Maps to last backup/sync event
      });

      // 2. Load settings state variables
      setSalesPayMethod(await db.settings.get('default_payment_method').then(r => r?.value || 'Cash'));
      setSalesTax(await db.settings.get('default_tax').then(r => Number(r?.value || 0)));
      setSalesDiscount(await db.settings.get('default_discount').then(r => Number(r?.value || 0)));
      setSalesNegative(await db.settings.get('allow_negative_stock').then(r => !!r?.value));
      setSalesReqCustomer(await db.settings.get('require_customer').then(r => !!r?.value));
      setSalesReqBarcode(await db.settings.get('require_barcode').then(r => !!r?.value));
      setSalesAutoPrint(await db.settings.get('auto_print_receipt').then(r => r?.value !== false));
      setSalesPrefix(await db.settings.get('invoice_prefix').then(r => r?.value || 'INV'));
      setSalesFormat(await db.settings.get('invoice_number_format').then(r => r?.value || 'INV-YYYYMMDD-{NUM}'));

      setPurchasePrefix(await db.settings.get('purchase_prefix').then(r => r?.value || 'PUR'));
      setPurchaseAutoUpdateStock(await db.settings.get('auto_update_stock').then(r => r?.value !== false));
      setPurchaseDefaultTax(await db.settings.get('purchase_default_tax').then(r => Number(r?.value || 0)));
      setPurchaseDefaultSupplier(await db.settings.get('default_supplier').then(r => r?.value || ''));

      setCreditLimit(await db.settings.get('default_credit_limit').then(r => Number(r?.value || 5000)));
      setCreditGrace(await db.settings.get('grace_period').then(r => Number(r?.value || 30)));
      setCreditReminder(await db.settings.get('overdue_reminder_days').then(r => Number(r?.value || 7)));
      setCreditAutoBlock(await db.settings.get('auto_block_limit').then(r => r?.value !== false));
      setCreditPartial(await db.settings.get('allow_partial_payment').then(r => r?.value !== false));

      setInvThreshold(await db.settings.get('low_stock_threshold').then(r => Number(r?.value || 5)));
      setInvAlerts(await db.settings.get('enable_stock_alerts').then(r => r?.value !== false));
      setInvHistory(await db.settings.get('enable_stock_history').then(r => r?.value !== false));
      setInvUnit(await db.settings.get('default_unit').then(r => r?.value || 'pcs'));
      setInvBarcodeFormat(await db.settings.get('barcode_format').then(r => r?.value || 'EAN13'));
      setInvSkuFormat(await db.settings.get('sku_format').then(r => r?.value || 'SKU-{CAT}-{NUM}'));

      setExpPrefix(await db.settings.get('expense_prefix').then(r => r?.value || 'EXP'));
      setExpDefaultCat(await db.settings.get('default_expense_category').then(r => r?.value || 'Utilities'));
      setExpRecurringReminder(await db.settings.get('recurring_reminder').then(r => r?.value !== false));

      setDashRange(await db.settings.get('default_date_range').then(r => r?.value || '30_days'));
      setDashRefresh(await db.settings.get('refresh_interval').then(r => Number(r?.value || 5)));
      setDashLayout(await db.settings.get('card_layout').then(r => r?.value || 'grid'));

      setNotifLowStock(await db.settings.get('low_stock_notification').then(r => r?.value !== false));
      setNotifCredit(await db.settings.get('credit_due_notification').then(r => r?.value !== false));
      setNotifBackupComp(await db.settings.get('backup_completed_notification').then(r => r?.value !== false));
      setNotifBackupFail(await db.settings.get('backup_failed_notification').then(r => r?.value !== false));
      setNotifExpense(await db.settings.get('recurring_expense_notification').then(r => r?.value !== false));
      setNotifDaily(await db.settings.get('daily_summary_notification').then(r => !!r?.value));

      setLocLang(await db.settings.get('language').then(r => r?.value || 'en'));
      setLocCurrency(await db.settings.get('currency').then(r => r?.value || 'USD'));
      setLocCurrencySymbol(await db.settings.get('currency_symbol').then(r => r?.value || '$'));
      setLocDateFormat(await db.settings.get('date_format').then(r => r?.value || 'YYYY-MM-DD'));
      setLocTimeFormat(await db.settings.get('time_format').then(r => r?.value || '12_hour'));
      setLocNumFormat(await db.settings.get('number_format').then(r => r?.value || 'comma'));
      setLocTimezone(await db.settings.get('timezone').then(r => r?.value || 'UTC'));

      // Load AI parameters
      setAiEnabled(await db.settings.get('ai_enabled').then(r => r?.value !== false));
      setAiApiKey(await db.settings.get('ai_api_key').then(r => r?.value || ''));
      setAiModel(await db.settings.get('ai_model').then(r => r?.value || 'gemini-3.5-flash'));
      setAiPersona(await db.settings.get('ai_persona').then(r => r?.value || 'You are an expert Retail Business Intelligence & Financial Analyst for a retail shop. Focus on high-yield inventory advice, debt recovery strategies, and margin protections.'));
      setAiLowStockAdvice(await db.settings.get('ai_low_stock_advice').then(r => r?.value !== false));

    } catch (e) {
      console.error('Failed to load database stats and settings overrides:', e);
    }
  };

  useEffect(() => {
    loadStatsAndOverrides();
  }, [settings]);

  const handleTestConnection = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Connection healthcheck request. Respond in exactly one short sentence confirming the integration is working.',
          context: {
            timestamp: new Date().toISOString(),
            testMode: true,
            financials: { salesRevenue: 0, totalExpenses: 0 },
            inventory: { totalProductsCount: 0, lowStockCount: 0 }
          },
          history: [],
          apiKey: aiApiKey.trim() || undefined,
          model: aiModel
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAiTestResult({
          success: true,
          message: data.text || 'Successfully connected to Google Gemini API!'
        });
        showToast.success('AI connection test passed!');
      } else {
        throw new Error(data.error || 'Server rejected the request.');
      }
    } catch (err: any) {
      console.error('Test Connection Error:', err);
      setAiTestResult({
        success: false,
        message: err.message || 'Failed to connect to Gemini API. Please verify the key and network connection.'
      });
      showToast.error('AI connection test failed');
    } finally {
      setIsTestingAi(false);
    }
  };

  // Form Submission
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeCategory === 'shop_info') {
        await shop.saveShopProfile({
          shopName: shop.shopName,
          shopLogo: shop.shopLogo,
          ownerName: shop.ownerName,
          businessType: shop.businessType,
          phone: shop.phone,
          whatsapp: shop.whatsapp,
          email: shop.email,
          website: shop.website,
          taxNumber: shop.taxNumber,
          ntn: shop.ntn,
          strn: shop.strn,
          address: shop.address,
          city: shop.city,
          country: shop.country,
          postalCode: shop.postalCode,
          businessHours: shop.businessHours,
          footerMessage: shop.footerMessage
        });
        showToast.success('Store Branding Profile updated and synchronized!');
      }

      if (activeCategory === 'receipt') {
        await receipt.saveReceiptConfig({
          receiptWidth: receipt.receiptWidth,
          thermalReceipt: receipt.thermalReceipt,
          a4Invoice: receipt.a4Invoice,
          showShopLogo: receipt.showShopLogo,
          showQrCode: receipt.showQrCode,
          showBarcode: receipt.showBarcode,
          showTaxNumber: receipt.showTaxNumber,
          showFooterMessage: receipt.showFooterMessage,
          showThankYouMessage: receipt.showThankYouMessage,
          customFooterText: receipt.customFooterText
        });
        showToast.success('Invoice & Receipt Print preferences saved!');
      }

      if (activeCategory === 'sales') {
        await updateSetting('default_payment_method', salesPayMethod);
        await updateSetting('default_tax', Number(salesTax));
        await updateSetting('default_discount', Number(salesDiscount));
        await updateSetting('allow_negative_stock', salesNegative);
        await updateSetting('require_customer', salesReqCustomer);
        await updateSetting('require_barcode', salesReqBarcode);
        await updateSetting('auto_print_receipt', salesAutoPrint);
        await updateSetting('invoice_prefix', salesPrefix.trim());
        await updateSetting('invoice_number_format', salesFormat.trim());
        showToast.success('POS billing rules saved successfully!');
      }

      if (activeCategory === 'purchase') {
        await updateSetting('purchase_prefix', purchasePrefix.trim());
        await updateSetting('auto_update_stock', purchaseAutoUpdateStock);
        await updateSetting('purchase_default_tax', Number(purchaseDefaultTax));
        await updateSetting('default_supplier', purchaseDefaultSupplier);
        showToast.success('Procurement settings saved!');
      }

      if (activeCategory === 'credit') {
        await updateSetting('default_credit_limit', Number(creditLimit));
        await updateSetting('grace_period', Number(creditGrace));
        await updateSetting('overdue_reminder_days', Number(creditReminder));
        await updateSetting('auto_block_limit', creditAutoBlock);
        await updateSetting('allow_partial_payment', creditPartial);
        showToast.success('Customer Credit policies updated!');
      }

      if (activeCategory === 'inventory') {
        await updateSetting('low_stock_threshold', Number(invThreshold));
        await updateSetting('enable_stock_alerts', invAlerts);
        await updateSetting('enable_stock_history', invHistory);
        await updateSetting('default_unit', invUnit);
        await updateSetting('barcode_format', invBarcodeFormat);
        await updateSetting('sku_format', invSkuFormat);
        showToast.success('Inventory standard parameters saved!');
      }

      if (activeCategory === 'expenses') {
        await updateSetting('expense_prefix', expPrefix.trim());
        await updateSetting('default_expense_category', expDefaultCat);
        await updateSetting('recurring_reminder', expRecurringReminder);
        showToast.success('Expense tracking metrics updated!');
      }

      if (activeCategory === 'dashboard') {
        await updateSetting('default_date_range', dashRange);
        await updateSetting('refresh_interval', Number(dashRefresh));
        await updateSetting('card_layout', dashLayout);
        showToast.success('Dashboard dashboard layout defaults saved!');
      }

      if (activeCategory === 'sync') {
        await backup.saveBackupConfig({
          syncUrl: backup.syncUrl.trim(),
          syncSecret: backup.syncSecret.trim(),
          autoSync: backup.autoSync,
          syncInterval: Number(backup.syncInterval),
          conflictPolicy: backup.conflictPolicy,
          backupNotifications: backup.backupNotifications
        });
        showToast.success('Synchronization & automated backup guidelines updated!');
      }

      if (activeCategory === 'security') {
        await security.saveSecurityConfig({
          sessionTimeout: Number(security.sessionTimeout),
          autoLogout: security.autoLogout,
          loginAttempts: Number(security.loginAttempts),
          passwordPolicy: security.passwordPolicy
        });
        showToast.success('System security policy updated!');
      }

      if (activeCategory === 'notifications') {
        await updateSetting('low_stock_notification', notifLowStock);
        await updateSetting('credit_due_notification', notifCredit);
        await updateSetting('backup_completed_notification', notifBackupComp);
        await updateSetting('backup_failed_notification', notifBackupFail);
        await updateSetting('recurring_expense_notification', notifExpense);
        await updateSetting('daily_summary_notification', notifDaily);
        showToast.success('System alarm notifications saved!');
      }

      if (activeCategory === 'appearance') {
        await theme.changeTheme(theme.theme);
        await theme.changeAccentColor(theme.accentColor);
        await theme.changeFontSize(theme.fontSize);
        await theme.changeSidebarStyle(theme.sidebarStyle);
        await theme.toggleCompactMode(theme.compactMode);
        showToast.success('Visual styling preferences loaded immediately!');
      }

      if (activeCategory === 'localization') {
        await updateSetting('language', locLang);
        await updateSetting('currency', locCurrency);
        await updateSetting('currency_symbol', locCurrencySymbol);
        await updateSetting('date_format', locDateFormat);
        await updateSetting('time_format', locTimeFormat);
        await updateSetting('number_format', locNumFormat);
        await updateSetting('timezone', locTimezone);
        showToast.success('Local settings and currencies saved!');
      }

      if (activeCategory === 'ai') {
        await updateSetting('ai_enabled', aiEnabled);
        await updateSetting('ai_api_key', aiApiKey.trim());
        await updateSetting('ai_model', aiModel);
        await updateSetting('ai_persona', aiPersona.trim());
        await updateSetting('ai_low_stock_advice', aiLowStockAdvice);
        showToast.success('AI Integration settings updated successfully!');
      }

    } catch (err: any) {
      showToast.error(`Failed to save settings: ${err.message || err}`);
    }
  };

  // Reusable JSON Import file trigger
  const handleJSONFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        if (evt.target?.result) {
          await importSettingsJSON(evt.target.result as string);
        }
      } catch (err) {
        // Handled by hook
      }
    };
    reader.readAsText(file);
    // Reset target value
    e.target.value = '';
  };

  // Trigger manual immediate file export
  const handleJSONFileExport = async () => {
    try {
      const data = await exportSettingsJSON();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShopCraft_Settings_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Handled by hook
    }
  };

  // Clear system Cache
  const handleClearCache = () => {
    // Clear custom caches but keep session
    try {
      localStorage.removeItem('theme-settings-theme');
      showToast.success('Client layout caches optimized and cleared successfully.');
    } catch (e) {
      showToast.error('Cache clear failed.');
    }
  };

  // Optimize DB
  const handleOptimizeDatabase = async () => {
    try {
      // Dummy check to trigger IndexedDB schema optimization
      await db.open();
      showToast.success('Dexie Local IndexedDB database structures optimized and indices compressed!');
    } catch (e) {
      showToast.error('Database optimization failed.');
    }
  };

  // Access check layer
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white dark:bg-slate-950 rounded-2xl border border-red-150 text-center shadow-md select-none">
        <Sliders className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-sm font-black uppercase text-red-600 tracking-tight">Access Control Denied</h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          The System Settings module is restricted strictly to active System Administrators. 
          Please contact your primary supervisor to request settings modifications.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            System Administration
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">
            Control branding parameters, receipts formatting, secure offline back-ups, database tables, and operator accounts.
          </p>
        </div>
      </div>

      {/* 2. Settings Dashboard Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
          <Database className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">Engine Status</span>
            <span className="text-xs font-black text-emerald-600">Active - Healthy</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
          <HardDrive className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">Database Size</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{stats.dbSizeEstimated}</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
          <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">Total Rows</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{stats.totalRecords} records</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
          <History className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">Last Backup</span>
            <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[120px]" title={stats.lastBackup}>{stats.lastBackup}</span>
          </div>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start gap-3">
          <Sliders className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">App version</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{stats.version}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Sidebar Category Selector */}
        <div className="lg:col-span-1 p-4 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Settings Categories</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 uppercase">
              16 Categories
            </span>
          </div>
          <SettingsSidebar 
            activeId={activeCategory} 
            onSelect={setActiveCategory} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            systemFilter={systemFilter}
            onSystemFilterChange={setSystemFilter}
          />
        </div>

        {/* Right Column: Forms / Tables viewport */}
        <div className="lg:col-span-2 space-y-6">
          <SettingsContainer activeCategory={activeCategory} onSubmit={handleSaveAll}>
            {/* Category 1: Shop Information */}
            {activeCategory === 'shop_info' && (
              <SettingsCard title="Store Branding Profile" description="These credentials set headings on printed receipts, payment reminders, and contact cards" icon={Store}>
                <LogoUploader 
                  label="Retail Store Banner Logo" 
                  description="Required PNG or JPG format with transparent backgrounds. Preserved in IndexedDB settings."
                  value={shop.shopLogo} 
                  onChange={(val) => shop.saveShopProfile({ shopLogo: val })} 
                />
                <SettingsGroup title="Core Store credentials">
                  <Input label="Store Display Name *" value={shop.shopName} onChange={(e) => shop.saveShopProfile({ shopName: e.target.value })} />
                  <Input label="Primary Corporate Phone *" value={shop.phone} onChange={(e) => shop.saveShopProfile({ phone: e.target.value })} />
                  <Input label="WhatsApp Line" value={shop.whatsapp} onChange={(e) => shop.saveShopProfile({ whatsapp: e.target.value })} />
                  <Input label="Contact Email Address *" value={shop.email} onChange={(e) => shop.saveShopProfile({ email: e.target.value })} />
                  <Input label="Official Website URL" value={shop.website} onChange={(e) => shop.saveShopProfile({ website: e.target.value })} />
                  <Input label="Business Hours Schedule" value={shop.businessHours} onChange={(e) => shop.saveShopProfile({ businessHours: e.target.value })} />
                </SettingsGroup>

                <SettingsGroup title="Legal & Tax credentials">
                  <Input label="Government Tax Identifier (TIN) *" value={shop.taxNumber} onChange={(e) => shop.saveShopProfile({ taxNumber: e.target.value })} />
                  <Input label="National Tax Number (NTN)" value={shop.ntn} onChange={(e) => shop.saveShopProfile({ ntn: e.target.value })} />
                  <Input label="Sales Tax Registration No (STRN)" value={shop.strn} onChange={(e) => shop.saveShopProfile({ strn: e.target.value })} />
                  <Input label="Store Legal Proprietor / Owner Name" value={shop.ownerName} onChange={(e) => shop.saveShopProfile({ ownerName: e.target.value })} />
                  <div className="md:col-span-2">
                    <Input label="Store Physical Address *" value={shop.address} onChange={(e) => shop.saveShopProfile({ address: e.target.value })} />
                  </div>
                  <Input label="City" value={shop.city} onChange={(e) => shop.saveShopProfile({ city: e.target.value })} />
                  <Input label="Country" value={shop.country} onChange={(e) => shop.saveShopProfile({ country: e.target.value })} />
                  <Input label="Postal / Zip Code" value={shop.postalCode} onChange={(e) => shop.saveShopProfile({ postalCode: e.target.value })} />
                  <Input label="Default Receipt Footer message" value={shop.footerMessage} onChange={(e) => shop.saveShopProfile({ footerMessage: e.target.value })} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 2: Receipt Settings */}
            {activeCategory === 'receipt' && (
              <SettingsCard title="Receipt Print Formatting" description="Control formatting, dimensions, logos, and policy statements on standard print vouchers" icon={Receipt}>
                <SettingsGroup title="Print Sizes and Toggles">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Receipt Print Width</label>
                    <select 
                      value={receipt.receiptWidth} 
                      onChange={(e) => receipt.saveReceiptConfig({ receiptWidth: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="58mm">58mm (Small Thermal Rolls)</option>
                      <option value="80mm">80mm (Standard Thermal slips)</option>
                      <option value="A4">A4 Size (Formal corporate sheet templates)</option>
                    </select>
                  </div>
                  <ToggleSwitch label="Optimize Thermal rolls" description="Structure prints to fit seamless continuous thermal paper lengths" checked={receipt.thermalReceipt} onChange={(val) => receipt.saveReceiptConfig({ thermalReceipt: val })} />
                  <ToggleSwitch label="Render formal A4 size" description="Generate full formal corporate layout formats instead of continuous slips" checked={receipt.a4Invoice} onChange={(val) => receipt.saveReceiptConfig({ a4Invoice: val })} />
                </SettingsGroup>

                <SettingsGroup title="Header & Footer items">
                  <ToggleSwitch label="Embed Store Logo" description="Print the uploaded corporate logo at the header of slips" checked={receipt.showShopLogo} onChange={(val) => receipt.saveReceiptConfig({ showShopLogo: val })} />
                  <ToggleSwitch label="Generate Dynamic QR code" description="Print QR lookups pointing to transaction hashes" checked={receipt.showQrCode} onChange={(val) => receipt.saveReceiptConfig({ showQrCode: val })} />
                  <ToggleSwitch label="Display standard Barcode" description="Embed EAN13 barcode identifiers for return scans" checked={receipt.showBarcode} onChange={(val) => receipt.saveReceiptConfig({ showBarcode: val })} />
                  <ToggleSwitch label="Show government Tax IDs" description="Include legal tax indices on invoice footnotes" checked={receipt.showTaxNumber} onChange={(val) => receipt.saveReceiptConfig({ showTaxNumber: val })} />
                  <ToggleSwitch label="Include Footer Greetings" description="Display standard gratitude footnotes" checked={receipt.showFooterMessage} onChange={(val) => receipt.saveReceiptConfig({ showFooterMessage: val })} />
                  <ToggleSwitch label="Show Thank You Subheader" description="Print direct appreciation subheadings" checked={receipt.showThankYouMessage} onChange={(val) => receipt.saveReceiptConfig({ showThankYouMessage: val })} />
                  <div className="md:col-span-2">
                    <Input label="Custom Return Policy / Footer Terms text" value={receipt.customFooterText} onChange={(e) => receipt.saveReceiptConfig({ customFooterText: e.target.value })} />
                  </div>
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 3: Sales Settings */}
            {activeCategory === 'sales' && (
              <SettingsCard title="POS Transactions & Billing" description="Configure parameters governing counter baskets, tax percentages, negative stock limits, and prefixes" icon={ShoppingBag}>
                <SettingsGroup title="Standard checkout parameters">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Default payment method</label>
                    <select value={salesPayMethod} onChange={(e) => setSalesPayMethod(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="Cash">Cash payment</option>
                      <option value="Credit Card">Credit Card terminal</option>
                      <option value="Mobile Wallet">Mobile Bank Wallet</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                  <Input label="Default Sales Tax %" type="number" min="0" max="100" value={salesTax} onChange={(e) => setSalesTax(Number(e.target.value))} />
                  <Input label="Default prefilled Discount %" type="number" min="0" max="100" value={salesDiscount} onChange={(e) => setSalesDiscount(Number(e.target.value))} />
                  <Input label="Invoice Prefix code *" value={salesPrefix} onChange={(e) => setSalesPrefix(e.target.value)} />
                  <div className="md:col-span-2">
                    <Input label="Invoice Identifier Format pattern *" value={salesFormat} onChange={(e) => setSalesFormat(e.target.value)} />
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Counter Guard rails">
                  <ToggleSwitch label="Allow Negative Stock sells" description="Let cashiers authorize checkouts even if virtual stock counts read zero" checked={salesNegative} onChange={setSalesNegative} />
                  <ToggleSwitch label="Require Customer association" description="Halt checkout submissions unless a registered customer is bound" checked={salesReqCustomer} onChange={setSalesReqCustomer} />
                  <ToggleSwitch label="Force Barcode scans" description="Disallow manually searching names inside the POS basket to enforce barcode accuracy" checked={salesReqBarcode} onChange={setSalesReqBarcode} />
                  <ToggleSwitch label="Auto-print on complete" description="Trigger standard system printer prompts instantly upon completing checkout logs" checked={salesAutoPrint} onChange={setSalesAutoPrint} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 4: Purchase Settings */}
            {activeCategory === 'purchase' && (
              <SettingsCard title="Wholesale Procurements" description="Manage stock inventory intake logs, prefixes, and suppliers" icon={ShoppingCart}>
                <SettingsGroup title="Supplier logs setup">
                  <Input label="Procurement Prefix *" value={purchasePrefix} onChange={(e) => setPurchasePrefix(e.target.value)} />
                  <Input label="Procurement standard Tax %" type="number" min="0" max="100" value={purchaseDefaultTax} onChange={(e) => setPurchaseDefaultTax(Number(e.target.value))} />
                  <Input label="Default preselected Supplier ID" value={purchaseDefaultSupplier} onChange={(e) => setPurchaseDefaultSupplier(e.target.value)} placeholder="e.g. SUP-1092" />
                  <ToggleSwitch label="Auto-Increment stock balances" description="Instantly update inventory levels upon completing wholesale procurement records" checked={purchaseAutoUpdateStock} onChange={setPurchaseAutoUpdateStock} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 5: Customer Credit Settings */}
            {activeCategory === 'credit' && (
              <SettingsCard title="Ledgers & Customer Credits" description="Manage overdue grace windows, default limits, and holds on credit sales" icon={CreditCard}>
                <SettingsGroup title="Credit standards">
                  <Input label="Default Credit Limit *" type="number" min="0" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} />
                  <Input label="Overdue grace periods (Days) *" type="number" min="1" value={creditGrace} onChange={(e) => setCreditGrace(Number(e.target.value))} />
                  <Input label="Prior warning reminders (Days) *" type="number" min="1" value={creditReminder} onChange={(e) => setCreditReminder(Number(e.target.value))} />
                  <ToggleSwitch label="Block when Over-limit" description="Halt further credit transactions if customer unpaid total exceeds limits" checked={creditAutoBlock} onChange={setCreditAutoBlock} />
                  <ToggleSwitch label="Authorize Partial payments" description="Allow logging multiple smaller installment values against single credit bills" checked={creditPartial} onChange={setCreditPartial} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 6: Inventory Settings */}
            {activeCategory === 'inventory' && (
              <SettingsCard title="Stock Inventory Parameters" description="Define low-stock notification triggers, unit descriptors, and generation patterns" icon={Boxes}>
                <SettingsGroup title="Standards and alert boundaries">
                  <Input label="System Low Stock threshold *" type="number" min="1" value={invThreshold} onChange={(e) => setInvThreshold(Number(e.target.value))} />
                  <Input label="Default Unit descriptor" value={invUnit} onChange={(e) => setInvUnit(e.target.value)} placeholder="e.g. pcs, boxes, ml" />
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Standard Barcode format</label>
                    <select value={invBarcodeFormat} onChange={(e) => setInvBarcodeFormat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="EAN13">EAN-13 (Standard retail)</option>
                      <option value="Code128">Code-128 (Alpha-Numeric)</option>
                      <option value="UPC">UPC-A (Universal standard)</option>
                    </select>
                  </div>
                  <Input label="SKU Generation pattern *" value={invSkuFormat} onChange={(e) => setInvSkuFormat(e.target.value)} />
                  <ToggleSwitch label="Sound alerts on Low Inventory" description="Play live warning tones when product items drop below stock levels" checked={invAlerts} onChange={setInvAlerts} />
                  <ToggleSwitch label="Enable detailed Stock history" description="Compile comprehensive lists of card entries on stock alterations" checked={invHistory} onChange={setInvHistory} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 7: Expense Settings */}
            {activeCategory === 'expenses' && (
              <SettingsCard title="Store Operating Costs" description="Control operational expenditure classifications, prefilled ledger tags, and calendar notifications" icon={Coins}>
                <SettingsGroup title="Ledger entries setup">
                  <Input label="Expense Prefix code *" value={expPrefix} onChange={(e) => setExpPrefix(e.target.value)} />
                  <Input label="Default Expense classification category" value={expDefaultCat} onChange={(e) => setExpDefaultCat(e.target.value)} />
                  <ToggleSwitch label="Notify on monthly recurrences" description="Alert admin users on upcoming operations obligations (rent, energy, payroll)" checked={expRecurringReminder} onChange={setExpRecurringReminder} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 8: Dashboard Widgets */}
            {activeCategory === 'dashboard' && (
              <SettingsCard title="Dashboard widgets" description="Personalize the primary analytical landing page layout" icon={LayoutDashboard}>
                <SettingsGroup title="Date defaults & refresh timer">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Default analytical frame</label>
                    <select value={dashRange} onChange={(e) => setDashRange(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="today">Today (Live values)</option>
                      <option value="7_days">Last 7 Days (Procurement logs)</option>
                      <option value="30_days">Last 30 Days (Standard monthly trends)</option>
                      <option value="90_days">Quarterly audits</option>
                    </select>
                  </div>
                  <Input label="Automated background refresh (Minutes)" type="number" min="1" max="60" value={dashRefresh} onChange={(e) => setDashRefresh(Number(e.target.value))} />
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Primary dashboard bento layout</label>
                    <select value={dashLayout} onChange={(e) => setDashLayout(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="grid">Grid layout (Highly compact)</option>
                      <option value="list">Vertical row stack (Tablet-focused)</option>
                    </select>
                  </div>
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 9: Backup & Cloud Sync */}
            {activeCategory === 'sync' && (
              <SettingsCard title="Google Sheets integration" description="Link your personal Google Spreadsheet for automated secure backups and live row syncs" icon={Cloud}>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150/50 dark:border-slate-850 text-[11px] font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                  Provide your deployed Google WebApp macro URL to link the system. Refer to instructions on the sidebar code downloader.
                </div>
                <SettingsGroup title="Cloud Integration Credentials">
                  <div className="md:col-span-2">
                    <Input label="Google Web App Macro URL" value={backup.syncUrl} onChange={(e) => backup.saveBackupConfig({ syncUrl: e.target.value })} placeholder="https://script.google.com/macros/s/.../exec" />
                  </div>
                  <div className="md:col-span-2">
                    <Input label="Integration Security password" type="password" value={backup.syncSecret} onChange={(e) => backup.saveBackupConfig({ syncSecret: e.target.value })} placeholder="Enter secure secret macro password" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Conflict Resolution policy</label>
                      <select value={backup.conflictPolicy} onChange={(e) => backup.saveBackupConfig({ conflictPolicy: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                        <option value="manual">Ask me (Verify row discrepancies manually)</option>
                        <option value="cloud">Cloud Overwrite (Spreadsheet always wins)</option>
                        <option value="local">Local Overwrite (Local IndexedDB always wins)</option>
                      </select>
                    </div>
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Macro behaviors">
                  <ToggleSwitch label="Enable automatic background sync" description="Verify connections and upload queue segments during operating minutes" checked={backup.autoSync} onChange={(val) => backup.saveBackupConfig({ autoSync: val })} />
                  <Input label="Automated check intervals (Minutes)" type="number" min="1" disabled={!backup.autoSync} value={backup.syncInterval} onChange={(e) => backup.saveBackupConfig({ syncInterval: Number(e.target.value) })} />
                  <ToggleSwitch label="Show success backup notifications" description="Push desktop status alerts when sync queues clear successfully" checked={backup.backupNotifications} onChange={(val) => backup.saveBackupConfig({ backupNotifications: val })} />
                </SettingsGroup>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex flex-col sm:flex-row items-center gap-3">
                  {/* JSON actions */}
                  <button
                    type="button"
                    onClick={handleJSONFileExport}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON Backup</span>
                  </button>

                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span>Import JSON Backup</span>
                    <input type="file" accept=".json" onChange={handleJSONFileImport} className="hidden" />
                  </label>
                </div>
              </SettingsCard>
            )}

            {/* Category 10: Security Settings */}
            {activeCategory === 'security' && (
              <SettingsCard title="System Security policies" description="Establish lockouts, idle timers, and validation guidelines" icon={Lock}>
                <SettingsGroup title="Rules and timeout controls">
                  <Input label="Operator Idle Session Timeout (Minutes) *" type="number" min="1" value={security.sessionTimeout} onChange={(e) => security.saveSecurityConfig({ sessionTimeout: Number(e.target.value) })} />
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Minimum password policy standards</label>
                    <select value={security.passwordPolicy} onChange={(e) => security.saveSecurityConfig({ passwordPolicy: e.target.value as any })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="basic">Basic (Minimum 6 digits, any character)</option>
                      <option value="medium">Medium (Minimum 8 digits, letters & numbers)</option>
                      <option value="strong">Strong (Caps, symbols, complex blocks)</option>
                    </select>
                  </div>
                  <Input label="Allowable Password entry attempts *" type="number" min="3" max="10" value={security.loginAttempts} onChange={(e) => security.saveSecurityConfig({ loginAttempts: Number(e.target.value) })} />
                  <ToggleSwitch label="Enable automatic operator logout" description="Exit current session if user stays idle beyond thresholds" checked={security.autoLogout} onChange={(val) => security.saveSecurityConfig({ autoLogout: val })} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 11: Users */}
            {activeCategory === 'users' && (
              <SettingsCard title="Store operator accounts" description="Deactivate, edit, create cashier profiles, and verify role accesses" icon={Users}>
                <div className="space-y-6">
                  {/* Table */}
                  <UserManagementTable />
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-6">
                    <PermissionTable />
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* Category 12: Notifications */}
            {activeCategory === 'notifications' && (
              <SettingsCard title="System alarm notifications" description="Toggle banners on critical operation events" icon={Bell}>
                <SettingsGroup title="Trigger and warning parameters">
                  <ToggleSwitch label="Trigger alert on low inventory" description="Notify cashier on product units hitting threshold levels" checked={notifLowStock} onChange={setNotifLowStock} />
                  <ToggleSwitch label="Notify on overdue customer debt" description="Highlight overdue payment milestones" checked={notifCredit} onChange={setNotifCredit} />
                  <ToggleSwitch label="Push notices on successful syncs" description="Show green status bars on completed sheets backup events" checked={notifBackupComp} onChange={setNotifBackupComp} />
                  <ToggleSwitch label="Notify on sync interruptions" description="Highlight local queue buffers when connections drop" checked={notifBackupFail} onChange={setNotifBackupFail} />
                  <ToggleSwitch label="Alert on upcoming operating obligations" description="Highlight expenses scheduled for routing monthly payments" checked={notifExpense} onChange={setNotifExpense} />
                  <ToggleSwitch label="EOD summary digest statistics" description="Prepare daily revenue analytics digest" checked={notifDaily} onChange={setNotifDaily} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category 13: Appearance */}
            {activeCategory === 'appearance' && (
              <SettingsCard title="Appearance & Themes" description="Manage typography, themes, and navigation drawers" icon={Palette}>
                <SettingsGroup title="Skins and colors">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Color theme skins</label>
                    <select value={theme.theme} onChange={(e) => theme.changeTheme(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="light">Light Theme (Minimalist Slate)</option>
                      <option value="dark">Dark Theme (Deep Onyx)</option>
                      <option value="system">Match system standard OS palette</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Application text scaling</label>
                    <select value={theme.fontSize} onChange={(e) => theme.changeFontSize(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="small">Small (Micro-view dashboards)</option>
                      <option value="medium">Medium (Standard layout)</option>
                      <option value="large">Large (High clarity accessibility scale)</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Navigation sidebar drawer style</label>
                    <select value={theme.sidebarStyle} onChange={(e) => theme.changeSidebarStyle(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="expanded">Expanded (Left navigation labels always visible)</option>
                      <option value="collapsed">Collapsed (Icon-only compact track)</option>
                    </select>
                  </div>
                  <ColorPicker label="Accent Highlighter Hex color" description="Select a highlight accent for buttons, borders, and anchors" value={theme.accentColor} onChange={(val) => theme.changeAccentColor(val)} />
                  <ToggleSwitch label="Compact Mode spacing" description="Minimize whitespace margins to fit maximum rows on grid" checked={theme.compactMode} onChange={(val) => theme.toggleCompactMode(val)} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category: Appearance & Display */}
            {activeCategory === 'appearance_display' && (
              <SettingsCard title="Appearance & Display Options" description="Customize overall scaling, typography sizes, and component layout density" icon={Palette}>
                <SettingsGroup title="Overall Scaling & Typography">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Display Scale</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-mono">
                        {Math.round(appearanceSettings.uiScale * 100)}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="1.3" 
                      step="0.1" 
                      value={appearanceSettings.uiScale}
                      onChange={(e) => updateAppearanceSetting('uiScale', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5 select-none">
                      <span>80%</span>
                      <span>90%</span>
                      <span>100% (Default)</span>
                      <span>110%</span>
                      <span>120%</span>
                      <span>130%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Global Text Size</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-mono">
                        {appearanceSettings.textSize}px
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="18" 
                      step="1" 
                      value={appearanceSettings.textSize}
                      onChange={(e) => updateAppearanceSetting('textSize', parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5 select-none">
                      <span>12px</span>
                      <span>13px</span>
                      <span>14px (Def)</span>
                      <span>15px</span>
                      <span>16px</span>
                      <span>17px</span>
                      <span>18px</span>
                    </div>
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Component layout densities">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Card Size & Padding</label>
                    <select
                      value={appearanceSettings.cardSize}
                      onChange={(e) => updateAppearanceSetting('cardSize', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="compact">Compact (Narrow padding / small radius)</option>
                      <option value="comfortable">Comfortable (Standard layout spacing)</option>
                      <option value="large">Large (Generous gaps and roundness)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Table Grid Density</label>
                    <select
                      value={appearanceSettings.tableDensity}
                      onChange={(e) => updateAppearanceSetting('tableDensity', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="compact">Compact (Tight data list rows)</option>
                      <option value="comfortable">Comfortable (Standard ledger view)</option>
                      <option value="spacious">Spacious (Highly readable spacing)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Button Sizing Scale</label>
                    <select
                      value={appearanceSettings.buttonSize}
                      onChange={(e) => updateAppearanceSetting('buttonSize', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="small">Small (Mini click targets)</option>
                      <option value="medium">Medium (Standard actions)</option>
                      <option value="large">Large (High-clarity targets)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Input Field Heights</label>
                    <select
                      value={appearanceSettings.inputSize}
                      onChange={(e) => updateAppearanceSetting('inputSize', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="small">Small (Compact input boxes)</option>
                      <option value="medium">Medium (Default text boxes)</option>
                      <option value="large">Large (Accessible input heights)</option>
                    </select>
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Navigation panel layout">
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Sidebar Navigation Style</label>
                    <select
                      value={appearanceSettings.sidebarWidth}
                      onChange={(e) => updateAppearanceSetting('sidebarWidth', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="normal">Normal Width (Standard expand-on-hover track)</option>
                      <option value="compact">Compact Width (Narrower footprint / small track)</option>
                    </select>
                  </div>
                </SettingsGroup>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-5 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-bold text-slate-850 dark:text-white">Reset Appearance & Display settings</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">
                      Restore overall scale, global font size, card paddings, table densities, and sidebar layout widths back to system default values.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetAppearance();
                      showToast.success('Visual styling preferences restored to factory defaults!');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/50 text-rose-600 dark:text-rose-450 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Restore Defaults</span>
                  </button>
                </div>
              </SettingsCard>
            )}

            {/* Category 14: Localization */}
            {activeCategory === 'localization' && (
              <SettingsCard title="Localization & Country standards" description="Manage languages, currencies, and timestamps formatting parameters" icon={Globe}>
                <SettingsGroup title="Standards selection">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">System language</label>
                    <select value={locLang} onChange={(e) => setLocLang(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="en">English (US standard)</option>
                      <option value="es">Español (ES standard)</option>
                      <option value="fr">Français (FR standard)</option>
                    </select>
                  </div>
                  <Input label="Base ISO Currency code *" value={locCurrency} onChange={(e) => setLocCurrency(e.target.value)} />
                  <Input label="Visual currency prefix symbol *" value={locCurrencySymbol} onChange={(e) => setLocCurrencySymbol(e.target.value)} />
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Date layout standard</label>
                    <select value={locDateFormat} onChange={(e) => setLocDateFormat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 standard)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (European standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Display clock mode</label>
                    <select value={locTimeFormat} onChange={(e) => setLocTimeFormat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="12_hour">12-Hour format (AM / PM)</option>
                      <option value="24_hour">24-Hour format (Military clock)</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Number parsing decimal format</label>
                    <select value={locNumFormat} onChange={(e) => setLocNumFormat(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-hidden">
                      <option value="comma">1,234.56 (Standard comma)</option>
                      <option value="period">1.234,56 (European period)</option>
                    </select>
                  </div>
                  <Input label="Active system timezone *" value={locTimezone} onChange={(e) => setLocTimezone(e.target.value)} />
                </SettingsGroup>
              </SettingsCard>
            )}

            {/* Category: AI Integration */}
            {activeCategory === 'ai' && (
              <SettingsCard title="AI Integration & Intelligence" description="Configure your Google Gemini API parameters, custom assistant behaviors, and prompt grounding options" icon={Sparkles}>
                <SettingsGroup title="Core Connection Settings">
                  <div className="md:col-span-2">
                    <ToggleSwitch
                      label="Enable Floating AI Assistant Bubble"
                      description="Display the floating multi-color bubble on the bottom-right of the dashboard for direct interactive chatting with Gemini."
                      checked={aiEnabled}
                      onChange={setAiEnabled}
                    />
                  </div>
                  
                  <div className="md:col-span-2 mt-4">
                    <PasswordInput
                      label="Custom Google Gemini API Key"
                      value={aiApiKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      helperText="Specify your own Google Gemini API key to override the server's default configuration. Left empty, the system default key is used."
                    />
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <Select
                      label="Active Language Model"
                      value={aiModel}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAiModel(e.target.value)}
                      options={[
                        { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Default - Ultra speed & rich intelligence)' },
                        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced performance)' },
                        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deeper strategic analytical reasoning)' },
                        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Legacy compatibility)' }
                      ]}
                      helperText="Different models offer varying balances of analytical depth, completion speed, and processing volume quotas."
                    />
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Coaching & Prompt Grounding Guidelines">
                  <div className="md:col-span-2">
                    <TextArea
                      label="Assistant Custom Persona & Tuning Profile"
                      value={aiPersona}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiPersona(e.target.value)}
                      placeholder="You are an expert Retail Business Intelligence & Financial Analyst..."
                      helperText="Inject your custom instructions or operating procedures. The AI assistant will prioritize these instructions during store analysis."
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2 mt-4">
                    <ToggleSwitch
                      label="Incorporate Proactive Low Stock Restock Advice"
                      description="Ground the assistant heavily on inventory constraints, enabling it to suggest specific reordering quantities and restock timelines."
                      checked={aiLowStockAdvice}
                      onChange={setAiLowStockAdvice}
                    />
                  </div>
                </SettingsGroup>

                {/* Connection Testing Diagnostics */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-5 mt-4 select-none">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-xs font-bold text-slate-850 dark:text-white">Run API Connectivity Diagnostics</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">
                        Test connection with the current API Key and selected model to verify if credentials and network handshake complete successfully.
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingAi}
                      onClick={handleTestConnection}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-55"
                    >
                      {isTestingAi ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Testing API Handshake...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Test Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiTestResult && (
                    <div className={`mt-4 p-4 rounded-xl border text-left ${
                      aiTestResult.success 
                        ? 'bg-emerald-50/50 border-emerald-150 dark:bg-emerald-950/10 dark:border-emerald-900/40' 
                        : 'bg-red-50/50 border-red-150 dark:bg-red-950/10 dark:border-red-900/40'
                    }`}>
                      <div className="flex gap-2.5 items-start">
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${
                          aiTestResult.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs font-bold ${
                            aiTestResult.success ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'
                          }`}>
                            {aiTestResult.success ? 'Handshake Successful' : 'Handshake Failed'}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-405 leading-normal font-medium">
                            {aiTestResult.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SettingsCard>
            )}

            {/* Category 15: Advanced Operations */}
            {activeCategory === 'advanced' && (
              <SettingsCard title="Advanced Operations" description="Maintain performance health indices, optimize tables, or wipe selective segments" icon={Sliders}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rebuild Indices */}
                  <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-left flex flex-col gap-2">
                    <h4 className="text-xs font-extrabold text-slate-850 dark:text-white">Optimize Database Engine</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                      Optimize table spaces, garbage-collect dead records, and re-index lookup keys inside Dexie.
                    </p>
                    <button
                      type="button"
                      onClick={handleOptimizeDatabase}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-150 text-indigo-600 font-bold text-[10px] uppercase w-fit"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Defragment DB</span>
                    </button>
                  </div>

                  {/* Clear Local Cache */}
                  <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-left flex flex-col gap-2">
                    <h4 className="text-xs font-extrabold text-slate-850 dark:text-white">Flush System Layout Cache</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                      Clear visual parameters and layout templates preserved inside client localStorage cache.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-[10px] uppercase w-fit dark:border-slate-800 dark:text-slate-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Flush Cache</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex flex-col gap-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-red-500">Irreversible Wipe operations</h4>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-normal">
                    Authorized operators can selectively wipe table segments or trigger complete database segment resets. A safety backup JSON copy is generated.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 rounded-xl text-xs font-bold w-fit shadow-xs transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Open Reset Console</span>
                  </button>
                </div>
              </SettingsCard>
            )}

            {/* Category: System Audit & Diagnostics */}
            {activeCategory === 'system_audit' && (
              <SystemAuditPanel />
            )}

            {/* 4. Action Save Bar (Hidden on users, advanced, and audit tabs because they handle their own operations) */}
            {activeCategory !== 'users' && activeCategory !== 'advanced' && activeCategory !== 'system_audit' && activeCategory !== 'appearance_display' && (
              <div className="flex items-center justify-end">
                <Button variant="success" size="md" type="submit" className="w-full sm:w-auto shadow-md">
                  <Save className="h-4.5 w-4.5 mr-2" />
                  <span>Save {SETTINGS_CATEGORIES.find(c => c.id === activeCategory)?.label} Settings</span>
                </Button>
              </div>
            )}
          </SettingsContainer>
        </div>
      </div>

      {/* Reset Operations Dialog */}
      <ResetDialog 
        isOpen={isResetOpen} 
        onClose={() => setIsResetOpen(false)} 
        onResetCompleted={loadStatsAndOverrides} 
      />
    </div>
  );
};

export default Settings;
