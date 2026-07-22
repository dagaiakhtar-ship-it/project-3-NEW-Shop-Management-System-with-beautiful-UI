import fs from 'fs';
import path from 'path';

// Define the root paths for data and backups
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

export interface DBRecord {
  id?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  syncVersion?: number;
  syncStatus?: 'Pending' | 'Synced' | 'Failed' | 'Conflict';
  isDeleted?: boolean;
  [key: string]: any;
}

export interface JSONDatabase {
  products: DBRecord[];
  categories: DBRecord[];
  customers: DBRecord[];
  suppliers: DBRecord[];
  sales: DBRecord[];
  saleItems: DBRecord[];
  purchases: DBRecord[];
  purchaseItems: DBRecord[];
  expenses: DBRecord[];
  expenseCategories: DBRecord[];
  creditAccounts: DBRecord[];
  creditPayments: DBRecord[];
  settings: DBRecord[];
  users: DBRecord[];
  stockHistory: DBRecord[];
  auditLogs: DBRecord[];
  syncQueue: DBRecord[];
  backupHistory: DBRecord[];
  [key: string]: DBRecord[];
}

// Collections that need validation and standard properties
const COLLECTIONS: (keyof JSONDatabase)[] = [
  'products', 'categories', 'customers', 'suppliers', 'sales', 'saleItems',
  'purchases', 'purchaseItems', 'expenses', 'expenseCategories', 'creditAccounts',
  'creditPayments', 'settings', 'users', 'stockHistory', 'auditLogs', 'syncQueue', 'backupHistory'
];

/**
 * A highly robust, lightweight in-memory async lock to prevent race conditions during file read/write.
 */
class AsyncLock {
  private promise: Promise<any> = Promise.resolve();

  acquire<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.promise.then(fn);
    this.promise = result.catch(() => {});
    return result;
  }
}

const fileLock = new AsyncLock();

export class StorageService {
  private memoryCache: JSONDatabase | null = null;
  private isWriting = false;
  private pendingWritePromise: Promise<void> | null = null;

  // Track transaction counts and changes since last backup to satisfy periodic and threshold triggers
  private transactionCountSinceBackup = 0;
  private hasChangesSinceLastBackup = false;
  private readonly TRANSACTION_THRESHOLD = 20; // significant number of transactions

  constructor() {
    this.ensureDirectories();
    this.startPeriodicBackupTimer();
  }

  /**
   * Starts a periodic timer that calls backupDatabase every minute if there are new changes.
   */
  private startPeriodicBackupTimer() {
    // 1-minute (60,000 ms) interval
    setInterval(async () => {
      try {
        if (this.hasChangesSinceLastBackup) {
          console.log('[StorageService] Periodic 1-minute auto-backup triggered (changes detected).');
          const db = await this.loadDatabase();
          await this.backupDatabase(db);
        } else {
          console.log('[StorageService] Periodic 1-minute auto-backup skipped (no new changes).');
        }
      } catch (err) {
        console.error('[StorageService] Error during periodic auto-backup:', err);
      }
    }, 60000);
  }

  /**
   * Increments the processed transaction count and triggers backup if the threshold is met.
   */
  private async handleTransactionsProcessed(count: number, db: JSONDatabase) {
    this.transactionCountSinceBackup += count;
    this.hasChangesSinceLastBackup = true;

    if (this.transactionCountSinceBackup >= this.TRANSACTION_THRESHOLD) {
      console.log(`[StorageService] Significant transaction volume processed (${this.transactionCountSinceBackup} >= ${this.TRANSACTION_THRESHOLD}). Triggering auto-backup.`);
      await this.backupDatabase(db);
    }
  }

