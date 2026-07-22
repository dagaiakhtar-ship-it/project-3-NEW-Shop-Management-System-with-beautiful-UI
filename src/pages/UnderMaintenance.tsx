import React from 'react';
import { Hammer, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * UnderMaintenance Component
 * Shown when offline synchronizations or structural schemas are being migrated.
 */
export const UnderMaintenance: React.FC = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-6 bg-slate-50/20 dark:bg-slate-950/10">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl mb-5 shadow-sm">
        <Hammer className="h-10 w-10 stroke-[1.5]" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        Under Maintenance
      </h1>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm mb-6 leading-relaxed uppercase tracking-wider">
        The database structures are being optimized. Please check back shortly.
      </p>

      <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
        <RotateCcw className="h-4 w-4 mr-1.5" />
        Retry Connection
      </Button>
    </div>
  );
};

export default UnderMaintenance;
