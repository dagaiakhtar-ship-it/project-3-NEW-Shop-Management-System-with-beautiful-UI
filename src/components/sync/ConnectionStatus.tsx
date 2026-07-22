import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import useConnection from '../../hooks/useConnection';
import Button from '../ui/Button';

export const ConnectionStatus: React.FC = () => {
  const { isOnline, pingStatus, latencyMs, verifyApiConnection } = useConnection();
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    await verifyApiConnection();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500'
        }`}>
          {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Network Connection
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-sm font-black tracking-tight ${
              isOnline ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {isOnline ? 'Internet Connected' : 'Offline Mode'}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            </span>
          </div>
          {isOnline && pingStatus === 'success' && latencyMs !== null && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mt-0.5">
              API ping latency: {latencyMs}ms (Response Healthy)
            </span>
          )}
          {isOnline && pingStatus === 'checking' && (
            <span className="text-[10px] text-indigo-500 animate-pulse font-semibold uppercase mt-0.5">
              Verifying active Google Sheets connection...
            </span>
          )}
          {isOnline && pingStatus === 'failed' && (
            <span className="text-[10px] text-amber-500 font-bold uppercase mt-0.5">
              Web App URL unreachable or rejected token
            </span>
          )}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="xs" 
        className="flex items-center gap-1.5 py-1 px-2.5 h-auto text-[11px] font-bold"
        onClick={handleCheck}
        disabled={loading}
        id="check-connection-btn"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Checking...' : 'Check Connection'}</span>
      </Button>
    </div>
  );
};

export default ConnectionStatus;
