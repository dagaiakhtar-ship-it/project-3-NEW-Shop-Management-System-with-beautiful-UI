import { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../database/db';

export const useNotificationRunner = () => {
  const runSystemHealthChecks = async () => {
    try {
      const currentNotifications = useAppStore.getState().notifications;
      const addNotification = useAppStore.getState().addNotification;

      // 1. Check Low Stock Items
      const products = await db.products.toArray();
      const lowStockProducts = products.filter(
        (p) => (p.currentStock ?? 0) <= (p.minimumStock ?? 5) && p.status !== 'Inactive'
      );

      if (lowStockProducts.length > 0) {
        const title = 'Inventory Low Stock Trigger';
        const message = `${lowStockProducts.length} items are currently below minimum stock levels and need immediate reordering.`;
        
        // Prevent duplicate alerts in store
        const exists = currentNotifications.some((n) => n.title === title);
        if (!exists) {
          addNotification({
            title,
            message,
            type: 'warning',
          });
        }
      }

      // 2. Check Customer Credit Overdrafts
      const customers = await db.customers.toArray();
      const creditOverdrafts = customers.filter(
        (c) => (c.currentBalance ?? 0) > (c.creditLimit ?? 5000) && c.status === 'Active'
      );

      if (creditOverdrafts.length > 0) {
        const title = 'Credit Limit Threshold Alert';
        const message = `${creditOverdrafts.length} customer accounts have exceeded their configured credit limits. Verify credit holdings.`;
        
        const exists = currentNotifications.some((n) => n.title === title);
        if (!exists) {
          addNotification({
            title,
            message,
            type: 'error',
          });
        }
      }

      // 3. Check Failed Sync Queue Items
      const failedSyncs = await db.syncQueue.where('status').equals('Failed').toArray();
      if (failedSyncs.length > 0) {
        const title = 'Cloud Synchronization Failure';
        const message = `There are ${failedSyncs.length} transactions that failed to sync with Google Sheets backup. Try retrying in Settings.`;
        
        const exists = currentNotifications.some((n) => n.title === title);
        if (!exists) {
          addNotification({
            title,
            message,
            type: 'error',
          });
        }
      }

      // 4. Check Backup Scheduling Warnings
      const backups = await db.backupHistory.toArray();
      const hasRecentBackup = backups.some(
        (b) => b.status === 'Success' && Date.now() - new Date(b.backupDate).getTime() < 24 * 3600 * 1000
      );

      if (backups.length > 0 && !hasRecentBackup) {
        const title = 'Backup Out of Date Warning';
        const message = 'The last successful database backup was recorded over 24 hours ago. Please run a manual backup to avoid data loss.';
        
        const exists = currentNotifications.some((n) => n.title === title);
        if (!exists) {
          addNotification({
            title,
            message,
            type: 'warning',
          });
        }
      }
    } catch (err) {
      console.error('Failed to run notification system health checks:', err);
    }
  };

  useEffect(() => {
    // Run diagnostics immediately on app startup
    runSystemHealthChecks();

    // Set an interval to run checks every 120 seconds
    const interval = setInterval(() => {
      runSystemHealthChecks();
    }, 120000);

    return () => clearInterval(interval);
  }, []); // Run on mount once
};

export default useNotificationRunner;
