import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface SyncProgressProps {
  progress: number;
  isActive: boolean;
  label?: string;
  sublabel?: string;
}

export const SyncProgress: React.FC<SyncProgressProps> = ({ 
  progress, 
  isActive, 
  label = 'Synchronizing database...', 
  sublabel = 'Connecting to Google Apps Script...' 
}) => {
  if (!isActive) return null;

  return (
    <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {label}
            </h4>
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {sublabel}
            </p>
          </div>
        </div>
        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/85 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default SyncProgress;
