import React from 'react';
import { 
  Activity, 
  ShoppingCart, 
  PlusCircle, 
  Receipt, 
  Landmark, 
  Settings, 
  LogIn 
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { type ActivityItem } from '../../hooks/useDashboard';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

const TYPE_CONFIG = {
  sale: {
    icon: ShoppingCart,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-55 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/30',
  },
  purchase: {
    icon: PlusCircle,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/30',
  },
  expense: {
    icon: Receipt,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/30',
  },
  credit: {
    icon: Landmark,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30',
  },
  setting: {
    icon: Settings,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/30',
  },
  login: {
    icon: LogIn,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/30',
  },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, isLoading = false }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-indigo-500/80 dark:text-indigo-400" />
            Audit Activity Timeline
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Real-time chronological events log.
          </p>
        </div>
      </div>

      <div className="flex-1 relative pl-4 text-left border-l border-slate-100 dark:border-slate-800/60 space-y-5 ml-2.5">
        {isLoading ? (
          <div className="py-12 pl-0 ml-[-1rem] flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              Generating audit events...
            </span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 pl-0 ml-[-1rem] text-center text-xs font-bold text-slate-400 dark:text-slate-500">
            No activities logged during this period.
          </div>
        ) : (
          activities.map((act) => {
            const config = TYPE_CONFIG[act.type] || TYPE_CONFIG.sale;
            const IconComponent = config.icon;

            return (
              <div key={act.id} className="relative group pl-5">
                {/* Timeline Pin Node */}
                <div
                  className={`absolute left-[-21px] top-1 p-1 rounded-full border-2 border-white dark:border-slate-900 ${config.color} shrink-0 z-10 transition-transform group-hover:scale-110 duration-200`}
                >
                  <IconComponent className="h-3 w-3 stroke-[2.5]" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      {act.title}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 whitespace-nowrap bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                      {formatDate(act.timestamp, true)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal mt-0.5 max-w-sm">
                    {act.description}
                  </p>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">
                    Operator: {act.user}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
