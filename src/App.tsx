import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes/router';
import ToastProvider from './providers/ToastProvider';
import ThemeProvider from './providers/ThemeProvider';
import DatabaseProvider from './providers/DatabaseProvider';
import LoadingProvider from './providers/LoadingProvider';
import { PrintProvider } from './contexts/PrintContext';
import { AppearanceProvider } from './contexts/AppearanceContext';

/**
 * Main Application Component
 * Wraps the router within our core Global Provider stack.
 */
export default function App() {
  return (
    <DatabaseProvider>
      <AppearanceProvider>
        <ThemeProvider>
          <LoadingProvider>
            <ToastProvider>
              <PrintProvider>
                <RouterProvider router={router} />
              </PrintProvider>
            </ToastProvider>
          </LoadingProvider>
        </ThemeProvider>
      </AppearanceProvider>
    </DatabaseProvider>
  );
}
