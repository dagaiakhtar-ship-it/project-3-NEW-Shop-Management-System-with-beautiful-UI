import React, { createContext, useContext, useState } from 'react';
import Loader from '../components/ui/Loader';

interface LoadingContextType {
  setGlobalLoading: (isLoading: boolean, text?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * LoadingProvider Component
 * Exposes hooks to trigger global blocking loader overlays.
 */
export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const setGlobalLoading = (isLoading: boolean, text = 'Loading...') => {
    setLoadingText(text);
    setLoading(isLoading);
  };

  return (
    <LoadingContext.Provider value={{ setGlobalLoading }}>
      {loading && <Loader fullscreen size="lg" className="border-t-indigo-600" />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingProvider;
