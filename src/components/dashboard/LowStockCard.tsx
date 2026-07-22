import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { useLowStock } from '../../hooks/useLowStock';
import Badge from '../ui/Badge';

export const LowStockCard: React.FC = () => {
  const { products, isLoading, error } = useLowStock();
  const navigate = useNavigate();

  // Calculate ratio and status badge
  const getStockBadge = (stock: number, alertQty: number) => {
    if (stock === 0) {
      return <Badge variant="danger">Out of Stock</Badge>;
    }
    return <Badge variant="warning">Low Stock</Badge>;
  };

  const visibleProducts = products.slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            Low Stock Alerts
          </h3>
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
            Products requiring immediate restocking action.
          </p>
        </div>
        {products.length > 0 && (
          <Badge variant="danger">{products.length} alert{products.length > 1 ? 's' : ''}</Badge>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">
              Analyzing inventory...
            </span>
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Failed to load stock alerts</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ShieldCheck className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                All Stock Levels Secure
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-xs leading-normal">
                No products are currently reporting below alert quantities. Excellent.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 pt-2">
            {visibleProducts.map((p) => {
              const percentage = Math.min(100, Math.max(0, (p.stock / (p.alertQuantity || 1)) * 100));
              const isOutOfStock = p.stock === 0;

              return (
                <div key={p.id} className="flex flex-col gap-1.5 text-left pb-3 border-b border-slate-50 dark:border-slate-800/45 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                        SKU: {p.sku} • {p.categoryName}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      {getStockBadge(p.stock, p.alertQuantity)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    {/* Linear Indicator Bar */}
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOutOfStock 
                            ? 'w-0' 
                            : percentage <= 30
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${isOutOfStock ? 0 : Math.max(5, percentage)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <strong className={isOutOfStock ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>{p.stock}</strong> / {p.alertQuantity} alert threshold
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 5 && (
          <button
            onClick={() => navigate('/products')}
            className="flex items-center justify-center gap-1.5 mt-4 py-2 w-full rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-850/60 dark:hover:bg-indigo-950/20 dark:text-slate-300 dark:hover:text-indigo-400 transition-all text-xs font-bold border border-slate-150/40 dark:border-slate-800/40 cursor-pointer"
          >
            <span>Show all {products.length} low stock items</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LowStockCard;
