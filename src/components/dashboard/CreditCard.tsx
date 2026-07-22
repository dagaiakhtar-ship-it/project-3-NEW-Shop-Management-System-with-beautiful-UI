import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { useCreditSummary } from '../../hooks/useCreditSummary';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

export const CreditCard: React.FC = () => {
  const { creditSummary, isLoading, error } = useCreditSummary();
  const navigate = useNavigate();

  const getStatusBadge = (status: 'Good' | 'Warning' | 'Exceeded') => {
    switch (status) {
      case 'Good':
        return <Badge variant="success">Good</Badge>;
      case 'Warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'Exceeded':
        return <Badge variant="danger">Over Limit</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const visibleSummary = creditSummary.slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <Landmark className="h-4.5 w-4.5 text-indigo-500/80 dark:text-indigo-400" />
            Customer Credit Tracking
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Debtors carrying active ledger balances.
          </p>
        </div>
        {creditSummary.length > 0 && (
          <Badge variant="indigo">{creditSummary.length} debtor{creditSummary.length > 1 ? 's' : ''}</Badge>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              Loading ledger data...
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Failed to load credit summary</p>
          </div>
        ) : creditSummary.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                Zero Outstanding Receivables
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-xs leading-normal">
                No customer balance reports show outstanding debt. All ledger records cleared!
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {visibleSummary.map((item) => {
              const usagePercent = (item.outstandingBalance / (item.creditLimit || 1)) * 100;

              return (
                <div key={item.customerId} className="flex flex-col gap-1.5 text-left pb-3.5 border-b border-slate-50 dark:border-slate-800/45 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-850 dark:text-slate-200">
                        {item.customerName}
                      </span>
                      {item.lastPaymentAmount && item.lastPaymentDate ? (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                          Last Pay: {formatCurrency(item.lastPaymentAmount)} ({formatDate(item.lastPaymentDate)})
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-rose-500/80 dark:text-rose-400/80 mt-0.5">
                          No payments recorded yet
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.outstandingBalance)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Limit utilization percentage meter */}
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === 'Exceeded'
                            ? 'bg-rose-500'
                            : item.status === 'Warning'
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, usagePercent)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      Limit: {formatCurrency(item.creditLimit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {creditSummary.length > 5 && (
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center justify-center gap-1.5 mt-4 py-2 w-full rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-850/60 dark:hover:bg-indigo-950/20 dark:text-slate-300 dark:hover:text-indigo-400 transition-all text-xs font-bold border border-slate-150/40 dark:border-slate-800/40 cursor-pointer"
          >
            <span>Show all {creditSummary.length} outstanding accounts</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CreditCard;
