import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, ShieldCheck, ShieldAlert, History, RotateCcw } from 'lucide-react';
import { db, type BackupHistoryItem } from '../../database/db';
import Button from '../ui/Button';
import showToast from '../../utils/toast';

interface BackupHistoryTableProps {
  onRestoreTrigger: (backup: BackupHistoryItem) => void;
}

export const BackupHistoryTable: React.FC<BackupHistoryTableProps> = ({ onRestoreTrigger }) => {
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await db.backupHistory.orderBy('backupDate').reverse().toArray();
      setHistory(logs);
    } catch (e) {
      console.error('Failed to load backup history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateInput: Date | string): string => {
    const d = new Date(dateInput);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Filter logic
  const filteredHistory = history.filter(item => {
    const matchSearch = item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.error && item.error.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm flex flex-col gap-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            Cloud Backup History Logs
          </h3>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-normal">
            Browse through previous automatic and manual cloud backup operations.
          </p>
        </div>

        {/* Searching */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5 flex flex-col items-center justify-center gap-2.5">
          <Calendar className="h-7 w-7 text-slate-350 dark:text-slate-650" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">No backup history found</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Your cloud backups will register here as they are created.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-850">
          <table className="w-full border-collapse text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-5 py-3">Backup Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-center">Records Size</th>
                <th className="px-5 py-3 text-center">Duration</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {filteredHistory.map((item) => {
                const isSuccess = item.status === 'Success';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-900 dark:text-white font-bold flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(item.backupDate)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/20">
                        {item.type || 'Full'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {item.recordsCount} records
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {formatDuration(item.durationMs)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/20 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/20 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {isSuccess ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {isSuccess ? (
                        <Button
                          variant="outline"
                          size="xs"
                          className="inline-flex items-center gap-1 py-1 px-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30"
                          onClick={() => onRestoreTrigger(item)}
                          id={`restore-history-btn-${item.id}`}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </Button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Unavailable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BackupHistoryTable;
