import React from 'react';
import { Users, UserCheck, DollarSign, Wallet } from 'lucide-react';
import Card from '../ui/Card';

interface FinancialSummaryProps {
  totalCount: number;
  activeCount: number;
  totalOpeningBalance: number;
  totalCurrentBalance: number;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryProps> = ({
  totalCount,
  activeCount,
  totalOpeningBalance,
  totalCurrentBalance,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Suppliers */}
      <Card className="flex items-center gap-4 p-4 border border-slate-150/50 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <Users className="h-6 w-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
            Total Suppliers
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount}
          </span>
        </div>
      </Card>

      {/* Active Suppliers */}
      <Card className="flex items-center gap-4 p-4 border border-slate-150/50 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <UserCheck className="h-6 w-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
            Active Vendors
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {activeCount}
          </span>
        </div>
      </Card>

      {/* Total Opening Balance */}
      <Card className="flex items-center gap-4 p-4 border border-slate-150/50 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <DollarSign className="h-6 w-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
            Opening Balances
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalOpeningBalance)}
          </span>
        </div>
      </Card>

      {/* Total Outstanding Balance */}
      <Card className="flex items-center gap-4 p-4 border border-slate-150/50 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-650 dark:text-rose-450">
          <Wallet className="h-6 w-6" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
            Outstanding Balances
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalCurrentBalance)}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default FinancialSummaryCard;
