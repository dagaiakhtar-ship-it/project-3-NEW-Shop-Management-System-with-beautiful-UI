import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  CalendarDays, 
  Crown, 
  CreditCard 
} from 'lucide-react';

interface BiInsightsProps {
  insights: {
    highestSellingProduct: string;
    highestProfitProduct: string;
    highestExpenseCategory: string;
    averageSaleValue: string;
    averageDailyProfit: string;
    bestSalesDay: string;
    bestCustomer: string;
    mostUsedPaymentMethod: string;
  };
}

export const BiInsights: React.FC<BiInsightsProps> = ({ insights }) => {
  const list = [
    {
      title: 'Highest Selling Product',
      desc: 'Top item by sold unit counts',
      val: insights.highestSellingProduct,
      icon: Flame,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-950/20'
    },
    {
      title: 'Highest Profit Margin Product',
      desc: 'Top absolute margin driver',
      val: insights.highestProfitProduct,
      icon: Crown,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/20'
    },
    {
      title: 'Highest Expense Category',
      desc: 'Operating capital sinkhole',
      val: insights.highestExpenseCategory,
      icon: Percent,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/20'
    },
    {
      title: 'Average Transaction Size',
      desc: 'Receipt cart valuation mean',
      val: insights.averageSaleValue,
      icon: DollarSign,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950/20'
    },
    {
      title: 'Average Daily Profit margin',
      desc: 'Normalized period-level gain',
      val: insights.averageDailyProfit,
      icon: TrendingUp,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-950/20'
    },
    {
      title: 'Best Performing Day',
      desc: 'Day of week with maximum sales',
      val: insights.bestSalesDay,
      icon: CalendarDays,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950/20'
    },
    {
      title: 'Store VIP Patron Customer',
      desc: 'Top spending patron account',
      val: insights.bestCustomer,
      icon: Crown,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-950/20'
    },
    {
      title: 'Favored Checkout Option',
      desc: 'Most recurring receipt payment',
      val: insights.mostUsedPaymentMethod,
      icon: CreditCard,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-950/20'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-left">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Sparkles className="h-4.5 w-4.5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 tracking-tight uppercase">
            Small Business Insights Feed
          </h4>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Automated intelligence parsed from store inventory catalogs, invoices, and expenses ledger
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {list.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/55 flex items-start gap-3 text-left"
            >
              <div className={`p-2 rounded-xl border shrink-0 ${item.color}`}>
                <IconComponent className="h-4.5 w-4.5 stroke-[2]" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {item.title}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-150 truncate block tracking-tight">
                  {item.val}
                </span>
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                  {item.desc}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BiInsights;
