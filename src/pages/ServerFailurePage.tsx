import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ServerCrash, Home, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * ServerFailurePage Component
 * Styled Internal Server Failure view when system encounters runtime exceptions.
 */
export const ServerFailurePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-6 bg-slate-50/20 dark:bg-slate-950/10">
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl mb-5 shadow-sm">
        <ServerCrash className="h-10 w-10 stroke-[1.5]" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        500 - Server Failure
      </h1>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm mb-6 leading-relaxed uppercase tracking-wider">
        The system encountered an unexpected database or background transaction failure.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Reload Page
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-1.5" />
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default ServerFailurePage;
