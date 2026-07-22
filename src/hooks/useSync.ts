import { useState, useCallback, useEffect } from 'react';
import { db } from '../database/db';
import { syncService, SYNCABLE_TABLES, type SyncConfiguration } from '../services/syncService';
import { useConnection } from './useConnection';
import { useSyncQueue } from './useSyncQueue';
import showToast from '../utils/toast';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('last_sync_time');
    return saved ? new Date(saved) : null;
  });

  const { isOnline, verifyApiConnection } = useConnection();
  const { queue, fetchQueue, isQueuePaused } = useSyncQueue();

  // Helper to update sync state of a record in IndexedDB
  const updateRecordSyncState = async (table: string, id: any, syncStatus: 'Synced' | 'Failed' | 'Conflict', error?: string) => {
    try {
      const record = await (db as any)[table].get(id);
      if (record) {
        await (db as any)[table].update(id, {
          syncStatus,
          lastSyncedAt: syncStatus === 'Synced' ? new Date() : record.lastSyncedAt,
          syncVersion: syncStatus === 'Synced' ? (record.syncVersion || 0) + 1 : record.syncVersion,
          syncError: error
        });
      }
    } catch (err) {
      console.error(`Failed to update sync state for ${table}:${id}`, err);
    }
  };

  /**
   * Incremental Synchronization: Uploads all 'Pending' records in the queue.
   */
  const triggerIncrementalSync = useCallback(async (silent = false): Promise<boolean> => {
    if (isSyncing) return false;
    if (isQueuePaused) {
      if (!silent) showToast.info('Sync Queue is currently paused.');
      return false;
    }

    const online = await verifyApiConnection();
    if (!online) {
      if (!silent) showToast.error('Cannot synchronize: Offline mode or Google Sheets is unreachable.');
      return false;
    }

    const config = await syncService.getConfiguration();
    if (!config.url) {
      if (!silent) showToast.error('Sync URL not configured. Please visit Cloud Sync Settings.');
      return false;
    }

    // Fetch pending items
    const pendingItems = await db.syncQueue
      .where('status')
      .equals('Pending')
      .toArray();

    if (pendingItems.length === 0) {
      if (!silent) showToast.info('All offline changes are already fully synced.');
      return true;
    }

    setIsSyncing(true);
    setSyncProgress(10);

    try {
      // Group records by table to batch them together
      const batchMap: Record<string, { queueIds: number[]; records: any[] }> = {};
      
      setSyncProgress(25);

      for (const item of pendingItems) {
        const table = item.table;
        const recordId = item.recordId;
        
        // Fetch original record from its database table
        let record = await (db as any)[table].get(recordId);
        
        if (!record) {
          // If record no longer exists locally, check if we have serialized fallback in queue or skip
          if (item.recordData) {
            try {
              record = JSON.parse(item.recordData);
            } catch (e) {
              // skip if invalid
            }
          }
        }

        if (record) {
          // Standardize dates to ISO strings for JSON transmission
          const cleanedRecord = { ...record };
          Object.keys(cleanedRecord).forEach(key => {
            if (cleanedRecord[key] instanceof Date) {
              cleanedRecord[key] = cleanedRecord[key].toISOString();
            }
          });

          // Ensure sync metadata fields are populated on payload
          cleanedRecord.syncStatus = 'Synced';
          cleanedRecord.lastSyncedAt = new Date().toISOString();
          cleanedRecord.syncVersion = (record.syncVersion || 0) + 1;

          if (!batchMap[table]) {
            batchMap[table] = { queueIds: [], records: [] };
          }
          batchMap[table].queueIds.push(item.id!);
          batchMap[table].records.push(cleanedRecord);
        } else {
          // If record is totally missing and not serializable, mark as synced in queue to prevent getting stuck
          await db.syncQueue.update(item.id!, { status: 'Synced', updatedAt: new Date() });
        }
      }

      setSyncProgress(50);

      const payload = Object.entries(batchMap).map(([table, data]) => ({
        table,
        records: data.records
      }));

      if (payload.length > 0) {
        // Post payload to Google Apps Script Web App
        const results = await syncService.uploadBatch(config.url, config.secret, payload);
        
        setSyncProgress(80);

        // Update queue item statuses and IndexedDB sync fields based on API result
        for (const [table, data] of Object.entries(batchMap)) {
          // Update queue items
          for (const qId of data.queueIds) {
            await db.syncQueue.update(qId, {
              status: 'Synced',
              error: undefined,
              updatedAt: new Date()
            });
          }

          // Update local DB items sync status
          for (const rec of data.records) {
            await updateRecordSyncState(table, rec.id, 'Synced');
          }
        }
      }

      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now.toISOString());
      setSyncProgress(100);
      
      if (!silent) showToast.success(`Successfully synchronized ${pendingItems.length} records to Google Sheets!`);
      await fetchQueue();
      return true;
    } catch (err: any) {
      console.error('Incremental sync error:', err);
      
      // Update pending queue items to failed
      for (const item of pendingItems) {
        await db.syncQueue.update(item.id!, {
          status: 'Failed',
          error: err.message || err.toString(),
          updatedAt: new Date()
        });
        await updateRecordSyncState(item.table, item.recordId, 'Failed', err.message || err.toString());
      }
      
      if (!silent) showToast.error(`Sync failed: ${err.message || err}`);
      await fetchQueue();
      return false;
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  }, [isSyncing, isQueuePaused, verifyApiConnection, fetchQueue]);

  /**
   * Automatic Sync setup: Trigger on restored network or settings interval
   */
  useEffect(() => {
    let intervalId: any = null;

    const runAutoSync = async () => {
      const config = await syncService.getConfiguration();
      if (config.autoSync && navigator.onLine) {
        triggerIncrementalSync(true);
      }
    };

    // Run when connection is restored
    const handleOnline = () => {
      runAutoSync();
    };

    window.addEventListener('online', handleOnline);

    // Run periodically based on config interval
    const setupInterval = async () => {
      const config = await syncService.getConfiguration();
      if (config.autoSync && config.interval > 0) {
        intervalId = setInterval(() => {
          runAutoSync();
        }, config.interval * 60 * 1000);
      }
    };

    setupInterval();

    return () => {
      window.removeEventListener('online', handleOnline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [triggerIncrementalSync]);

  return {
    isSyncing,
    syncProgress,
    lastSyncTime,
    triggerIncrementalSync
  };
}

export default useSync;
