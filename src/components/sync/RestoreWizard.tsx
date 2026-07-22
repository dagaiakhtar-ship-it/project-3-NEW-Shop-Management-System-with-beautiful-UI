import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckSquare, Square, Settings, ChevronRight } from 'lucide-react';
import { SYNCABLE_TABLES } from '../../services/syncService';
import useRestore from '../../hooks/useRestore';
import SyncProgress from './SyncProgress';
import Button from '../ui/Button';

interface RestoreWizardProps {
  onSuccess: () => void;
  onConflictsFound: (conflicts: any[]) => void;
}

export const RestoreWizard: React.FC<RestoreWizardProps> = ({ onSuccess, onConflictsFound }) => {
  const { isRestoring, restoreProgress, conflicts, triggerModuleRestore } = useRestore();
  const [scope, setScope] = useState<'all' | 'selective'>('all');
  const [selectedTables, setSelectedTables] = useState<string[]>(SYNCABLE_TABLES);
  const [conflictPolicy, setConflictPolicy] = useState<'manual' | 'cloud' | 'local'>('manual');

  const toggleTable = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const getFriendlyName = (table: string): string => {
    return table
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const handleStartRestore = async () => {
    const tablesToRestore = scope === 'all' ? SYNCABLE_TABLES : selectedTables;
    if (tablesToRestore.length === 0) {
      return;
    }

    const result = await triggerModuleRestore(tablesToRestore, conflictPolicy);
    if (result.success) {
      if (result.conflictsFound > 0) {
        // Handled in parent
      } else {
        onSuccess();
      }
    }
  };

  // Expose active conflicts to parent component if found
  React.useEffect(() => {
    if (conflicts.length > 0) {
      onConflictsFound(conflicts);
    }
  }, [conflicts, onConflictsFound]);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm flex flex-col gap-6 text-left">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <RotateCcw className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          Cloud Restoration Wizard
        </h3>
        <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-normal">
          Download records back from Google Sheets to reconstruct your local IndexedDB state.
        </p>
      </div>

      {isRestoring ? (
        <SyncProgress 
          isActive={isRestoring} 
          progress={restoreProgress} 
          label="Downloading records..."
          sublabel="Parsing rows and resolving database keys..."
        />
      ) : (
        <div className="space-y-5">
          {/* 1. Selection Scope */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Step 1: Choose Restoration Scope
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${
                  scope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50'
                }`}
                onClick={() => setScope('all')}
                id="restore-scope-all-btn"
              >
                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Whole Store Database</div>
                <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 leading-normal font-semibold">
                  Restores all tables completely from Google Sheets. Recommended for setups.
                </div>
              </button>

              <button
                className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${
                  scope === 'selective'
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50'
                }`}
                onClick={() => setScope('selective')}
                id="restore-scope-selective-btn"
              >
                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Selective Modules</div>
                <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 leading-normal font-semibold">
                  Selectively download individual tables. Keeps other local modules untouched.
                </div>
              </button>
            </div>
          </div>

          {/* 1b. Selective Table Grid */}
          {scope === 'selective' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 space-y-3">
              <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase">Select tables to restore:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {SYNCABLE_TABLES.map(table => {
                  const isChecked = selectedTables.includes(table);
                  return (
                    <button
                      key={table}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-150/50 hover:border-indigo-400 text-left text-xs font-semibold cursor-pointer select-none"
                      onClick={() => toggleTable(table)}
                      id={`toggle-table-${table}`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-350 shrink-0" />
                      )}
                      <span className="truncate">{getFriendlyName(table)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Conflict Handling Policy */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Step 2: Conflict Resolution Policy
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  conflictPolicy === 'manual'
                    ? 'border-indigo-600 bg-indigo-50/15'
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                }`}
                onClick={() => setConflictPolicy('manual')}
                id="policy-manual-btn"
              >
                <Settings className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Ask me (Manual)</div>
                  <div className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5 font-semibold">Compare mismatched records one by one.</div>
                </div>
              </button>

              <button
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  conflictPolicy === 'cloud'
                    ? 'border-indigo-600 bg-indigo-50/15'
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                }`}
                onClick={() => setConflictPolicy('cloud')}
                id="policy-cloud-btn"
              >
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Overwrite Local</div>
                  <div className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5 font-semibold">Google Sheets will strictly overwrite local data.</div>
                </div>
              </button>

              <button
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  conflictPolicy === 'local'
                    ? 'border-indigo-600 bg-indigo-50/15'
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                }`}
                onClick={() => setConflictPolicy('local')}
                id="policy-local-btn"
              >
                <CheckSquare className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Keep Local</div>
                  <div className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5 font-semibold">Preserve IndexedDB, skip cloud changes on conflict.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-extrabold uppercase">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Warning: Overwriting is irreversible</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 font-bold"
              onClick={handleStartRestore}
              disabled={scope === 'selective' && selectedTables.length === 0}
              id="start-restore-btn"
            >
              <span>Download & Restore</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoreWizard;
