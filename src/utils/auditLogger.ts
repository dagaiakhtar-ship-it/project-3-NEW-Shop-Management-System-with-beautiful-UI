import Dexie from 'dexie';
import { db } from '../database/db';
import { useAuthStore } from '../store/authStore';

/**
 * Log a user action into the IndexedDB auditLogs table for enterprise tracking.
 * 
 * @param action The action type (e.g. 'Login', 'Create', 'Update', 'Delete', 'Sync', 'Backup', 'Repair')
 * @param module The functional module (e.g. 'Auth', 'Products', 'Sales', 'Expenses', 'Credit', 'Settings')
 * @param details A human-readable description of what was changed or performed
 */
export async function logAction(
  action: string,
  module: string,
  details: string
): Promise<void> {
  try {
    // Dynamically retrieve state to avoid circular dependency / initialization issues
    const state = useAuthStore.getState();
    const user = state.currentUser;

    const auditEntry = {
      userId: user?.id,
      username: user?.username || 'System',
      userRole: user?.role || 'System',
      action,
      module,
      details,
      timestamp: new Date(),
    };

    await Dexie.ignoreTransaction(async () => {
      await db.auditLogs.add(auditEntry);
    });
    console.log(`[Audit Log] ${action} in ${module}: ${details}`);
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

export default logAction;
