import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Store, ShieldAlert, KeyRound, User as UserIcon, HelpCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';

export const LoginForm: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  // Component Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation States
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Validate form fields
  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Username is required.';
      isValid = false;
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required.';
      isValid = false;
    } else if (password.length < 5) {
      errors.password = 'Password must be at least 5 characters.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});

    if (!validateForm()) return;

    try {
      await login(username, password, rememberMe);
      // On success, redirect to dashboard
      navigate('/');
    } catch (err) {
      // Error is caught and handled by auth store, which updates error state
      console.error('Login error:', err);
    }
  };

  return (
    <div className="w-full max-w-md" id="login-form-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xl px-8 py-10 text-left"
      >
        {/* Shop Logo & Title Banner */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 border border-indigo-100/30 dark:border-indigo-800/20 shadow-xs">
            <Store className="h-8 w-8" id="shop-logo" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight uppercase">
            Shop Manager
          </h2>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            Single-Shop Retail OS
          </p>
        </div>

        {/* Global Error Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl mb-6 text-xs text-rose-600 dark:text-rose-400 font-semibold"
            id="login-error-alert"
          >
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <Input
            label="Username"
            type="text"
            id="login-username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            leftIcon={<UserIcon className="h-4 w-4" />}
            error={fieldErrors.username}
            disabled={isLoading}
            autoComplete="username"
            required
          />

          {/* Password Input with Show/Hide toggle */}
          <PasswordInput
            label="Password"
            id="login-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />

          {/* Remember Me and Forgot Password Container */}
          <div className="flex items-center justify-between pt-1 select-none">
            <Checkbox
              label="Remember Me"
              id="login-remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />

            <button
              type="button"
              onClick={() => setShowForgotNotice(true)}
              className="text-xs font-bold text-indigo-650 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              id="login-forgot-pass-btn"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-6"
            isLoading={isLoading}
            disabled={isLoading}
            id="login-submit-button"
          >
            Sign In
          </Button>
        </form>

        {/* Offline Forgot Password Notice Modal */}
        {showForgotNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl max-w-sm shadow-2xl text-center"
            >
              <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-xl mb-4">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Offline Security Setup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-5">
                This application operates strictly offline and stores credentials securely in your local browser IndexedDB database. 
                To reset or retrieve a password, please contact your **Shop Administrator** who can change user passwords from the Admin Console.
              </p>
              <Button
                variant="slate"
                size="sm"
                className="w-full"
                onClick={() => setShowForgotNotice(false)}
              >
                Understood, Close
              </Button>
            </motion.div>
          </div>
        )}

        {/* Initial setup prompt indicators */}
        <div className="flex gap-2.5 items-center justify-center mt-6 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/30 text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider select-none">
          <AlertCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>Local IndexedDB Session Secured</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
