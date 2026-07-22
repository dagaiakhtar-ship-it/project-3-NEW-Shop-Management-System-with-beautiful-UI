import { useState, useEffect, useCallback } from 'react';
import { 
  loadSetting, 
  saveSetting, 
  loadAllSettings, 
  resetSetting, 
  exportSettings as exportAll, 
  importSettings as importAll,
  applyThemeToDOM,
  DEFAULT_SETTINGS
} from '../utils/settingsHelpers';
import { db, type Setting } from '../database/db';
import showToast from '../utils/toast';
import useAppStore from '../store/useAppStore';

/**
 * Hook to manage overall settings, categories, and bulk operations.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadAllSettings();
      setSettings(all);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: any) => {
    try {
      await saveSetting(key, value);
      // Update local state
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value, updatedAt: new Date() } : s));
    } catch (err: any) {
      showToast.error(`Failed to update setting ${key}: ${err.message || err}`);
      throw err;
    }
  };

  const resetToDefault = async (key: string) => {
    try {
      const defVal = await resetSetting(key);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: defVal, updatedAt: new Date() } : s));
      showToast.success('Setting reset to default!');
      return defVal;
    } catch (err: any) {
      showToast.error(`Failed to reset setting: ${err.message || err}`);
      throw err;
    }
  };

  const importSettingsJSON = async (jsonString: string) => {
    try {
      await importAll(jsonString);
      await fetchSettings();
      showToast.success('Settings imported successfully!');
    } catch (err: any) {
      showToast.error(`Import failed: ${err.message || err}`);
      throw err;
    }
  };

  const exportSettingsJSON = async (): Promise<string> => {
    try {
      return await exportAll();
    } catch (err: any) {
      showToast.error(`Export failed: ${err.message || err}`);
      throw err;
    }
  };

  return {
    settings,
    loading,
    refresh: fetchSettings,
    updateSetting,
    resetToDefault,
    importSettingsJSON,
    exportSettingsJSON
  };
}

/**
 * Hook to access and manage visual settings (theme, fonts, sizes).
 */
export function useThemeSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sidebarStyle, setSidebarStyle] = useState<'expanded' | 'collapsed'>('expanded');
  const [compactMode, setCompactMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThemeConfig() {
      setLoading(true);
      const t = await loadSetting<'light' | 'dark' | 'system'>('theme', 'light');
      const a = await loadSetting<string>('accent_color', '#4f46e5');
      const f = await loadSetting<'small' | 'medium' | 'large'>('font_size', 'medium');
      const s = await loadSetting<'expanded' | 'collapsed'>('sidebar_style', 'expanded');
      const c = await loadSetting<boolean>('compact_mode', false);

      setTheme(t);
      setAccentColor(a);
      setFontSize(f);
      setSidebarStyle(s);
      setCompactMode(c);
      setLoading(false);

      // Instantly apply theme to DOM to avoid hydration flicker
      applyThemeToDOM(t);
    }
    loadThemeConfig();
  }, []);

  const changeTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    await saveSetting('theme', newTheme);

    // Synchronize with our unified global app store
    let resolved: 'light' | 'dark' = 'light';
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }
    useAppStore.getState().setThemeMode(resolved);
  };

  const changeAccentColor = async (color: string) => {
    setAccentColor(color);
    await saveSetting('accent_color', color);
  };

  const changeFontSize = async (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    await saveSetting('font_size', size);
  };

  const changeSidebarStyle = async (style: 'expanded' | 'collapsed') => {
    setSidebarStyle(style);
    await saveSetting('sidebar_style', style);
  };

  const toggleCompactMode = async (compact: boolean) => {
    setCompactMode(compact);
    await saveSetting('compact_mode', compact);
  };

  return {
    theme,
    accentColor,
    fontSize,
    sidebarStyle,
    compactMode,
    loading,
    changeTheme,
    changeAccentColor,
    changeFontSize,
    changeSidebarStyle,
    toggleCompactMode
  };
}

/**
 * Hook to access and manage store branding profile information.
 */
