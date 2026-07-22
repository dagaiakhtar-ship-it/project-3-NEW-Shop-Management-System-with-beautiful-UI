/**
 * Shop Management System Theme Configurations
 * Exposes core styling tokens for both CSS usage and JS-based utilities (like Recharts)
 */
export const theme = {
  colors: {
    primary: {
      light: '#e0e7ff',   // indigo-100
      main: '#4f46e5',    // indigo-600
      dark: '#3730a3',    // indigo-800
    },
    secondary: {
      light: '#e0f2fe',  // sky-100
      main: '#0ea5e9',   // sky-500
      dark: '#0369a1',   // sky-700
    },
    success: {
      light: '#ecfdf5',  // emerald-50
      main: '#10b981',   // emerald-500
      dark: '#047857',   // emerald-700
    },
    warning: {
      light: '#fffbeb',  // amber-50
      main: '#f59e0b',   // amber-500
      dark: '#b45309',   // amber-700
    },
    danger: {
      light: '#fef2f2',   // red-50
      main: '#ef4444',    // red-500
      dark: '#b91c1c',    // red-700
    },
    gray: {
      50: '#f8fafc',     // slate-50 (app bg)
      100: '#f1f5f9',    // slate-100
      200: '#e2e8f0',    // slate-200 (border)
      300: '#cbd5e1',    // slate-300
      400: '#94a3b8',    // slate-400
      500: '#64748b',    // slate-500
      600: '#475569',    // slate-600 (text secondary)
      700: '#334155',    // slate-700
      800: '#1e293b',    // slate-800
      900: '#0f172a',    // slate-900 (text main)
    },
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  borderRadius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  }
};
