import React, { useState } from 'react';
import { Search, RotateCcw, Trash2, Pause, Play, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import useSyncQueue from '../../hooks/useSyncQueue';
import Button from '../ui/Button';

export const SyncQueueTable: React.FC = () => {
  const {
    queue,
    isQueuePaused,
    isLoading,
    fetchQueue,
    toggleQueuePause,
    retryQueueItem,
    cancelQueueItem,
    clearQueue
  } = useSyncQueue();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Synced' | 'Failed' | 'Conflict'>('All');

  const getFriendlyTableName = (table: string): string => {
    return table
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/10';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/10';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/10';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border border-slate-150';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-150/10';
      case 'Synced':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-150/10';
      case 'Failed':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-150/10';
      case 'Conflict':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-150/10';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  // Filter and search logic
  const filteredQueue = queue.filter(item => {
    const matchSearch = 
      item.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.recordId).includes(searchTerm) ||
      (item.error && item.error.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = filterStatus === 'All' ? true : item.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm flex flex-col gap-4 text-left">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            Offline Sync Queue Manager
          </h3>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-normal">
            Inspect or clear pending transactions currently buffered locally, awaiting cloud synchronization.
          </p>
        </div>

        {/* Queue Control Buttons */}
        <div className="flex items-center gap-2 self-end xl:self-auto">
          <Button
            variant={isQueuePaused ? 'success' : 'warning'}
            size="xs"
            className="flex items-center gap-1.5 py-1.5 px-3 font-bold text-[11px]"
            onClick={toggleQueuePause}
            id="pause-resume-queue-btn"
          >
            {isQueuePaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            <span>{isQueuePaused ? 'Resume Processing' : 'Pause Queue'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="xs"
            className="flex items-center gap-1.5 py-1.5 px-3 border-red-100 dark:border-red-950 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/15 font-bold text-[11px]"
            onClick={clearQueue}
            disabled={queue.length === 0}
            id="clear-queue-btn"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Queue</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            className="p-1.5 h-auto rounded-xl hover:bg-slate-50"
            title="Refresh queue"
            onClick={fetchQueue}
            id="refresh-queue-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Pending', 'Synced', 'Failed', 'Conflict'] as const).map((status) => {
            const count = status === 'All' 
              ? queue.length 
              : queue.filter(item => item.status === status).length;
            
            const isSelected = filterStatus === status;
            return (
              <button
                key={status}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
                onClick={() => setFilterStatus(status)}
                id={`filter-queue-${status.toLowerCase()}`}
              >
                <span>{status}</span>
                <span className={`ml-1.5 py-0.5 px-1.5 rounded-full text-[9px] font-mono leading-none ${
                  isSelected ? 'bg-indigo-750 text-indigo-100' : 'bg-slate-100 text-slate-550 dark:bg-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Searching */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
          <input
            type="text"
            className="w-full pl-8.5 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Search queue records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredQueue.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5 flex flex-col items-center justify-center gap-2.5">
          <AlertCircle className="h-7 w-7 text-slate-350 dark:text-slate-600" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
              No matching sync queue records
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {filterStatus === 'All' ? 'Your local modifications are perfectly synced.' : `No items marked as "${filterStatus}" currently found.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-850">
          <table className="w-full border-collapse text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-5 py-3">Module/Table</th>
                <th className="px-5 py-3">Record ID</th>
                <th className="px-5 py-3 text-center">Operation</th>
                <th className="px-5 py-3 text-center">Sync Status</th>
                <th className="px-5 py-3">Error logs</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-900 dark:text-white font-black">
                    {getFriendlyTableName(item.table)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-500 text-xs">
                    #{item.recordId}
                  </td>
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${getActionBadgeColor(item.action)}`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getStatusBadgeColor(item.status)}`}>
                      <span className={`h-1 w-1 rounded-full mr-1 ${
                        item.status === 'Synced' ? 'bg-emerald-500' :
                        item.status === 'Pending' ? 'bg-indigo-500' :
                        item.status === 'Failed' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-left max-w-xs truncate text-[10px] text-rose-500 dark:text-rose-400 font-mono leading-tight">
                    {item.error || <span className="text-slate-350 dark:text-slate-650">-</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                    {item.status !== 'Synced' && (
                      <Button
                        variant="outline"
                        size="xs"
                        className="p-1.5 h-auto text-slate-500 hover:text-indigo-600 rounded-lg"
                        title="Retry upload"
                        onClick={() => retryQueueItem(item.id!)}
                        id={`retry-queue-btn-${item.id}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      className="p-1.5 h-auto text-slate-500 hover:text-red-600 rounded-lg"
                      title="Remove from queue"
                      onClick={() => cancelQueueItem(item.id!)}
                      id={`cancel-queue-btn-${item.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SyncQueueTable;
