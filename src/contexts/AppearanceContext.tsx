import React, { createContext, useContext, useState, useEffect } from 'react';

export type CardSize = 'compact' | 'comfortable' | 'large';
export type TableDensity = 'compact' | 'comfortable' | 'spacious';
export type ElementSize = 'small' | 'medium' | 'large';
export type SidebarWidth = 'normal' | 'compact';

export interface AppearanceSettings {
  uiScale: number; // 0.8, 0.9, 1.0, 1.1, 1.2, 1.3
  textSize: number; // 12, 13, 14, 15, 16, 17, 18
  cardSize: CardSize;
  tableDensity: TableDensity;
  buttonSize: ElementSize;
  inputSize: ElementSize;
  sidebarWidth: SidebarWidth;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  uiScale: 1.0,
  textSize: 14,
  cardSize: 'comfortable',
  tableDensity: 'comfortable',
  buttonSize: 'medium',
  inputSize: 'medium',
  sidebarWidth: 'normal',
};

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  resetAppearance: () => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const applyAppearanceToDOM = (settings: AppearanceSettings) => {
  const root = document.documentElement;
  
  // 1. Display Scale
  root.style.setProperty('--ui-scale', settings.uiScale.toString());
  
  // 2. Text Size (sets root font-size so that rem units automatically scale)
  root.style.setProperty('--font-size-base', `${settings.textSize}px`);
  
  // 3. Card Size
  if (settings.cardSize === 'compact') {
    root.style.setProperty('--card-padding', '0.75rem');
    root.style.setProperty('--card-gap', '0.5rem');
    root.style.setProperty('--border-radius', '0.375rem');
  } else if (settings.cardSize === 'comfortable') {
    root.style.setProperty('--card-padding', '1.25rem');
    root.style.setProperty('--card-gap', '1rem');
    root.style.setProperty('--border-radius', '0.75rem');
  } else {
    root.style.setProperty('--card-padding', '1.75rem');
    root.style.setProperty('--card-gap', '1.5rem');
    root.style.setProperty('--border-radius', '1.25rem');
  }
  
  // 4. Table Density
  if (settings.tableDensity === 'compact') {
    root.style.setProperty('--table-cell-py', '0.25rem');
    root.style.setProperty('--table-cell-px', '0.5rem');
    root.style.setProperty('--table-row-height', '2rem');
    root.style.setProperty('--table-font-size', '11px');
  } else if (settings.tableDensity === 'comfortable') {
    root.style.setProperty('--table-cell-py', '0.625rem');
    root.style.setProperty('--table-cell-px', '1rem');
    root.style.setProperty('--table-row-height', '3rem');
    root.style.setProperty('--table-font-size', '13px');
  } else {
    root.style.setProperty('--table-cell-py', '1.125rem');
    root.style.setProperty('--table-cell-px', '1.5rem');
    root.style.setProperty('--table-row-height', '4rem');
    root.style.setProperty('--table-font-size', '15px');
  }
  
  // 5. Button Size
  if (settings.buttonSize === 'small') {
    root.style.setProperty('--button-height', '2rem');
    root.style.setProperty('--button-font-size', '11px');
  } else if (settings.buttonSize === 'medium') {
    root.style.setProperty('--button-height', '2.5rem');
    root.style.setProperty('--button-font-size', '13px');
  } else {
    root.style.setProperty('--button-height', '3rem');
    root.style.setProperty('--button-font-size', '15px');
  }
  
  // 6. Input Size
  if (settings.inputSize === 'small') {
    root.style.setProperty('--input-height', '2rem');
    root.style.setProperty('--input-font-size', '11px');
  } else if (settings.inputSize === 'medium') {
    root.style.setProperty('--input-height', '2.5rem');
    root.style.setProperty('--input-font-size', '13px');
  } else {
    root.style.setProperty('--input-height', '3rem');
    root.style.setProperty('--input-font-size', '15px');
  }
  
  // 7. Sidebar Width
  if (settings.sidebarWidth === 'compact') {
    root.style.setProperty('--sidebar-width-base', '3rem');
    root.style.setProperty('--sidebar-width-expanded', '11rem');
  } else {
    root.style.setProperty('--sidebar-width-base', '4rem');
    root.style.setProperty('--sidebar-width-expanded', '16rem');
  }
};

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    try {
      const saved = localStorage.getItem('appearance-display-settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved appearance settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Apply settings to the DOM on mount and whenever settings change
  useEffect(() => {
    applyAppearanceToDOM(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('appearance-display-settings', JSON.stringify(next));
      return next;
    });
  };

  const resetAppearance = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('appearance-display-settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSetting, resetAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearanceContext = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearanceContext must be used within an AppearanceProvider');
  }
  return context;
};
