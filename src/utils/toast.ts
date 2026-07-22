import { toast } from 'react-hot-toast';

/**
 * Modern notification styling wrapping react-hot-toast.
 * Delivers custom border, micro-shadows, and typography pairings.
 */
export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #10b981',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    });
  },
  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #ef4444',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  },
  info: (message: string) => {
    toast(message, {
      icon: '💡',
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #0ea5e9',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    });
  },
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #f59e0b',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    });
  }
};
export default showToast;
