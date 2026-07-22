import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you absolutely sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-sky-500" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center shrink-0">
            {getIcon()}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={getButtonVariant()} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
