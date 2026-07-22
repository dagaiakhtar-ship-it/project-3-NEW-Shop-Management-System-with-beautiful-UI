import { useState, useCallback } from 'react';
import { db } from '../database/db';
import { syncService, SYNCABLE_TABLES } from '../services/syncService';
import { jsonBackupService } from '../services/jsonBackupService';
import { useConnection } from './useConnection';
import showToast from '../utils/toast';

export function useBackup() {
  const [isBackupInProgress, setIsBackupInProgress] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<number>(0);
  const { verifyApiConnection } = useConnection();

  /**
   * Pushes a full database snapshot of all tables to Google Sheets.
   * This is a "Full Backup" operation.
   */
  const triggerFullCloudBackup = useCallback(async (): Promise<boolean> => {
    if (isBackupInProgress) return false;

    const online = await verifyApiConnection();
    if (!online) {
      showToast.error('Full backup failed: Internet connection is unavailable.');
      return false;
    }

    const config = await syncService.getConfiguration();
    if (!config.url) {
      showToast.error('Configuration Error: Cloud Sync URL is not configured.');
      return false;
    }

    setIsBackupInProgress(true);
    setBackupProgress(10);
    const startTime = performance.now();

    try {
      const payload: { table: string; records: any[] }[] = [];
      let totalRecordsCount = 0;
      const detailsMap: Record<string, number> = {};

      setBackupProgress(30);

      // Extract all tables contents
      for (const table of SYNCABLE_TABLES) {
        const records = await (db as any)[table].toArray();
        if (records.length > 0) {
          // Standardize date attributes
          const cleanedRecords = records.map((rec: any) => {
            const cleaned = { ...rec };
            Object.keys(cleaned).forEach(key => {
              if (cleaned[key] instanceof Date) {
                cleaned[key] = cleaned[key].toISOString();
              }
            });
            cleaned.syncStatus = 'Synced';
            cleaned.lastSyncedAt = new Date().toISOString();
            return cleaned;
          });

          payload.push({
            table,
            records: cleanedRecords
          });
          totalRecordsCount += cleanedRecords.length;
          detailsMap[table] = cleanedRecords.length;
        } else {
          detailsMap[table] = 0;
        }
      }

      setBackupProgress(60);

      if (payload.length === 0) {
        showToast.info('Database is completely empty. Nothing to backup.');
        setIsBackupInProgress(false);
        setBackupProgress(0);
        return true;
      }

      // Execute App Script POST batch upload
      await syncService.uploadBatch(config.url, config.secret, payload);
      setBackupProgress(90);

      // Set all local records to Synced state
      for (const table of SYNCABLE_TABLES) {
        await (db as any)[table].where('id').above(0).modify({
          syncStatus: 'Synced',
          lastSyncedAt: new Date()
        });
      }

      const durationMs = Math.round(performance.now() - startTime);

      // Save success logs to backupHistory table
      await db.backupHistory.add({
        backupDate: new Date(),
        recordsCount: totalRecordsCount,
        durationMs,
        status: 'Success',
        type: 'Full',
        details: JSON.stringify(detailsMap)
      });

      setBackupProgress(100);
      showToast.success(`Full Cloud backup completed! Backed up ${totalRecordsCount} records successfully.`);
      return true;
    } catch (err: any) {
      console.error('Cloud backup error:', err);
      const durationMs = Math.round(performance.now() - startTime);

      // Save failed log to backupHistory
      await db.backupHistory.add({
        backupDate: new Date(),
        recordsCount: 0,
        durationMs,
        status: 'Failed',
        type: 'Full',
        error: err.message || err.toString()
      });

      showToast.error(`Cloud backup failed: ${err.message || err}`);
      return false;
    } finally {
      setIsBackupInProgress(false);
      setTimeout(() => setBackupProgress(0), 1000);
    }
  }, [isBackupInProgress, verifyApiConnection]);

  /**
   * Triggers local structured JSON export of all database tables.
   */
  const exportLocalJSON = useCallback(async () => {
    try {
      const jsonStr = await jsonBackupService.exportDatabaseToJSONString();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ShopCraft_Central_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast.success('Central JSON Database backup exported successfully!');
    } catch (err: any) {
      showToast.error(`Local JSON export failed: ${err.message || err}`);
    }
  }, []);

  /**
   * Import database from a structured JSON string in an atomic transaction.
   */
  const importLocalJSON = useCallback(async (jsonString: string, policy: 'overwrite' | 'merge' = 'merge') => {
    try {
      const result = await jsonBackupService.importDatabaseFromJSON(jsonString, policy);
      showToast.success(`JSON Backup imported successfully! ${result.recordCount} records processed.`);
      return result;
    } catch (err: any) {
      showToast.error(`JSON import failed: ${err.message || err}`);
      throw err;
    }
  }, []);

  /**
   * Export a single table's records as a CSV file.
   */
  const exportLocalCSV = useCallback(async (table: string) => {
    try {
      const records = await (db as any)[table].toArray();
      if (records.length === 0) {
        showToast.info(`The table "${table}" is empty. Nothing to export.`);
        return;
      }
      const csvStr = syncService.exportTableToCSV(records);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ShopCraft_Export_${table}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast.success(`Successfully exported ${table} table as CSV!`);
    } catch (err: any) {
      showToast.error(`CSV export failed: ${err.message || err}`);
    }
  }, []);

  /**
   * Export a single table's records as Excel-friendly CSV.
   */
  const exportLocalExcel = useCallback(async (table: string) => {
    try {
      const records = await (db as any)[table].toArray();
      if (records.length === 0) {
        showToast.info(`The table "${table}" is empty. Nothing to export.`);
        return;
      }
      const csvStr = syncService.exportTableToCSV(records);
      // UTF-8 BOM for Microsoft Excel compatibility
      const blob = new Blob(['\ufeff', csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ShopCraft_Excel_${table}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast.success(`Successfully exported ${table} as Excel-friendly file!`);
    } catch (err: any) {
      showToast.error(`Excel export failed: ${err.message || err}`);
    }
  }, []);

  return {
    isBackupInProgress,
    backupProgress,
    triggerFullCloudBackup,
    exportLocalJSON,
    importLocalJSON,
    exportLocalCSV,
    exportLocalExcel
  };
}

export default useBackup;
