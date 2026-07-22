import React, { useState } from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import { getPasswordStrength } from '../../utils/crypto';
import { X, KeyRound, CheckCircle2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { user, changePassword } = useCurrentUser();

  // Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Password Visibility States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Strength evaluation
  const strength = getPasswordStrength(newPass);

  const handleReset = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user || !user.id) return;

    // Standard Validations
    if (!currentPass || !newPass || !confirmPass) {
      setErrorMsg('All password fields are required.');
      return;
    }

    if (newPass.length < 5) {
      setErrorMsg('New password must be at least 5 characters long.');
      return;
    }

    if (newPass === currentPass) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('Confirm password does not match the new password.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(user.id, currentPass, newPass);
      setSuccessMsg('Your password has been updated successfully!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-left"
          id="change-password-modal"
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-50 dark:border-slate-850/40">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Change Password
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Success Alert */}
            {successMsg && (
              <div className="flex items-center gap-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-normal">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-600 dark:text-rose-450 font-bold leading-normal">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current Password Field */}
            <Input
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              id="current-password-input"
              placeholder="Enter current password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              disabled={isLoading}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
            />

            {/* New Password Field */}
            <div>
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                id="new-password-input"
                placeholder="Enter new password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                disabled={isLoading}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                }
              />

              {/* Password Strength Meter */}
              {newPass && (
                <div className="mt-2.5 space-y-1" id="strength-meter-container">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>Password Strength:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-white font-extrabold ${strength.color}`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <Input
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              id="confirm-password-input"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              disabled={isLoading}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
            />

            {/* Form Actions footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-850/40 mt-6">
              <Button
                type="button"
                variant="slate"
                size="md"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Save Password
              </Button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChangePasswordModal;