  /**
   * Create database directories if they don't exist.
   */
  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    const exportsDir = path.join(DATA_DIR, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    const logsDir = path.join(DATA_DIR, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Validates the integrity of the database JSON structure.
   */
  public validateDatabase(db: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!db || typeof db !== 'object') {
      return { valid: false, errors: ['Database must be a valid JSON object'] };
    }

    // Verify all core collections exist and are arrays
    COLLECTIONS.forEach(col => {
      if (db[col] !== undefined && !Array.isArray(db[col])) {
        errors.push(`Collection "${col}" must be an array`);
      }
    });

    // Check key fields/types for standard entries if they exist
    if (Array.isArray(db.products)) {
      db.products.forEach((p: any, i: number) => {
        if (!p.sku || typeof p.sku !== 'string') {
          errors.push(`Product at index ${i} is missing a valid SKU`);
        }
      });
    }

    // Referential integrity check (soft warning or validation errors)
    if (Array.isArray(db.saleItems) && Array.isArray(db.sales)) {
      const saleIds = new Set(db.sales.map((s: any) => s.id));
      db.saleItems.forEach((item: any, i: number) => {
        if (item.saleId && !saleIds.has(item.saleId)) {
          errors.push(`SaleItem at index ${i} refers to non-existent sale ID: ${item.saleId}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Standardizes and initializes an empty database.
   */
  private getEmptyDatabase(): JSONDatabase {
    const db: any = {};
    COLLECTIONS.forEach(col => {
      db[col] = [];
    });
    return db as JSONDatabase;
  }

  /**
   * Loads the database from disk, using backup restore if corrupted.
   */
  public async loadDatabase(): Promise<JSONDatabase> {
    return fileLock.acquire(async () => {
      if (this.memoryCache) {
        return this.memoryCache;
      }

      this.ensureDirectories();

      if (!fs.existsSync(DB_FILE)) {
        const emptyDb = this.getEmptyDatabase();
        await this.saveDatabaseInternal(emptyDb);
        this.memoryCache = emptyDb;
        return emptyDb;
      }

      try {
        const raw = await fs.promises.readFile(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const validation = this.validateDatabase(parsed);

        if (!validation.valid) {
          throw new Error('Database validation failed: ' + validation.errors.join('; '));
        }

        // Fill in missing collections
        COLLECTIONS.forEach(col => {
          if (!parsed[col]) {
            parsed[col] = [];
          }
        });

        this.memoryCache = parsed;
        return parsed;
      } catch (err: any) {
        console.error('Database file is missing, corrupt or invalid. Attempting to restore from backup...', err);
        
        // Attempt backup recovery
        try {
          const recovered = await this.restoreLatestBackupInternal();
          if (recovered) {
            console.log('Successfully recovered database from backup!');
            this.memoryCache = recovered;
            return recovered;
          }
        } catch (backupErr) {
          console.error('Backup restoration failed as well:', backupErr);
        }

        // Fallback to fresh database to prevent app crashes
        const fallbackDb = this.getEmptyDatabase();
        await this.saveDatabaseInternal(fallbackDb);
        this.memoryCache = fallbackDb;
        return fallbackDb;
      }
    });
  }

  /**
   * Saves the database to disk atomically with temporary-write and swap.
   */
  public async saveDatabase(db: JSONDatabase): Promise<void> {
    const validation = this.validateDatabase(db);
    if (!validation.valid) {
      throw new Error('Cannot save database: ' + validation.errors.join('; '));
    }

    return fileLock.acquire(async () => {
      await this.saveDatabaseInternal(db);
      this.memoryCache = db;
      this.hasChangesSinceLastBackup = true;
      await this.handleTransactionsProcessed(1, db);
    });
  }

  /**
   * Internal non-locked atomic write implementation.
   */
  private async saveDatabaseInternal(db: JSONDatabase): Promise<void> {
    const tempFile = `${DB_FILE}.tmp`;
    const jsonStr = JSON.stringify(db, null, 2);
    
    // Atomic Write
    await fs.promises.writeFile(tempFile, jsonStr, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  }

  /**
   * Creates a timestamped backup of the database, keeping only the latest 10.
   */
  public async backupDatabase(db: JSONDatabase): Promise<string> {
    this.ensureDirectories();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUPS_DIR, `backup_${timestamp}.json`);
    
    const jsonStr = JSON.stringify(db, null, 2);
    await fs.promises.writeFile(backupFile, jsonStr, 'utf-8');

    // Reset periodic and threshold tracking flags upon successful backup creation
    this.transactionCountSinceBackup = 0;
    this.hasChangesSinceLastBackup = false;

    // Keep only latest 10 backups
    try {
      const files = await fs.promises.readdir(BACKUPS_DIR);
      const backupFiles = files
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(BACKUPS_DIR, f),
          time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // descending

      if (backupFiles.length > 10) {
        const toDelete = backupFiles.slice(10);
        for (const file of toDelete) {
          await fs.promises.unlink(file.path);
        }
      }
    } catch (e) {
      console.error('Error during pruning backups:', e);
    }

    return path.basename(backupFile);
  }

  /**
   * Restores the database from a specified backup file name.
   */
  public async restoreDatabase(backupFileName: string): Promise<JSONDatabase> {
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file "${backupFileName}" not found.`);
    }

    return fileLock.acquire(async () => {
      const raw = await fs.promises.readFile(backupFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const validation = this.validateDatabase(parsed);

      if (!validation.valid) {
        throw new Error('Backup file is corrupted: ' + validation.errors.join('; '));
      }

      await this.saveDatabaseInternal(parsed);
      this.memoryCache = parsed;
      return parsed;
    });
  }

  /**
   * Internal helper to restore from the latest valid backup.
   */
  private async restoreLatestBackupInternal(): Promise<JSONDatabase | null> {
    try {
      const files = await fs.promises.readdir(BACKUPS_DIR);
      const backupFiles = files
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(BACKUPS_DIR, f),
          time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // descending

      for (const backup of backupFiles) {
        try {
          const raw = await fs.promises.readFile(backup.path, 'utf-8');
          const parsed = JSON.parse(raw);
          const validation = this.validateDatabase(parsed);
          if (validation.valid) {
            await this.saveDatabaseInternal(parsed);
            return parsed;
          }
        } catch (e) {
          console.error(`Backup ${backup.name} is invalid/corrupt, trying next...`);
        }
      }
    } catch (e) {
      console.error('Failed to locate backups:', e);
    }
    return null;
  }

  /**
   * Retrieves list of all available backup files.
   */
  public async listBackups() {
    this.ensureDirectories();
    const files = await fs.promises.readdir(BACKUPS_DIR);
    return files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stat = fs.statSync(fullPath);
        return {
          fileName: f,
          createdAt: stat.mtime,
          size: stat.size
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Import complete database from JSON payload.
   */
  public async importDatabase(data: any): Promise<void> {
    const validation = this.validateDatabase(data);
    if (!validation.valid) {
      throw new Error('Invalid JSON import payload: ' + validation.errors.join('; '));
    }
    await this.saveDatabase(data);
  }

  /**
   * Export database as standard JSON representation.
   */
  public async exportDatabase(): Promise<JSONDatabase> {
    return this.loadDatabase();
  }

  /**
   * Sync a batch of updates from client.
   * Compares versions and updatedAt timestamps (Last Updated Wins).
   * Soft deletes are kept in `isDeleted` or `deleted` state.
   */
  public async syncDatabase(payload: { table: string; records: any[] }[]): Promise<{ results: Record<string, { inserted: number; updated: number; failed: number }> }> {
    const dbData = await this.loadDatabase();
    
    // Create an automatic timestamped backup of the master database before merging sync batch
    await this.backupDatabase(dbData);

    const results: Record<string, { inserted: number; updated: number; failed: number }> = {};
    let totalTransactions = 0;

    for (const batch of payload) {
      const { table, records } = batch;
      if (!COLLECTIONS.includes(table as keyof JSONDatabase)) {
        results[table] = { inserted: 0, updated: 0, failed: records.length };
        continue;
      }

      let inserted = 0;
      let updated = 0;
      let failed = 0;

      const serverCollection = dbData[table] || [];
      const serverRecordMap = new Map(serverCollection.map(r => [String(r.id), r]));

      for (const clientRec of records) {
        try {
          if (clientRec.id === undefined || clientRec.id === null) {
            failed++;
            continue;
          }

          const recordIdStr = String(clientRec.id);
          const serverRec = serverRecordMap.get(recordIdStr);

          // Prepare records for ingestion, format dates if necessary
          const preparedRec: DBRecord = { ...clientRec };
          
          preparedRec.updatedAt = preparedRec.updatedAt ? new Date(preparedRec.updatedAt).toISOString() : new Date().toISOString();
          preparedRec.createdAt = preparedRec.createdAt ? new Date(preparedRec.createdAt).toISOString() : new Date().toISOString();
          preparedRec.syncStatus = 'Synced';
          preparedRec.syncVersion = Number(preparedRec.syncVersion || preparedRec.version || 1);

          if (!serverRec) {
            // New record: Insert
            serverCollection.push(preparedRec);
            serverRecordMap.set(recordIdStr, preparedRec);
            inserted++;
          } else {
            // Existing record: Conflict resolution (Last Updated Wins by default)
            const serverUpdatedTime = new Date(serverRec.updatedAt || 0).getTime();
            const clientUpdatedTime = new Date(preparedRec.updatedAt || 0).getTime();

            const serverVersion = Number(serverRec.syncVersion || serverRec.version || 0);
            const clientVersion = preparedRec.syncVersion;

            // Update if client has a newer update time, or a higher version number
            if (clientUpdatedTime > serverUpdatedTime || clientVersion > serverVersion) {
              const idx = serverCollection.findIndex(r => String(r.id) === recordIdStr);
              if (idx !== -1) {
                serverCollection[idx] = {
                  ...serverRec,
                  ...preparedRec,
                  syncVersion: Math.max(serverVersion + 1, clientVersion)
                };
                serverRecordMap.set(recordIdStr, serverCollection[idx]);
                updated++;
              } else {
                failed++;
              }
            } else {
              // Server has the newer record. Keep server record (client will pull it on startup/load)
              // We do not treat this as failed; it's a resolved conflict
            }
          }
        } catch (e) {
          console.error(`Failed to sync record in table ${table}:`, clientRec, e);
          failed++;
        }
      }

      dbData[table] = serverCollection;
      results[table] = { inserted, updated, failed };
      totalTransactions += (inserted + updated);
    }

    // Save atomic changes to disk asynchronously/safely
    await this.saveDatabase(dbData);

    // Track total transactions processed and trigger backup if threshold is reached
    if (totalTransactions > 0) {
      await this.handleTransactionsProcessed(totalTransactions, dbData);
    }

    return { results };
  }
}

export const storageService = new StorageService();
