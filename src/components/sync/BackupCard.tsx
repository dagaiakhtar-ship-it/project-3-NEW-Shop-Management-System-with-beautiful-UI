import React, { useState, useEffect } from 'react';
import { Download, FileJson, FileText, FileSpreadsheet, Layers } from 'lucide-react';
import { db } from '../../database/db';
import { SYNCABLE_TABLES } from '../../services/syncService';
import useBackup from '../../hooks/useBackup';
import Button from '../ui/Button';

export const BackupCard: React.FC = () => {
  const { exportLocalJSON, exportLocalCSV, exportLocalExcel } = useBackup();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchRecordCounts = async () => {
    setLoading(true);
    const map: Record<string, number> = {};
    for (const table of SYNCABLE_TABLES) {
      try {
        const count = await (db as any)[table].count();
        map[table] = count;
      } catch (e) {
        map[table] = 0;
      }
    }
    setCounts(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecordCounts();
  }, []);

  const getFriendlyName = (table: string): string => {
    return table
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm flex flex-col gap-5 text-left">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          Modular Offline Exports
        </h3>
        <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-normal">
          Export and download tables individually as physical spreadsheets or backups fully offline.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
          {SYNCABLE_TABLES.map(table => {
            const count = counts[table] || 0;
            return (
              <div 
                key={table} 
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {getFriendlyName(table)}
                  </span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-1">
                    {count} {count === 1 ? 'record' : 'records'} locally
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="xs"
                    className="p-1.5 h-auto rounded-lg hover:bg-white dark:hover:bg-slate-950 text-slate-500 hover:text-indigo-600"
                    title="Export JSON"
                    onClick={() => exportLocalJSON()}
                    id={`export-json-${table}`}
                  >
                    <FileJson className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="p-1.5 h-auto rounded-lg hover:bg-white dark:hover:bg-slate-950 text-slate-500 hover:text-emerald-600"
                    title="Export CSV"
                    disabled={count === 0}
                    onClick={() => exportLocalCSV(table)}
                    id={`export-csv-${table}`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="p-1.5 h-auto rounded-lg hover:bg-white dark:hover:bg-slate-950 text-slate-500 hover:text-green-600"
                    title="Export Excel"
                    disabled={count === 0}
                    onClick={() => exportLocalExcel(table)}
                    id={`export-excel-${table}`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BackupCard;
