import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  PackagePlus, 
  ShoppingCart, 
  PlusCircle, 
  UserPlus, 
  Receipt, 
  BarChart3 
} from 'lucide-react';

interface QuickActionConfig {
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  color: string;
  bgGlow: string;
}

const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    label: 'New Sale (POS)',
    description: 'Launch checkout register',
    path: '/sales',
    icon: ShoppingCart,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-100 dark:border-indigo-950/40',
    bgGlow: 'group-hover:bg-indigo-500/5',
  },
  {
    label: 'Add Product',
    description: 'Register a new stock item',
    path: '/products',
    icon: PackagePlus,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-100 dark:border-emerald-950/40',
    bgGlow: 'group-hover:bg-emerald-500/5',
  },
  {
    label: 'New Purchase',
    description: 'Log inventory acquisition',
    path: '/purchases',
    icon: PlusCircle,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-100 dark:border-sky-950/40',
    bgGlow: 'group-hover:bg-sky-500/5',
  },
  {
    label: 'Add Customer',
    description: 'Enroll a new retail buyer',
    path: '/customers',
    icon: UserPlus,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-100 dark:border-violet-950/40',
    bgGlow: 'group-hover:bg-violet-500/5',
  },
  {
    label: 'Record Expense',
    description: 'File utilities, rent or salaries',
    path: '/expenses',
    icon: Receipt,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-100 dark:border-rose-950/40',
    bgGlow: 'group-hover:bg-rose-500/5',
  },
  {
    label: 'View Reports',
    description: 'Track margins & analytics',
    path: '/reports',
    icon: BarChart3,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-100 dark:border-amber-950/40',
    bgGlow: 'group-hover:bg-amber-500/5',
  },
];

export const QuickActionButtonList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {QUICK_ACTIONS.map((action, idx) => {
        const IconComponent = action.icon;
        return (
          <motion.button
            key={action.label}
            id={`quick-action-btn-${idx}`}
            onClick={() => navigate(action.path)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group text-left p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm border-slate-150/60 dark:border-slate-800/60 flex flex-col justify-between transition-colors duration-200 cursor-pointer h-full relative overflow-hidden`}
          >
            {/* Ambient Background Hover Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${action.bgGlow}`} />

            <div className={`p-2.5 rounded-xl border w-fit ${action.color} mb-3.5`}>
              <IconComponent className="h-5 w-5 stroke-[2.2]" />
            </div>

            <div className="flex flex-col gap-1 z-10">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {action.label}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-tight">
                {action.description}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default QuickActionButtonList;
