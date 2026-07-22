import React from 'react';
import { Bell, Calendar, AlertTriangle, ChevronRight, User } from 'lucide-react';
import { type CreditAccount } from '../../database/db';

interface ReminderPanelProps {
  reminders: {
    dueToday: CreditAccount[];
    overdue: CreditAccount[];
    upcoming: CreditAccount[];
  } | null;
  onSelectCustomer: (customerId: number) => void;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({ reminders, onSelectCustomer }) => {
  if (!reminders) return null;

  const totalCount = reminders.dueToday.length + reminders.overdue.length + reminders.upcoming.length;

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl shadow-xs p-4 flex flex-col gap-4">
      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
        <span className="flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-indigo-500 shrink-0" />
          Collection Reminders & Alerts
        </span>
        {totalCount > 0 && (
          <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
            {totalCount} Alerts
          </span>
        )}
      </h3>

      {totalCount === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <Calendar className="h-7 w-7 mx-auto text-slate-300 dark:text-slate-800 mb-1.5" />
          <p className="text-[10px] font-black uppercase tracking-wider">No Outstanding Reminders</p>
          <p className="text-[9px] text-slate-400 mt-0.5">All customer accounts are currently within credit terms.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
          {/* 1. Overdue Accounts */}
          {reminders.overdue.length > 0 && (
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 animate-pulse shrink-0" />
                Overdue Accounts ({reminders.overdue.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {reminders.overdue.slice(0, 5).map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onSelectCustomer(acc.customerId)}
                    className="flex items-center justify-between p-2.5 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-950/5 dark:hover:bg-rose-950/10 rounded-xl border border-rose-100/30 dark:border-rose-900/10 cursor-pointer transition text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <div>
                      <span className="font-mono text-slate-900 dark:text-white font-bold block">
                        {acc.invoiceNumber}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Due: {acc.dueDate ? new Date(acc.dueDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-rose-600 block">
                        ${(acc.remainingAmount ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        View Ledger
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Due Today */}
          {reminders.dueToday.length > 0 && (
            <div className="flex flex-col gap-1.5 text-left mt-2">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Due Today ({reminders.dueToday.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {reminders.dueToday.slice(0, 5).map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onSelectCustomer(acc.customerId)}
                    className="flex items-center justify-between p-2.5 bg-indigo-500/5 hover:bg-indigo-500/10 dark:bg-indigo-950/5 dark:hover:bg-indigo-950/10 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10 cursor-pointer transition text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <div>
                      <span className="font-mono text-slate-900 dark:text-white font-bold block">
                        {acc.invoiceNumber}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Due today!
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-indigo-600 block">
                        ${(acc.remainingAmount ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        View Ledger
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Upcoming due in 7 days */}
          {reminders.upcoming.length > 0 && (
            <div className="flex flex-col gap-1.5 text-left mt-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Upcoming Due - 7 Days ({reminders.upcoming.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {reminders.upcoming.slice(0, 5).map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onSelectCustomer(acc.customerId)}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850 cursor-pointer transition text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <div>
                      <span className="font-mono text-slate-900 dark:text-white font-bold block">
                        {acc.invoiceNumber}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Due: {acc.dueDate ? new Date(acc.dueDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 block">
                        ${(acc.remainingAmount ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        View Ledger
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderPanel;