export function useShopSettings() {
  const [shopName, setShopName] = useState('ShopCraft Retail');
  const [shopLogo, setShopLogo] = useState('');
  const [ownerName, setOwnerName] = useState('John Doe');
  const [businessType, setBusinessType] = useState('Retail Store');
  const [phone, setPhone] = useState('+1 (555) 832-1920');
  const [whatsapp, setWhatsapp] = useState('+1 (555) 832-1920');
  const [email, setEmail] = useState('contact@shopcraft.com');
  const [website, setWebsite] = useState('www.shopcraft.com');
  const [taxNumber, setTaxNumber] = useState('TAX-84291-SF');
  const [ntn, setNtn] = useState('NTN-12948-3');
  const [strn, setStrn] = useState('STRN-58291-0');
  const [address, setAddress] = useState('120 Market Street, Suite 4A, San Francisco, CA');
  const [city, setCity] = useState('San Francisco');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('94102');
  const [businessHours, setBusinessHours] = useState('09:00 AM - 09:00 PM');
  const [footerMessage, setFooterMessage] = useState('Thank you for shopping with us!');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShopConfig() {
      setLoading(true);
      setShopName(await loadSetting('shop_name', 'ShopCraft Retail'));
      setShopLogo(await loadSetting('shop_logo', ''));
      setOwnerName(await loadSetting('owner_name', 'John Doe'));
      setBusinessType(await loadSetting('business_type', 'Retail Store'));
      setPhone(await loadSetting('phone', '+1 (555) 832-1920'));
      setWhatsapp(await loadSetting('whatsapp', '+1 (555) 832-1920'));
      setEmail(await loadSetting('email', 'contact@shopcraft.com'));
      setWebsite(await loadSetting('website', 'www.shopcraft.com'));
      setTaxNumber(await loadSetting('tax_number', 'TAX-84291-SF'));
      setNtn(await loadSetting('ntn', 'NTN-12948-3'));
      setStrn(await loadSetting('strn', 'STRN-58291-0'));
      setAddress(await loadSetting('address', '120 Market Street, Suite 4A, San Francisco, CA'));
      setCity(await loadSetting('city', 'San Francisco'));
      setCountry(await loadSetting('country', 'United States'));
      setPostalCode(await loadSetting('postal_code', '94102'));
      setBusinessHours(await loadSetting('business_hours', '09:00 AM - 09:00 PM'));
      setFooterMessage(await loadSetting('footer_message', 'Thank you for shopping with us!'));
      setLoading(false);
    }
    loadShopConfig();
  }, []);

  const saveShopProfile = async (data: Partial<{
    shopName: string;
    shopLogo: string;
    ownerName: string;
    businessType: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    taxNumber: string;
    ntn: string;
    strn: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    businessHours: string;
    footerMessage: string;
  }>) => {
    if (data.shopName !== undefined) { setShopName(data.shopName); await saveSetting('shop_name', data.shopName); }
    if (data.shopLogo !== undefined) { setShopLogo(data.shopLogo); await saveSetting('shop_logo', data.shopLogo); }
    if (data.ownerName !== undefined) { setOwnerName(data.ownerName); await saveSetting('owner_name', data.ownerName); }
    if (data.businessType !== undefined) { setBusinessType(data.businessType); await saveSetting('business_type', data.businessType); }
    if (data.phone !== undefined) { setPhone(data.phone); await saveSetting('phone', data.phone); }
    if (data.whatsapp !== undefined) { setWhatsapp(data.whatsapp); await saveSetting('whatsapp', data.whatsapp); }
    if (data.email !== undefined) { setEmail(data.email); await saveSetting('email', data.email); }
    if (data.website !== undefined) { setWebsite(data.website); await saveSetting('website', data.website); }
    if (data.taxNumber !== undefined) { setTaxNumber(data.taxNumber); await saveSetting('tax_number', data.taxNumber); }
    if (data.ntn !== undefined) { setNtn(data.ntn); await saveSetting('ntn', data.ntn); }
    if (data.strn !== undefined) { setStrn(data.strn); await saveSetting('strn', data.strn); }
    if (data.address !== undefined) { setAddress(data.address); await saveSetting('address', data.address); }
    if (data.city !== undefined) { setCity(data.city); await saveSetting('city', data.city); }
    if (data.country !== undefined) { setCountry(data.country); await saveSetting('country', data.country); }
    if (data.postalCode !== undefined) { setPostalCode(data.postalCode); await saveSetting('postal_code', data.postalCode); }
    if (data.businessHours !== undefined) { setBusinessHours(data.businessHours); await saveSetting('business_hours', data.businessHours); }
    if (data.footerMessage !== undefined) { setFooterMessage(data.footerMessage); await saveSetting('footer_message', data.footerMessage); }
  };

  return {
    shopName,
    shopLogo,
    ownerName,
    businessType,
    phone,
    whatsapp,
    email,
    website,
    taxNumber,
    ntn,
    strn,
    address,
    city,
    country,
    postalCode,
    businessHours,
    footerMessage,
    loading,
    saveShopProfile
  };
}

