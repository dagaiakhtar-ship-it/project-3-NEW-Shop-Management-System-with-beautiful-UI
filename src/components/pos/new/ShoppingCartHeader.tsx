import React from 'react';
import { ShoppingCart, Trash2, RotateCw } from 'lucide-react';
import { motion } from 'motion/react';

export interface ShoppingCartHeaderProps {
  totalItemCount: number;
  onClear: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const ShoppingCartHeader: React.FC<ShoppingCartHeaderProps> = ({
  totalItemCount,
  onClear,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-3.5" id="pos-shopping-cart-header">
      <div className="flex items-center justify-between">
        {/* Shopping Cart Icon, Title, Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#2563EB]/10 rounded-xl border border-[#2563EB]/20 text-[#2563EB] shadow-3xs">
            <ShoppingCart className="h-[20px] w-[20px] stroke-[2.5]" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-[18px] font-black text-[#111827] dark:text-white tracking-tight leading-none">
              POS Shopping Cart
            </h2>
            <span className="text-[12px] text-[#6B7280] dark:text-slate-400 font-semibold mt-1">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} Selected
            </span>
          </div>
        </div>

        {/* Header Actions: Refresh & Clear */}
        <div className="flex items-center gap-1.5">
          {/* Refresh Button */}
          {onRefresh && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-[#6B7280] dark:text-slate-400 hover:text-[#2563EB] bg-white dark:bg-slate-900 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-slate-800 rounded-xl transition-all duration-150 cursor-pointer shadow-3xs"
              title="Refresh Cart"
              id="shopping-cart-refresh-btn"
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </motion.button>
          )}

          {/* Clear Cart Button */}
          {totalItemCount > 0 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClear}
              className="px-3.5 h-[38px] bg-[#EF4444]/10 hover:bg-[#EF4444]/15 border border-[#EF4444]/20 hover:border-[#EF4444]/30 text-[#EF4444] font-extrabold text-[12.5px] rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-3xs"
              title="Clear all cart items"
              id="shopping-cart-clear-btn"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Cart</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Professional Divider */}
      <div className="h-[1px] w-full bg-linear-to-r from-transparent via-[#E5E7EB] dark:via-slate-800 to-transparent" />
    </div>
  );
};

export default React.memo(ShoppingCartHeader);
