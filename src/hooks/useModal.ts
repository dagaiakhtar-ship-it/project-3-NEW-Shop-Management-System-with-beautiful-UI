import { useState, useCallback } from 'react';

/**
 * useModal Custom Hook
 * Centralizes the state management for overlays, drawers, and modal sheets,
 * with optional type-safe metadata payloads.
 */
export function useModal<T = any>() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [payload, setPayload] = useState<T | null>(null);

  const open = useCallback((data: T | null = null) => {
    setPayload(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    payload,
    open,
    close,
    toggle,
    setPayload,
  };
}

export default useModal;
