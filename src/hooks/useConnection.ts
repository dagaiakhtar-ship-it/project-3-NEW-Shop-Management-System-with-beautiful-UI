import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';

export function useConnection() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setPingStatus('failed');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const verifyApiConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setPingStatus('failed');
      return false;
    }

    setPingStatus('checking');
    const start = performance.now();
    try {
      const config = await syncService.getConfiguration();
      if (!config.url) {
        setPingStatus('failed');
        return false;
      }

      const check = await syncService.verifyConnection(config.url, config.secret);
      const end = performance.now();
      
      if (check.success) {
        setIsOnline(true);
        setPingStatus('success');
        setLatencyMs(Math.round(end - start));
        return true;
      } else {
        setPingStatus('failed');
        setLatencyMs(null);
        return false;
      }
    } catch (e) {
      setPingStatus('failed');
      setLatencyMs(null);
      return false;
    }
  }, []);

  return {
    isOnline,
    pingStatus,
    latencyMs,
    verifyApiConnection
  };
}

export default useConnection;
