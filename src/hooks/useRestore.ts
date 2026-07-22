import { useState, useCallback } from 'react';
import { db, syncState } from '../database/db';
import { syncService, SYNCABLE_TABLES, type SyncableTable } from '../services/syncService';
import { useConnection } from './useConnection';
import showToast from '../utils/toast';

export interface ConflictRecord {
  table: string;
  recordId: number | string;
  local: any;
  cloud: any;
}

export function useRestore() {
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<number>(0);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const { verifyApiConnection } = useConnection();

  /**
   * Performs comparison between local and cloud records to isolate conflicts.
   */
  const checkConflicts = async (cloudData: Record<string, any[]>): Promise<ConflictRecord[]> => {
    const list: ConflictRecord[] = [];
    
    for (const [table, cloudRecords] of Object.entries(cloudData)) {
      if (!SYNCABLE_TABLES.includes(table as any)) continue;
      
      for (const cloudRec of cloudRecords) {
        if (!cloudRec.id) continue;
        
        const localRec = await (db as any)[table].get(cloudRec.id);
        if (localRec) {
          // If the record exists both locally and in cloud, compare their timestamps or properties
          const localUpdated = localRec.updatedAt ? new Date(localRec.updatedAt).getTime() : 0;
          const cloudUpdated = cloudRec.updatedAt ? new Date(cloudRec.updatedAt).getTime() : 0;
          
          // If they differ and sync status is not identical, count as a conflict
          if (localUpdated !== cloudUpdated && localRec.syncStatus !== 'Synced') {
            list.push({
              table,
              recordId: cloudRec.id,
              local: localRec,
              cloud: cloudRec
            });
          }
        }
      }
    }
    
    return list;
  };

  /**
   * Restores selected modules (tables) from Google Sheets backup.
   */
  const triggerModuleRestore = useCallback(async (
    tables: string[],
    policy: 'local' | 'cloud' | 'manual' = 'manual'
  ): Promise<{ success: boolean; conflictsFound: number }> => {
    if (isRestoring) return { success: false, conflictsFound: 0 };

    const online = await verifyApiConnection();
    if (!online) {
      showToast.error('Restore failed: Network connection is unavailable.');
      return { success: false, conflictsFound: 0 };
    }

    const config = await syncService.getConfiguration();
    if (!config.url) {
      showToast.error('Configuration Error: Apps Script Sync URL is not defined.');
      return { success: false, conflictsFound: 0 };
    }

    setIsRestoring(true);
    setRestoreProgress(10);

    try {
      // Download all records for selected tables from Google Sheets
      const cloudData = await syncService.downloadAll(config.url, config.secret, tables);
      setRestoreProgress(50);

      // Analyze conflicts
      const detectedConflicts = await checkConflicts(cloudData);
      
      if (detectedConflicts.length > 0 && policy === 'manual') {
        setConflicts(detectedConflicts);
        setRestoreProgress(100);
        setIsRestoring(false);
        showToast.warning(`Downloaded records. Found ${detectedConflicts.length} data conflicts that require manual resolution.`);
        return { success: true, conflictsFound: detectedConflicts.length };
      }

      // If policy is 'local' or 'cloud', apply automatically
      syncState.inProgress = true;
      try {
        await db.transaction('rw', tables as any, async () => {
          for (const table of tables) {
            const cloudRecords = cloudData[table] || [];
            for (const cloudRec of cloudRecords) {
              const localRec = await (db as any)[table].get(cloudRec.id);
              
              // Re-inflate dates
              const sanitizedRec = { ...cloudRec };
              Object.keys(sanitizedRec).forEach(key => {
                if (typeof sanitizedRec[key] === 'string' && sanitizedRec[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                  const dateVal = new Date(sanitizedRec[key]);
                  if (!isNaN(dateVal.getTime())) {
                    sanitizedRec[key] = dateVal;
                  }
                }
              });

              if (localRec) {
                if (policy === 'cloud') {
                  // Cloud overwrites local
                  await (db as any)[table].put(sanitizedRec);
                }
                // If 'local', do nothing, preserve local
              } else {
                // Not present locally, safe to download/insert
                await (db as any)[table].put(sanitizedRec);
              }
            }
          }
        });
      } finally {
        syncState.inProgress = false;
      }

      setRestoreProgress(100);
      showToast.success(`Restore operation successfully completed! Selected modules are synchronized.`);
      return { success: true, conflictsFound: 0 };
    } catch (err: any) {
      console.error('Module restore error:', err);
      showToast.error(`Restore failed: ${err.message || err}`);
      return { success: false, conflictsFound: 0 };
    } finally {
      setIsRestoring(false);
      setTimeout(() => setRestoreProgress(0), 1000);
    }
  }, [isRestoring, verifyApiConnection]);

  /**
   * Resolves a single manual conflict selection
   */
  const resolveConflict = useCallback(async (
    conflict: ConflictRecord,
    choice: 'local' | 'cloud' | 'merge'
  ) => {
    try {
      const table = conflict.table;
      const recordId = conflict.recordId;
      
      if (choice === 'cloud') {
        // Overwrite local record with cloud record
        const cloudRecord = { ...conflict.cloud };
        // Clean dates
        Object.keys(cloudRecord).forEach(key => {
          if (typeof cloudRecord[key] === 'string' && cloudRecord[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            cloudRecord[key] = new Date(cloudRecord[key]);
          }
        });
        cloudRecord.syncStatus = 'Synced';
        cloudRecord.lastSyncedAt = new Date();
        
        syncState.inProgress = true;
        try {
          await (db as any)[table].put(cloudRecord);
        } finally {
          syncState.inProgress = false;
        }
        showToast.success(`Replaced local record with Cloud data for ${table}:${recordId}`);
      } else if (choice === 'local') {
        // Keep local, but queue it to overwrite the cloud on the next sync
        await (db as any)[table].update(recordId, {
          syncStatus: 'Pending',
          updatedAt: new Date()
        });
        
        // Add to sync queue
        await db.syncQueue.add({
          table,
          recordId,
          action: 'UPDATE',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showToast.success(`Kept local record and queued for cloud update for ${table}:${recordId}`);
      } else if (choice === 'merge') {
        // Perform standard property merge (Local overrides cloud empty/null keys)
        const mergedRecord = { ...conflict.cloud, ...conflict.local };
        mergedRecord.syncStatus = 'Pending';
        mergedRecord.updatedAt = new Date();
        mergedRecord.lastSyncedAt = new Date();
        
        await (db as any)[table].put(mergedRecord);
        
        // Add to sync queue
        await db.syncQueue.add({
          table,
          recordId,
          action: 'UPDATE',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        showToast.success(`Merged local and cloud records and queued for sync for ${table}:${recordId}`);
      }

      // Remove from active conflicts list
      setConflicts(prev => prev.filter(c => !(c.table === table && c.recordId === recordId)));
    } catch (err: any) {
      showToast.error(`Conflict resolution failed: ${err.message || err}`);
    }
  }, []);

  /**
   * Imports JSON backup string offline
   */
  const importJSON = useCallback(async (jsonString: string, policy: 'overwrite' | 'merge') => {
    try {
      syncState.inProgress = true;
      const res = await syncService.importDatabaseFromJSON(jsonString, policy);
      if (res.success) {
        showToast.success(`Offline backup imported! Loaded ${res.count} records safely into IndexedDB.`);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast.error(`Offline import failed: ${err.message || err}`);
      return false;
    } finally {
      syncState.inProgress = false;
    }
  }, []);

  /**
   * Imports CSV tables offline
   */
  const importCSV = useCallback(async (table: string, csvText: string, policy: 'overwrite' | 'merge') => {
    try {
      const records = syncService.parseCSVToRecords(csvText);
      if (records.length === 0) {
        showToast.warning('CSV file is empty or invalid.');
        return false;
      }

      syncState.inProgress = true;
      try {
        await db.transaction('rw', table as any, async () => {
          if (policy === 'overwrite') {
            await (db as any)[table].clear();
          }

          for (const record of records) {
            if (!record.id) continue;
            
            // Re-inflate standard dates
            if (record.createdAt) record.createdAt = new Date(record.createdAt);
            if (record.updatedAt) record.updatedAt = new Date(record.updatedAt);
            if (record.saleDate) record.saleDate = new Date(record.saleDate);
            if (record.purchaseDate) record.purchaseDate = new Date(record.purchaseDate);
            
            await (db as any)[table].put(record);
          }
        });
      } finally {
        syncState.inProgress = false;
      }

      showToast.success(`Successfully imported CSV! Loaded ${records.length} records into ${table}.`);
      return true;
    } catch (err: any) {
      showToast.error(`CSV Import failed: ${err.message || err}`);
      return false;
    }
  }, []);

  return {
    isRestoring,
    restoreProgress,
    conflicts,
    triggerModuleRestore,
    resolveConflict,
    importJSON,
    importCSV
  };
}

export default useRestore;
