import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Reusable Custom Theme Hook
 * Synchronizes the app's dark-mode state from our unified Zustand store,
 * offering simple dark/light state flags and togglers.
 */
export function useTheme() {
  const { themeMode, setThemeMode, toggleThemeMode } = useAppStore();

  // On mount, apply the current active theme class to document root
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const isDark = themeMode === 'dark';

  return {
    theme: themeMode,
    isDark,
    setTheme: setThemeMode,
    toggleTheme: toggleThemeMode,
  };
}

export default useTheme;
