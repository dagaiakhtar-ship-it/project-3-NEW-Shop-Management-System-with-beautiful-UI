import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 bg-slate-50/20 dark:bg-slate-950/10">
      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl mb-5 shadow-sm">
        <ShieldAlert className="h-10 w-10 stroke-[1.5]" />
      </div>

      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm mb-6 leading-relaxed">
        The route you are trying to access does not exist, or has been temporarily archived under our Step 1 boundaries.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Go Back
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-1" />
          Dashboard Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
