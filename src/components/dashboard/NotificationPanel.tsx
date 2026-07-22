import React from 'react';
import { Bell, AlertCircle, CheckCircle, Info, RefreshCw, X } from 'lucide-react';
import { type NotificationItem } from '../../hooks/useDashboard';

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
}

const NOTIF_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500/10 border-emerald-150/40 dark:border-emerald-950/40',
    color: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-500/10 border-amber-150/40 dark:border-amber-950/40',
    color: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  danger: {
    icon: AlertCircle,
    bg: 'bg-rose-500/10 border-rose-150/40 dark:border-rose-950/40',
    color: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  info: {
    icon: Info,
    bg: 'bg-indigo-500/10 border-indigo-150/40 dark:border-indigo-950/40',
    color: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onDismiss,
  isLoading = false,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <Bell className="h-4.5 w-4.5 text-indigo-500/80 dark:text-indigo-400" />
            Live Store Notifications
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Real-time status checks and alert signals.
          </p>
        </div>
        {notifications.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
            {notifications.length}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Syncing alerts...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-1.5">
            <CheckCircle className="h-7 w-7 text-emerald-500/80" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Clear Dashboard Alerts
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-xs">
              No unresolved alerts detected on today's logs.
            </span>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.info;
            const IconComponent = config.icon;

            return (
              <div
                key={notif.id}
                className={`flex gap-3.5 p-3.5 rounded-2xl border text-left relative ${config.bg}`}
              >
                {/* Status Dot */}
                <span className={`absolute top-3.5 right-3.5 h-2 w-2 rounded-full ${config.dot}`} />

                <div className={`p-1.5 rounded-xl bg-white dark:bg-slate-950 h-fit border border-slate-100 dark:border-slate-900 ${config.color}`}>
                  <IconComponent className="h-4 w-4 stroke-[2.5]" />
                </div>

                <div className="flex-1 pr-4">
                  <span className="text-xs font-black tracking-tight text-slate-850 dark:text-slate-100 block">
                    {notif.title}
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-450 leading-relaxed mt-1">
                    {notif.description}
                  </p>
                </div>

                {onDismiss && (
                  <button
                    onClick={() => onDismiss(notif.id)}
                    className="absolute bottom-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