/**
 * Hook to access and manage print-receipt styling parameters.
 */
export function useReceiptSettings() {
  const [receiptWidth, setReceiptWidth] = useState('80mm');
  const [thermalReceipt, setThermalReceipt] = useState(true);
  const [a4Invoice, setA4Invoice] = useState(false);
  const [showShopLogo, setShowShopLogo] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showTaxNumber, setShowTaxNumber] = useState(true);
  const [showFooterMessage, setShowFooterMessage] = useState(true);
  const [showThankYouMessage, setShowThankYouMessage] = useState(true);
  const [customFooterText, setCustomFooterText] = useState('Please retain receipt for exchange within 7 days.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceiptConfig() {
      setLoading(true);
      setReceiptWidth(await loadSetting('receipt_width', '80mm'));
      setThermalReceipt(await loadSetting('thermal_receipt', true));
      setA4Invoice(await loadSetting('a4_invoice', false));
      setShowShopLogo(await loadSetting('show_shop_logo', true));
      setShowQrCode(await loadSetting('show_qr_code', true));
      setShowBarcode(await loadSetting('show_barcode', true));
      setShowTaxNumber(await loadSetting('show_tax_number', true));
      setShowFooterMessage(await loadSetting('show_footer_message', true));
      setShowThankYouMessage(await loadSetting('show_thank_you_message', true));
      setCustomFooterText(await loadSetting('custom_footer_text', 'Please retain receipt for exchange within 7 days.'));
      setLoading(false);
    }
    loadReceiptConfig();
  }, []);

  const saveReceiptConfig = async (data: Partial<{
    receiptWidth: string;
    thermalReceipt: boolean;
    a4Invoice: boolean;
    showShopLogo: boolean;
    showQrCode: boolean;
    showBarcode: boolean;
    showTaxNumber: boolean;
    showFooterMessage: boolean;
    showThankYouMessage: boolean;
    customFooterText: string;
  }>) => {
    if (data.receiptWidth !== undefined) { setReceiptWidth(data.receiptWidth); await saveSetting('receipt_width', data.receiptWidth); }
    if (data.thermalReceipt !== undefined) { setThermalReceipt(data.thermalReceipt); await saveSetting('thermal_receipt', data.thermalReceipt); }
    if (data.a4Invoice !== undefined) { setA4Invoice(data.a4Invoice); await saveSetting('a4_invoice', data.a4Invoice); }
    if (data.showShopLogo !== undefined) { setShowShopLogo(data.showShopLogo); await saveSetting('show_shop_logo', data.showShopLogo); }
    if (data.showQrCode !== undefined) { setShowQrCode(data.showQrCode); await saveSetting('show_qr_code', data.showQrCode); }
    if (data.showBarcode !== undefined) { setShowBarcode(data.showBarcode); await saveSetting('show_barcode', data.showBarcode); }
    if (data.showTaxNumber !== undefined) { setShowTaxNumber(data.showTaxNumber); await saveSetting('show_tax_number', data.showTaxNumber); }
    if (data.showFooterMessage !== undefined) { setShowFooterMessage(data.showFooterMessage); await saveSetting('show_footer_message', data.showFooterMessage); }
    if (data.showThankYouMessage !== undefined) { setShowThankYouMessage(data.showThankYouMessage); await saveSetting('show_thank_you_message', data.showThankYouMessage); }
    if (data.customFooterText !== undefined) { setCustomFooterText(data.customFooterText); await saveSetting('custom_footer_text', data.customFooterText); }
  };

  return {
    receiptWidth,
    thermalReceipt,
    a4Invoice,
    showShopLogo,
    showQrCode,
    showBarcode,
    showTaxNumber,
    showFooterMessage,
    showThankYouMessage,
    customFooterText,
    loading,
    saveReceiptConfig
  };
}

