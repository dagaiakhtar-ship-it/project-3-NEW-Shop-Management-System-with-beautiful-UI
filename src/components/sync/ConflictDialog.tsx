import React from 'react';
import { ShieldAlert, HelpCircle, Save, Cloud, ArrowRight, Merge } from 'lucide-react';
import type { ConflictRecord } from '../../hooks/useRestore';
import Button from '../ui/Button';

interface ConflictDialogProps {
  conflicts: ConflictRecord[];
  onResolve: (conflict: ConflictRecord, choice: 'local' | 'cloud' | 'merge') => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({ conflicts, onResolve }) => {
  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[0];
  const { table, recordId, local, cloud } = currentConflict;

  // Gather unique keys from both records to display them in a list
  const allKeys = Array.from(new Set([...Object.keys(local), ...Object.keys(cloud)]))
    .filter(key => !['syncStatus', 'lastSyncedAt', 'syncVersion', 'syncError'].includes(key));

  const formatValue = (val: any): string => {
    if (val === undefined || val === null) return 'Empty';
    if (typeof val === 'object') {
      if (val instanceof Date) return val.toLocaleString();
      return JSON.stringify(val);
    }
    return String(val);
  };

  const getFriendlyTableName = (tbl: string): string => {
    return tbl.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs select-none">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-amber-500/10 border-b border-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="text-base font-black tracking-tight">Data Conflict Detected</h3>
            <p className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">
              Conflict {conflicts.length} remaining • Table: <span className="font-bold underline">{getFriendlyTableName(table)}</span> • ID: <span className="font-mono">#{recordId}</span>
            </p>
          </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-left leading-normal font-semibold">
            The local database record and cloud spreadsheet backup record have different contents. Please compare them below and choose how to resolve this.
          </p>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-850 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 text-left">
              <div>Field Attributes</div>
              <div>Local IndexedDB</div>
              <div>Cloud Spreadsheet</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {allKeys.map(key => {
                const localVal = local[key];
                const cloudVal = cloud[key];
                const isDiff = JSON.stringify(localVal) !== JSON.stringify(cloudVal);

                return (
                  <div 
                    key={key} 
                    className={`grid grid-cols-3 px-4 py-3 text-xs font-semibold text-left items-center ${
                      isDiff 
                        ? 'bg-amber-50/20 dark:bg-amber-950/5 text-amber-700 dark:text-amber-300' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold truncate">{key}</div>
                    <div className={`truncate ${isDiff ? 'font-black' : ''}`}>{formatValue(localVal)}</div>
                    <div className={`truncate ${isDiff ? 'font-black' : ''}`}>{formatValue(cloudVal)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
              Pick one resolution below
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 py-1.5 px-3.5 border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15"
              onClick={() => onResolve(currentConflict, 'local')}
              id="resolve-keep-local-btn"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Keep Local</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 py-1.5 px-3.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/15"
              onClick={() => onResolve(currentConflict, 'cloud')}
              id="resolve-keep-cloud-btn"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Keep Cloud</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 py-1.5 px-3.5"
              onClick={() => onResolve(currentConflict, 'merge')}
              id="resolve-merge-btn"
            >
              <Merge className="h-3.5 w-3.5" />
              <span>Merge Records</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConflictDialog;
