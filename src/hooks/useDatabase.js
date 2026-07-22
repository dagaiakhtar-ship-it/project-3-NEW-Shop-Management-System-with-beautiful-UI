import { useLiveQuery } from 'dexie-react-hooks';
import db from '../database/db';
import { checkDatabaseHealth, clearDatabase } from '../database/databaseHelper';
import { useState, useCallback } from 'react';

/**
 * Reusable Custom Database Hook
 * Provides high-level data operations, live state subscriptions,
 * health checks, and reset commands.
 */
export function useDatabase() {
  const [isDbBusy, setIsDbBusy] = useState(false);

  /**
   * Subscribes to changes in a Dexie table with optional filters
   * @param {string} tableName Name of the db table
   * @param {Function} [queryFn] Custom dexie query function (e.g. () => db.products.toArray())
   */
  const useTableQuery = (tableName, queryFn) => {
    return useLiveQuery(
      async () => {
        if (queryFn) {
          return await queryFn(db[tableName]);
        }
        return await db[tableName].toArray();
      },
      [tableName]
    );
  };

  /**
   * Helper to perform a safe write transaction
   */
  const executeWrite = useCallback(async (operationFn, successCallback, errorCallback) => {
    setIsDbBusy(true);
    try {
      const result = await operationFn();
      if (successCallback) successCallback(result);
      return result;
    } catch (error) {
      console.error('Database write error:', error);
      if (errorCallback) errorCallback(error);
      throw error;
    } finally {
      setIsDbBusy(false);
    }
  }, []);

  /**
   * Clears database contents
   */
  const resetDb = useCallback(async () => {
    setIsDbBusy(true);
    try {
      await clearDatabase();
    } finally {
      setIsDbBusy(false);
    }
  }, []);

  /**
   * Runs database diagnosis checks
   */
  const runHealthCheck = useCallback(async () => {
    setIsDbBusy(true);
    try {
      return await checkDatabaseHealth();
    } finally {
      setIsDbBusy(false);
    }
  }, []);

  return {
    db,
    isDbBusy,
    useTableQuery,
    executeWrite,
    resetDb,
    runHealthCheck,
  };
}

export default useDatabase;
