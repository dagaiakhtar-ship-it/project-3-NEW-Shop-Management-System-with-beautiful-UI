import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Download, Trash2, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { db } from '../../database/db';
import { verifyPassword } from '../../utils/crypto';
import { useAuthStore } from '../../store/authStore';
import { exportSettings } from '../../utils/settingsHelpers';
import showToast from '../../utils/toast';
import Button from '../ui/Button';

interface ResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCompleted?: () => void;
}

type ResetTarget =
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'sales'
  | 'purchases'
  | 'expenses'
  | 'credit'
  | 'reports'
  | 'everything';

export const ResetDialog: React.FC<ResetDialogProps> = ({
  isOpen,
  onClose,
  onResetCompleted
}) => {
  const [password, setPassword] = useState('');
  const [target, setTarget] = useState<ResetTarget>('products');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { currentUser } = useAuthStore();

  const handleBackupBeforeReset = async () => {
    try {
      // 1. Gather all tables into a giant backup object
      const backupData: any = {};
      const tables = [
        'products', 'categories', 'customers', 'suppliers',
        'sales', 'saleItems', 'purchases', 'purchaseItems',
        'expenses', 'expenseCategories', 'creditAccounts',
        'creditPayments', 'settings', 'users', 'stockHistory'
      ];

      for (const t of tables) {
        backupData[t] = await (db as any)[t].toArray();
      }

      // Convert to string and download
      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShopCraft_Backup_PreReset_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast.success('Safety backup downloaded successfully! You are safe to proceed.');
    } catch (err: any) {
      showToast.error(`Failed to export data backup: ${err.message || err}`);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast.error('Administrator password verification is required.');
      return;
    }

    if (!currentUser) {
      showToast.error('No authenticated user session active.');
      return;
    }

    setIsVerifying(true);
    try {
      // Fetch fresh hash from user to ensure match
      const userRecord = await db.users.get(currentUser.id!);
      if (!userRecord) {
        showToast.error('User record not found.');
        setIsVerifying(false);
        return;
      }

      const isPassValid = await verifyPassword(password, userRecord.passwordHash);
      if (!isPassValid) {
        showToast.error('Invalid Administrator password. Action blocked.');
        setIsVerifying(false);
        return;
      }

      setIsVerifying(false);
      setIsResetting(true);

      // Perform selective resets
      switch (target) {
        case 'products':
          await db.products.clear();
          await db.stockHistory.clear();
          showToast.success('Products and stock history cleared.');
          break;
        case 'customers':
          await db.customers.clear();
          await db.creditAccounts.clear();
          await db.creditPayments.clear();
          showToast.success('Customers and credit balances cleared.');
          break;
        case 'suppliers':
          await db.suppliers.clear();
          showToast.success('Suppliers list cleared.');
          break;
        case 'sales':
          await db.sales.clear();
          await db.saleItems.clear();
          showToast.success('Sales ledger and cart entries cleared.');
          break;
        case 'purchases':
          await db.purchases.clear();
          await db.purchaseItems.clear();
          showToast.success('Purchase ledger and intake logs cleared.');
          break;
        case 'expenses':
          await db.expenses.clear();
          showToast.success('Expense ledger cleared.');
          break;
        case 'credit':
          await db.creditAccounts.clear();
          await db.creditPayments.clear();
          showToast.success('Ledger lines and credit accounts cleared.');
          break;
        case 'reports':
          await db.backupHistory.clear();
          showToast.success('Diagnostics history cleared.');
          break;
        case 'everything':
          await db.products.clear();
          await db.categories.clear();
          await db.customers.clear();
          await db.suppliers.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.purchases.clear();
          await db.purchaseItems.clear();
          await db.expenses.clear();
          await db.expenseCategories.clear();
          await db.creditAccounts.clear();
          await db.creditPayments.clear();
          await db.stockHistory.clear();
          await db.syncQueue.clear();
          await db.backupHistory.clear();
          showToast.success('System database completely wiped clean.');
          break;
      }

      if (onResetCompleted) {
        onResetCompleted();
      }
      onClose();
    } catch (err: any) {
      showToast.error(`Wipe operation failed: ${err.message || err}`);
    } finally {
      setIsResetting(false);
      setPassword('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-2xl overflow-hidden text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-black tracking-tight uppercase">Critical Administration Reset</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReset} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-xs flex gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-extrabold text-red-800 dark:text-red-300">Irreversible Data Loss warning</span>
                  <p className="text-[10px] text-red-600/90 dark:text-red-400/90 leading-relaxed font-semibold">
                    Performing this action will immediately and permanently delete selected records from your local IndexedDB database.
                    Cloud spreadsheets will sync these deletions during active sync unless paused.
                  </p>
                </div>
              </div>

              {/* Step 1: Selector */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Database Segment to Clear
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as ResetTarget)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden focus:border-red-500"
                >
                  <option value="products">Products & Stock History</option>
                  <option value="customers">Customers & Customer Credit Accounts</option>
                  <option value="suppliers">Suppliers List</option>
                  <option value="sales">Sales Ledger (POS Sales)</option>
                  <option value="purchases">Purchases Ledger</option>
                  <option value="expenses">Operating Expenses</option>
                  <option value="credit">All Credit Logs & Payments</option>
                  <option value="reports">Diagnostic Reports History</option>
                  <option value="everything">EVERYTHING (Complete System Wipe)</option>
                </select>
              </div>

              {/* Safety Backup Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-slate-850 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">Recommended Data Export</span>
                  <span className="text-[9px] text-slate-400 font-semibold leading-tight mt-0.5">Download a JSON backup file to restore later if needed.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="flex items-center gap-1.5 py-1.5 px-3 h-auto text-[10px] font-bold shrink-0 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50"
                  onClick={handleBackupBeforeReset}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Backup</span>
                </Button>
              </div>

              {/* Password Entry */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Administrator Security Password
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="Enter your login password to authorize"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="font-bold text-slate-500"
                  disabled={isResetting || isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isResetting || isVerifying || !password}
                  className="font-bold flex items-center shadow-md bg-red-600 hover:bg-red-700 border-red-600"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Wiping Segment...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Wipe Data Segments
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResetDialog;
