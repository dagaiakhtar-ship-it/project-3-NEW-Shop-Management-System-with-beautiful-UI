import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * ComingSoon Component
 * Visual placeholder for features scheduled for subsequent releases.
 */
export const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-6 bg-slate-50/20 dark:bg-slate-950/10">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-5 shadow-sm">
        <Sparkles className="h-10 w-10 stroke-[1.5] animate-pulse" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        Feature Coming Soon
      </h1>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm mb-6 leading-relaxed uppercase tracking-wider">
        Our engineers are actively constructing this dashboard element for the next upgrade step.
      </p>

      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Go Back
      </Button>
    </div>
  );
};

export default ComingSoon;
