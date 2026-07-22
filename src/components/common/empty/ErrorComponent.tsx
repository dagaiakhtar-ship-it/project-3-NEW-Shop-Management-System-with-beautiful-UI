import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../../ui/Button';

interface ErrorComponentProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorComponent
 * Visual helper for displaying errors (e.g. database query failure, offline sync timeout).
 */
export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 border border-red-100 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10 rounded-xl text-center ${className}`}>
      <div className="p-2.5 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-xs text-red-600 dark:text-red-500 max-w-sm mb-4 leading-relaxed font-medium">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 hover:text-red-800 dark:hover:bg-red-950/30">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Retry Operation
        </Button>
      )}
    </div>
  );
};

export default ErrorComponent;
