import React from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider Component
 * Exposes the react-hot-toast stack, styling popups for clean UI alerts.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          },
        }}
      />
      {children}
    </>
  );
};

export default ToastProvider;
