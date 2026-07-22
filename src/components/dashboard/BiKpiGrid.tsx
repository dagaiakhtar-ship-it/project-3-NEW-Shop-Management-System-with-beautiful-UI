import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Coins, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  AlertTriangle, 
  ShieldCheck, 
  Scale, 
  PackageOpen, 
  Users, 
  Truck, 
  Layers, 
  AlertCircle, 
  XCircle, 
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { type KpiCardData } from '../../utils/biCalculations';

interface BiKpiGridProps {
  kpis: {
    todaySales: KpiCardData;
    todayProfit: KpiCardData;
    todayPurchases: KpiCardData;
    todayExpenses: KpiCardData;
    cashInHand: KpiCardData;
    outstandingCredit: KpiCardData;
    creditRecovered: KpiCardData;
    netProfit: KpiCardData;
    inventoryValue: KpiCardData;
    totalCustomers: KpiCardData;
    totalSuppliers: KpiCardData;
    productsInStock: KpiCardData;
    lowStockProducts: KpiCardData;
    outOfStockProducts: KpiCardData;
    todayInvoices: KpiCardData;
  };
}

export const BiKpiGrid: React.FC<BiKpiGridProps> = ({ kpis }) => {
  
  // Custom definitions for colors, icons, borders
  const cardConfigs = [
    {
      data: kpis.todaySales,
      icon: TrendingUp,
      color: 'border-indigo-600 dark:border-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/5',
      accentColor: 'indigo'
    },
    {
      data: kpis.todayProfit,
      icon: Coins,
      color: 'border-emerald-600 dark:border-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/5',
      accentColor: 'emerald'
    },
    {
      data: kpis.todayPurchases,
      icon: ShoppingBag,
      color: 'border-sky-600 dark:border-sky-500',
      textColor: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/5',
      accentColor: 'sky'
    },
    {
      data: kpis.todayExpenses,
      icon: Receipt,
      color: 'border-rose-600 dark:border-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/5',
      accentColor: 'rose'
    },
    {
      data: kpis.cashInHand,
      icon: Wallet,
      color: 'border-amber-600 dark:border-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/5',
      accentColor: 'amber'
    },
    {
      data: kpis.outstandingCredit,
      icon: AlertTriangle,
      color: 'border-orange-600 dark:border-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/5',
      accentColor: 'orange'
    },
    {
      data: kpis.creditRecovered,
      icon: ShieldCheck,
      color: 'border-violet-600 dark:border-violet-500',
      textColor: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/5',
      accentColor: 'violet'
    },
    {
      data: kpis.netProfit,
      icon: Scale,
      color: 'border-teal-600 dark:border-teal-500',
      textColor: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/5',
      accentColor: 'teal'
    },
    {
      data: kpis.inventoryValue,
      icon: PackageOpen,
      color: 'border-fuchsia-600 dark:border-fuchsia-500',
      textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgColor: 'bg-fuchsia-500/5',
      accentColor: 'fuchsia'
    },
    {
      data: kpis.totalCustomers,
      icon: Users,
      color: 'border-blue-600 dark:border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/5',
      accentColor: 'blue'
    },
    {
      data: kpis.totalSuppliers,
      icon: Truck,
      color: 'border-cyan-600 dark:border-cyan-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/5',
      accentColor: 'cyan'
    },
    {
      data: kpis.productsInStock,
      icon: Layers,
      color: 'border-green-600 dark:border-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/5',
      accentColor: 'green'
    },
    {
      data: kpis.lowStockProducts,
      icon: AlertCircle,
      color: 'border-yellow-600 dark:border-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/5',
      accentColor: 'yellow'
    },
    {
      data: kpis.outOfStockProducts,
      icon: XCircle,
      color: 'border-red-600 dark:border-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/5',
      accentColor: 'red'
    },
    {
      data: kpis.todayInvoices,
      icon: FileText,
      color: 'border-slate-600 dark:border-slate-500',
      textColor: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-500/5',
      accentColor: 'slate'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
      {cardConfigs.map((cfg, idx) => {
        const IconComponent = cfg.icon;
        const trend = cfg.data.change;
        const hasTrend = trend !== 0 && trend !== undefined && !isNaN(trend);

        return (
          <motion.div
            key={cfg.data.title}
            id={`bi-kpi-card-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            whileHover={{ y: -2 }}
            className={`bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between border-l-4 ${cfg.color} transition-all duration-200 text-left`}
          >
            {/* Ambient background decoration */}
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none opacity-40 ${cfg.bgColor}`} />

            <div className="flex items-start justify-between w-full mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 leading-tight">
                {cfg.data.title}
              </span>
              <div className={`p-1.5 rounded-lg ${cfg.bgColor} ${cfg.textColor}`}>
                <IconComponent className="h-4 w-4 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex flex-col gap-1 z-10">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {cfg.data.value}
              </h3>

              {/* Trend block */}
              {hasTrend ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] font-black flex items-center ${trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {trend > 0 ? (
                      <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
                    )}
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tight leading-none">
                    {cfg.data.changeLabel}
                  </span>
                </div>
              ) : (
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tight leading-none mt-1">
                  {cfg.data.changeLabel}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BiKpiGrid;
