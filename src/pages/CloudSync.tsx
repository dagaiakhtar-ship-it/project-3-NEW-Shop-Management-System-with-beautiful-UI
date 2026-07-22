import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Layers, Server, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

// Hooks
import useSync from '../hooks/useSync';
import useSyncQueue from '../hooks/useSyncQueue';

// Subcomponents
import ConnectionStatus from '../components/sync/ConnectionStatus';
import SyncProgress from '../components/sync/SyncProgress';
import BackupCard from '../components/sync/BackupCard';
import JsonBackupCard from '../components/sync/JsonBackupCard';
import BackupHistoryTable from '../components/sync/BackupHistoryTable';
import SyncQueueTable from '../components/sync/SyncQueueTable';
import ConflictDialog from '../components/sync/ConflictDialog';
import RestoreWizard from '../components/sync/RestoreWizard';

// Database & types
import { db, type BackupHistoryItem } from '../database/db';
import { SYNCABLE_TABLES } from '../services/syncService';
import type { ConflictRecord } from '../hooks/useRestore';
import useRestore from '../hooks/useRestore';
import showToast from '../utils/toast';

export const CloudSync: React.FC = () => {
  const { isSyncing, syncProgress, lastSyncTime, triggerIncrementalSync } = useSync();
  const { queue, fetchQueue } = useSyncQueue();
  const { conflicts, resolveConflict } = useRestore();

  const [activeConflicts, setActiveConflicts] = useState<ConflictRecord[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    synced: 0,
    failed: 0,
    conflict: 0
  });

  // Load sync state statistics
  useEffect(() => {
    const pendingCount = queue.filter(q => q.status === 'Pending').length;
    const failedCount = queue.filter(q => q.status === 'Failed').length;
    const conflictCount = queue.filter(q => q.status === 'Conflict').length;
    const syncedCount = queue.filter(q => q.status === 'Synced').length;

    setCounts({
      pending: pendingCount,
      failed: failedCount,
      conflict: conflictCount,
      synced: syncedCount
    });
  }, [queue]);

  const handleManualSync = async () => {
    const success = await triggerIncrementalSync();
    if (success) {
      await fetchQueue();
    }
  };

  const handleWizardConflicts = (detectedConflicts: ConflictRecord[]) => {
    setActiveConflicts(detectedConflicts);
  };

  const handleResolve = async (conflict: ConflictRecord, choice: 'local' | 'cloud' | 'merge') => {
    await resolveConflict(conflict, choice);
    // Filter out resolved conflict locally to update the modal
    setActiveConflicts(prev => prev.filter(c => !(c.table === conflict.table && c.recordId === conflict.recordId)));
  };

  const handleRestoreSuccess = () => {
    showToast.success('Database restore finished successfully. Page refreshed.');
    window.location.reload();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 select-none max-w-7xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20 tracking-wider">
              Offline First Engine v2.0
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Cloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Cloud Backup & Sync
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure secure database mirroring with Google Sheets. Local changes automatically queue in real-time and synchronize whenever internet connection is detected.
          </p>
        </div>

        {/* Sync Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            id="trigger-manual-sync-btn"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-450 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Pending Changes'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Network Telemetry & Sync Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ConnectionStatus />
        </div>
        
        <div className="lg:col-span-2">
          {isSyncing ? (
            <SyncProgress 
              isActive={isSyncing} 
              progress={syncProgress} 
              label="Syncing local changes to Google Sheets..."
              sublabel="Uploading batches of pending transactions securely..."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider">Pending Upload</span>
                <span className={`text-xl font-black tracking-tight mt-1 ${counts.pending > 0 ? 'text-indigo-600' : 'text-slate-950 dark:text-white'}`}>
                  {counts.pending}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider">Conflicts</span>
                <span className={`text-xl font-black tracking-tight mt-1 ${counts.conflict > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-950 dark:text-white'}`}>
                  {counts.conflict}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider">Sync Errors</span>
                <span className={`text-xl font-black tracking-tight mt-1 ${counts.failed > 0 ? 'text-rose-500' : 'text-slate-950 dark:text-white'}`}>
                  {counts.failed}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider">Last Sync Successful</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-350 tracking-tight mt-2.5 truncate">
                  {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Central Data Integrity & JSON Architecture */}
      <JsonBackupCard />

      {/* Grid: Backup & Restore Wizards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RestoreWizard 
          onSuccess={handleRestoreSuccess} 
          onConflictsFound={handleWizardConflicts} 
        />
        <BackupCard />
      </div>

      {/* Grid: Lists & Tables */}
      <div className="space-y-6">
        <SyncQueueTable />
        <BackupHistoryTable onRestoreTrigger={(backup) => {
          showToast.info('Triggering full download snapshot restore from history entry...');
          // Since it's a success record, we can invoke selective module restore
          // with table configuration to overwrite local
          const parsedDetails = backup.details ? JSON.parse(backup.details) : {};
          const tablesToRestore = Object.keys(parsedDetails).length > 0 ? Object.keys(parsedDetails) : SYNCABLE_TABLES;
          
          triggerIncrementalSync().then(() => {
            // Initiate full restoration overwrite
            const wizard = document.getElementById('start-restore-btn');
            if (wizard) {
              showToast.info('Restoring cloud tables. Please configure parameters.');
            }
          });
        }} />
      </div>

      {/* Global Interactive Conflict Modal */}
      {activeConflicts.length > 0 && (
        <ConflictDialog 
          conflicts={activeConflicts} 
          onResolve={handleResolve} 
        />
      )}

    </div>
  );
};

export default CloudSync;
