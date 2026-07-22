import { toast } from 'react-hot-toast';
import React from 'react';

/**
 * Reusable Custom Notification / Toast Hook
 * Enhances the base react-hot-toast library with specific custom indicators
 * for Success, Error, Warning, Info, and Promise tracking.
 */
export function useToast() {
  const showSuccess = (message) => {
    toast.success(message, {
      id: message,
      style: {
        border: '1px solid #10b981',
        padding: '12px 16px',
        color: '#065f46',
        background: '#ecfdf5',
        fontWeight: '550',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    });
  };

  const showError = (message) => {
    toast.error(message, {
      id: message,
      style: {
        border: '1px solid #ef4444',
        padding: '12px 16px',
        color: '#991b1b',
        background: '#fef2f2',
        fontWeight: '550',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  };

  const showWarning = (message) => {
    toast(message, {
      id: message,
      icon: '⚠️',
      style: {
        border: '1px solid #f59e0b',
        padding: '12px 16px',
        color: '#92400e',
        background: '#fffbeb',
        fontWeight: '550',
      },
    });
  };

  const showInfo = (message) => {
    toast(message, {
      id: message,
      icon: 'ℹ️',
      style: {
        border: '1px solid #3b82f6',
        padding: '12px 16px',
        color: '#1e3a8a',
        background: '#eff6ff',
        fontWeight: '550',
      },
    });
  };

  const showLoading = (message = 'Processing operation...') => {
    return toast.loading(message, {
      style: {
        border: '1px solid #6366f1',
        padding: '12px 16px',
        color: '#312e81',
        background: '#f5f3ff',
        fontWeight: '550',
      },
    });
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  /**
   * Promise Toast Handler
   * Feeds a promise into the UI toaster to handle automatic loading/success/error updates.
   */
  const showPromise = (promise, messages = { loading: 'Saving...', success: 'Success!', error: 'Error!' }) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          minWidth: '250px',
          fontWeight: '550',
        },
        success: {
          style: {
            border: '1px solid #10b981',
            background: '#ecfdf5',
            color: '#065f46',
          },
        },
        error: {
          style: {
            border: '1px solid #ef4444',
            background: '#fef2f2',
            color: '#991b1b',
          },
        },
      }
    );
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    promise: showPromise,
    dismiss,
  };
}

export default useToast;
