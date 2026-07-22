import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, onDatabaseChange } from '../database/db';
import useAppStore from '../store/useAppStore';
import { applyThemeToDOM } from '../utils/settingsHelpers';
import { syncService } from '../services/syncService';
import { validateFullDatabaseIntegrity } from '../services/validationService';

interface DatabaseContextType {
  db: typeof db;
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

/**
 * DatabaseProvider Component
 * Ensures the Dexie IndexedDB instances are active and ready before allowing transactions.
 */
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    db.open()
      .then(async () => {
        // Automatically load and sync master JSON database from Express server on startup
        try {
          const loadRes = await fetch('/api/db/load');
          if (loadRes.ok) {
            const resJson = await loadRes.json();
            if (resJson.status === 'success' && resJson.database) {
              const dbStr = JSON.stringify(resJson.database);
              await syncService.importDatabaseFromJSON(dbStr, 'merge');
            }
          }
        } catch (loadErr) {
          console.error('Failed to auto-load master JSON database from server on startup:', loadErr);
        }

        // Run full database referential integrity scan on startup to inspect any existing records
        try {
          const scanResult = await validateFullDatabaseIntegrity(db);
          if (!scanResult.valid) {
            console.warn('[Database Integrity Scan] Detected existing database referential integrity violations:', scanResult.violations);
          } else {
            console.log('[Database Integrity Scan] Clean database reference verification passed!');
          }
        } catch (scanErr) {
          console.error('[Database Integrity Scan] Failed to perform startup verification scan:', scanErr);
        }

        // Load stored theme configuration on application mount
        try {
          const themeSetting = await db.settings.get('theme');
          const themeValue = themeSetting ? themeSetting.value : 'light';
          
          let resolved: 'light' | 'dark' = 'light';
          if (themeValue === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          } else {
            resolved = themeValue;
          }
          
          // Apply to our unified app store and DOM class lists
          useAppStore.getState().setThemeMode(resolved);
          applyThemeToDOM(themeValue);
        } catch (err) {
          console.error('Failed to load theme configuration from IndexedDB:', err);
        }
        
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to open database:', err);
        setError(err);
        setIsReady(true); // Proceed to let error state display
      });
  }, []);

  // Continuous Automatic Persistence & Debounced Sync Monitor
  useEffect(() => {
    if (!isReady) return;

    let syncTimeoutId: any = null;
    let isSyncing = false;
    let pendingSyncRun = false;

    const triggerSyncNow = async () => {
      if (isSyncing) {
        pendingSyncRun = true;
        return;
      }
      isSyncing = true;
      try {
        const pendingCount = await db.syncQueue.where('status').equals('Pending').count();
        if (pendingCount > 0) {
          await syncService.syncWithLocalServer();
        }
      } catch (err) {
        console.error('Failed to run automatic local server sync:', err);
      } finally {
        isSyncing = false;
        if (pendingSyncRun) {
          pendingSyncRun = false;
          setTimeout(triggerSyncNow, 100);
        }
      }
    };

    let debounceTimeoutId: any = null;
    const debouncedTrigger = () => {
      if (debounceTimeoutId) clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => {
        triggerSyncNow();
      }, 100); // 100ms debounce to group rapid consecutive state updates
    };

    // Register immediate change hook listener
    const unsubscribe = onDatabaseChange(() => {
      debouncedTrigger();
    });

    const checkAndSyncLoop = async () => {
      await triggerSyncNow();
      // Periodically check in background every 2 seconds for offline-to-online recovery or leftover cues
      syncTimeoutId = setTimeout(checkAndSyncLoop, 2000);
    };

    // Start background sync loop
    syncTimeoutId = setTimeout(checkAndSyncLoop, 2000);

    return () => {
      if (syncTimeoutId) clearTimeout(syncTimeoutId);
      if (debounceTimeoutId) clearTimeout(debounceTimeoutId);
      unsubscribe();
    };
  }, [isReady]);

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

export default DatabaseProvider;
