import { useState, useCallback } from 'react';

/**
 * useLoading Custom Hook
 * Provides an elegant, reusable state manager for async operations,
 * wrapping them with automated try/catch loading updates.
 */
export function useLoading(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState<boolean>(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const wrapAsync = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await asyncFn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    wrapAsync,
  };
}

export default useLoading;
