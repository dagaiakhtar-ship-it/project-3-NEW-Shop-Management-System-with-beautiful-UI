import React, { createContext, useContext, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

interface ThemeContextType {
  theme: 'light' | 'dark';
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider Component
 * Synchronizes HTML document classes with dark-mode state.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, toggleThemeMode } = useAppStore();
  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ theme: themeMode, isDark, toggleTheme: toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
