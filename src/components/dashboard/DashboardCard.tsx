import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: number; // percentage change
  changeLabel?: string;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';
  description?: string;
  id?: string;
}

const VARIANT_STYLES = {
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100/60 dark:border-indigo-950/50',
    sparkline: 'stroke-indigo-600 dark:stroke-indigo-400',
    glow: 'shadow-indigo-100/30 dark:shadow-none',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100/60 dark:border-emerald-950/50',
    sparkline: 'stroke-emerald-600 dark:stroke-emerald-400',
    glow: 'shadow-emerald-100/30 dark:shadow-none',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'border-amber-100/60 dark:border-amber-950/50',
    sparkline: 'stroke-amber-600 dark:stroke-amber-400',
    glow: 'shadow-amber-100/30 dark:shadow-none',
  },
  rose: {
    bg: 'bg-gradient-to-br from-rose-50/80 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'border-rose-100/60 dark:border-rose-950/50',
    sparkline: 'stroke-rose-600 dark:stroke-rose-400',
    glow: 'shadow-rose-100/30 dark:shadow-none',
  },
  sky: {
    bg: 'bg-gradient-to-br from-sky-50/80 to-sky-100/50 dark:from-sky-950/20 dark:to-sky-900/10',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    border: 'border-sky-100/60 dark:border-sky-950/50',
    sparkline: 'stroke-sky-600 dark:stroke-sky-400',
    glow: 'shadow-sky-100/30 dark:shadow-none',
  },
  violet: {
    bg: 'bg-gradient-to-br from-violet-50/80 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    border: 'border-violet-100/60 dark:border-violet-950/50',
    sparkline: 'stroke-violet-600 dark:stroke-violet-400',
    glow: 'shadow-violet-100/30 dark:shadow-none',
  },
  slate: {
    bg: 'bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900/20 dark:to-slate-800/10',
    iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    border: 'border-slate-100/60 dark:border-slate-800/50',
    sparkline: 'stroke-slate-500 dark:stroke-slate-400',
    glow: 'shadow-slate-100/30 dark:shadow-none',
  },
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: IconComponent,
  change = 0,
  changeLabel = 'since yesterday',
  variant = 'indigo',
  description,
  id,
}) => {
  const styles = VARIANT_STYLES[variant];

  // Unique pseudo-random mini sparkline curve
  const generateSparklinePoints = () => {
    const isUp = change >= 0;
    const p1 = 20;
    const p2 = isUp ? 14 : 26;
    const p3 = isUp ? 18 : 22;
    const p4 = isUp ? 8 : 32;
    return `5,${p1} 25,${p2} 45,${p3} 65,${p4}`;
  };

  const isPositive = change >= 0;

  return (
    <motion.div
      id={id}
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-5 rounded-3xl border ${styles.bg} ${styles.border} shadow-sm ${styles.glow} backdrop-blur-sm overflow-hidden flex flex-col justify-between h-full`}
    >
      {/* Glow highlight top left */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">
            {title}
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>
        </div>
        <div className={`p-3 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <IconComponent className="h-5.5 w-5.5 stroke-[2]" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-150/40 dark:border-slate-800/30">
        <div className="flex flex-col gap-0.5">
          {change !== 0 ? (
            <div
              className={`flex items-center gap-0.5 text-xs font-black ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="h-4 w-4 stroke-[2.5]" />
              )}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">—</span>
          )}
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            {changeLabel}
          </span>
        </div>

        {/* Dynamic Micro-Sparkline */}
        <div className="w-18 h-8 opacity-75 dark:opacity-60">
          <svg className="w-full h-full" viewBox="0 0 70 40">
            <polyline
              fill="none"
              className={styles.sparkline}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={generateSparklinePoints()}
            />
          </svg>
        </div>
      </div>

      {description && (
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2 block">
          {description}
        </span>
      )}
    </motion.div>
  );
};

export default DashboardCard;