/**
 * Hook to access and manage security credentials and login configuration.
 */
export function useSecuritySettings() {
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [autoLogout, setAutoLogout] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [passwordPolicy, setPasswordPolicy] = useState<'basic' | 'medium' | 'strong'>('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSecurityConfig() {
      setLoading(true);
      setSessionTimeout(await loadSetting('session_timeout', 30));
      setAutoLogout(await loadSetting('auto_logout', false));
      setLoginAttempts(await loadSetting('login_attempts', 5));
      setPasswordPolicy(await loadSetting('password_policy', 'medium'));
      setLoading(false);
    }
    loadSecurityConfig();
  }, []);

  const saveSecurityConfig = async (data: Partial<{
    sessionTimeout: number;
    autoLogout: boolean;
    loginAttempts: number;
    passwordPolicy: 'basic' | 'medium' | 'strong';
  }>) => {
    if (data.sessionTimeout !== undefined) { setSessionTimeout(data.sessionTimeout); await saveSetting('session_timeout', data.sessionTimeout); }
    if (data.autoLogout !== undefined) { setAutoLogout(data.autoLogout); await saveSetting('auto_logout', data.autoLogout); }
    if (data.loginAttempts !== undefined) { setLoginAttempts(data.loginAttempts); await saveSetting('login_attempts', data.loginAttempts); }
    if (data.passwordPolicy !== undefined) { setPasswordPolicy(data.passwordPolicy); await saveSetting('password_policy', data.passwordPolicy); }
  };

  return {
    sessionTimeout,
    autoLogout,
    loginAttempts,
    passwordPolicy,
    loading,
    saveSecurityConfig
  };
}

/**
 * Hook to access and manage automated Google backup configuration.
 */
export function useBackupSettings() {
  const [syncUrl, setSyncUrl] = useState('');
  const [syncSecret, setSyncSecret] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15);
  const [conflictPolicy, setConflictPolicy] = useState<'local' | 'cloud' | 'manual'>('manual');
  const [backupNotifications, setBackupNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBackupConfig() {
      setLoading(true);
      setSyncUrl(await loadSetting('sync_google_apps_script_url', ''));
      setSyncSecret(await loadSetting('sync_secret_token', ''));
      setAutoSync(await loadSetting('sync_auto_toggle', false));
      setSyncInterval(await loadSetting('sync_interval', 15));
      setConflictPolicy(await loadSetting('sync_conflict_policy', 'manual'));
      setBackupNotifications(await loadSetting('backup_notifications', true));
      setLoading(false);
    }
    loadBackupConfig();
  }, []);

  const saveBackupConfig = async (data: Partial<{
    syncUrl: string;
    syncSecret: string;
    autoSync: boolean;
    syncInterval: number;
    conflictPolicy: 'local' | 'cloud' | 'manual';
    backupNotifications: boolean;
  }>) => {
    if (data.syncUrl !== undefined) { setSyncUrl(data.syncUrl); await saveSetting('sync_google_apps_script_url', data.syncUrl); }
    if (data.syncSecret !== undefined) { setSyncSecret(data.syncSecret); await saveSetting('sync_secret_token', data.syncSecret); }
    if (data.autoSync !== undefined) { setAutoSync(data.autoSync); await saveSetting('sync_auto_toggle', data.autoSync); }
    if (data.syncInterval !== undefined) { setSyncInterval(data.syncInterval); await saveSetting('sync_interval', data.syncInterval); }
    if (data.conflictPolicy !== undefined) { setConflictPolicy(data.conflictPolicy); await saveSetting('sync_conflict_policy', data.conflictPolicy); }
    if (data.backupNotifications !== undefined) { setBackupNotifications(data.backupNotifications); await saveSetting('backup_notifications', data.backupNotifications); }
  };

  return {
    syncUrl,
    syncSecret,
    autoSync,
    syncInterval,
    conflictPolicy,
    backupNotifications,
    loading,
    saveBackupConfig
  };
}
