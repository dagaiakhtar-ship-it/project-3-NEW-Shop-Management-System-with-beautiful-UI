import React, { useState, useEffect } from 'react';
import { User, ShieldAlert, ArrowUpRight, CheckCircle2, RefreshCw, Star, Ban } from 'lucide-react';
import { getCustomerCreditProfile } from '../../database/creditHelper';

interface CustomerCreditProfileProps {
  customerId: number;
  onRefreshTrigger?: number;
}

export const CustomerCreditProfile: React.FC<CustomerCreditProfileProps> = ({
  customerId,
  onRefreshTrigger = 0,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getCustomerCreditProfile(customerId)
      .then((res) => {
        if (active) setProfile(res);
      })
      .catch((err) => {
        console.error('Failed to load customer credit profile:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customerId, onRefreshTrigger]);

  if (isLoading || !profile) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-6 text-center text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-2" />
        <span className="text-[10px] font-black uppercase tracking-wider">Recalculating Credit Profile...</span>
      </div>
    );
  }

  const {
    customer,
    creditLimit,
    currentBalance,
    remainingLimit,
    totalInvoicesCount,
    paidInvoicesCount,
    partialInvoicesCount,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    totalCreditGiven,
    totalCreditRecovered,
  } = profile;

  // Compute balance percentage used
  const limitUsedPct = creditLimit > 0 ? Math.min(100, (currentBalance / creditLimit) * 100) : 0;

  // Determine credit "trust score" label based on history and overdue count
  let trustRating = 'Standard';
  let trustClass = 'text-amber-500 dark:text-amber-400';
  
  if (overdueInvoicesCount > 0) {
    trustRating = 'High Risk';
    trustClass = 'text-rose-500 dark:text-rose-400 animate-pulse';
  } else if (paidInvoicesCount >= 5 && currentBalance < creditLimit * 0.4) {
    trustRating = 'Excellent Star';
    trustClass = 'text-emerald-500 dark:text-emerald-400';
  } else if (paidInvoicesCount >= 2) {
    trustRating = 'Good Standing';
    trustClass = 'text-indigo-500 dark:text-indigo-400';
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-xs">
      
      {/* Profile Header */}
      <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-900 pb-3">
        <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
            {customer.fullName}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Credit Limit: ${creditLimit.toFixed(2)} | Overdraft Safeguards Enabled
          </p>
        </div>
      </div>

      {/* Credit limit visual gauge */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span>Credit limit Utilized</span>
          <span>{limitUsedPct.toFixed(1)}% ({currentBalance.toFixed(2)} / {creditLimit.toFixed(2)})</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              limitUsedPct > 85 ? 'bg-rose-500' : limitUsedPct > 50 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${limitUsedPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
          <span>Available buffer: ${remainingLimit.toFixed(2)}</span>
          {limitUsedPct > 85 && (
            <span className="text-rose-500 font-black animate-pulse">Critical utilization limit reached!</span>
          )}
        </div>
      </div>

      {/* Trust Rating & Alerts */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Trust rating</span>
          <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1 ${trustClass}`}>
            <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
            {trustRating}
          </span>
        </div>

        {overdueInvoicesCount > 0 ? (
          <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            {overdueInvoicesCount} Overdue Bills
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Account Is Clean
          </div>
        )}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 gap-3 mt-1.5">
        <div className="p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Borrowed</span>
          <span className="text-xs font-black font-mono text-rose-500 leading-tight">
            ${totalCreditGiven.toFixed(2)}
          </span>
          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
            OVER {totalInvoicesCount} TOTAL INVOICES
          </span>
        </div>

        <div className="p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col gap-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Recovered</span>
          <span className="text-xs font-black font-mono text-emerald-500 leading-tight">
            ${totalCreditRecovered.toFixed(2)}
          </span>
          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
            SETTLED {paidInvoicesCount} BILLS FULLY
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreditProfile;
