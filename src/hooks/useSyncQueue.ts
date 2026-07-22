import { useState, useEffect, useCallback } from 'react';
import { db, type SyncQueueItem } from '../database/db';

export function useSyncQueue() {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [isQueuePaused, setIsQueuePaused] = useState<boolean>(() => {
    return localStorage.getItem('sync_queue_paused') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch queue items
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await db.syncQueue.orderBy('createdAt').reverse().toArray();
      setQueue(items);
    } catch (e) {
      console.error('Failed to fetch sync queue:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Toggle pause/resume
  const toggleQueuePause = useCallback(() => {
    setIsQueuePaused(prev => {
      const newState = !prev;
      localStorage.setItem('sync_queue_paused', String(newState));
      return newState;
    });
  }, []);

  // Add an item to the queue
  const queueRecord = useCallback(async (
    table: string,
    recordId: number | string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    recordData?: any
  ): Promise<number | undefined> => {
    try {
      // Check if item already exists in queue as Pending to prevent duplications
      const existing = await db.syncQueue
        .where({ table, recordId })
        .and(item => item.status === 'Pending')
        .first();

      if (existing) {
        // Update its action and timestamp instead of creating a duplicate
        await db.syncQueue.update(existing.id!, {
          action,
          recordData: recordData ? JSON.stringify(recordData) : undefined,
          updatedAt: new Date()
        });
        await fetchQueue();
        return existing.id;
      }

      const id = await db.syncQueue.add({
        table,
        recordId,
        action,
        status: 'Pending',
        recordData: recordData ? JSON.stringify(recordData) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await fetchQueue();
      return id;
    } catch (e) {
      console.error('Failed to queue record:', e);
      return undefined;
    }
  }, [fetchQueue]);

  // Retry sync of a specific queue record
  const retryQueueItem = useCallback(async (id: number) => {
    try {
      await db.syncQueue.update(id, {
        status: 'Pending',
        error: undefined,
        updatedAt: new Date()
      });
      await fetchQueue();
    } catch (e) {
      console.error('Failed to update queue item for retry:', e);
    }
  }, [fetchQueue]);

  // Remove item from queue
  const cancelQueueItem = useCallback(async (id: number) => {
    try {
      await db.syncQueue.delete(id);
      await fetchQueue();
    } catch (e) {
      console.error('Failed to cancel queue item:', e);
    }
  }, [fetchQueue]);

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    try {
      await db.syncQueue.clear();
      await fetchQueue();
    } catch (e) {
      console.error('Failed to clear sync queue:', e);
    }
  }, [fetchQueue]);

  return {
    queue,
    isQueuePaused,
    isLoading,
    fetchQueue,
    toggleQueuePause,
    queueRecord,
    retryQueueItem,
    cancelQueueItem,
    clearQueue
  };
}

export default useSyncQueue;
