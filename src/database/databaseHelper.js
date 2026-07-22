import db from './db';

/**
 * Database Helper Methods
 * Includes utilities to open, close, clear tables, and perform health checks.
 */

/**
 * Ensures the database is open and connected.
 * @returns {Promise<Dexie>} The opened database instance.
 */
export async function openDatabase() {
  try {
    if (!db.isOpen()) {
      await db.open();
    }
    return db;
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    throw error;
  }
}

/**
 * Closes the database connection.
 * @returns {Promise<void>}
 */
export async function closeDatabase() {
  try {
    if (db.isOpen()) {
      await db.close();
    }
  } catch (error) {
    console.error('Failed to close IndexedDB:', error);
    throw error;
  }
}

/**
 * Clears all data from all tables in the database (useful for testing or reset).
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  try {
    await openDatabase();
    
    // Clear each table in a transaction
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
      }
    });
    
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Performs a health check on the IndexedDB database by verifying connection and readability.
 * @returns {Promise<{ ok: boolean; message: string; tables: string[]; error?: string }>}
 */
export async function checkDatabaseHealth() {
  try {
    await openDatabase();
    
    // Run a dummy write/read test on 'settings'
    const testKey = '__health_check__';
    await db.settings.put({ key: testKey, value: Date.now() });
    await db.settings.delete(testKey);
    
    const tableNames = db.tables.map(t => t.name);
    
    return {
      ok: true,
      message: 'IndexedDB (Dexie) is healthy and responsive.',
      tables: tableNames,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      ok: false,
      message: 'IndexedDB health check failed.',
      tables: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
