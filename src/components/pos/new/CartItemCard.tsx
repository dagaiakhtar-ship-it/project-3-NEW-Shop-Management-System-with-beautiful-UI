import React, { useState } from 'react';
import { Trash2, Settings2, Tag, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuantityControl from './QuantityControl';
import { type CartItem } from '../../../hooks/useCart';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, qty: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onUpdateTax: (productId: number, tax: number) => void;
  onRemove: (productId: number) => void;
  isDisabled?: boolean;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateTax,
  onRemove,
  isDisabled = false,
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);

  const stock = item.stock ?? item.currentStock ?? 999;
  const itemSubtotal = item.quantity * item.sellingPrice;
  const hasAdjustments = (item.discount || 0) > 0 || (item.tax || 0) > 0;

  return (
    <div className="flex flex-col w-full" id={`cart-item-wrapper-${item.productId}`}>
      {/* Premium Cart Item Card */}
      <motion.div
        layout
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="h-[78px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] p-2.5 flex items-center justify-between gap-2.5 shadow-3xs hover:shadow-xs transition-shadow relative overflow-hidden select-none"
        id={`cart-item-card-${item.productId}`}
      >
        {/* 1. LEFT - Product Image Block */}
        <div className="h-12 w-12 rounded-[8px] bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.productName || item.sku || ''}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="text-[12px] font-black text-slate-400/35 font-sans tracking-wide">
              {(String(item.productName || item.sku || '').substring(0, 2)).toUpperCase()}
            </div>
          )}
        </div>

        {/* 2. CENTER - Meta Details (Name, Barcode, Unit, Price) */}
        <div className="flex-1 flex flex-col justify-center min-w-0 text-left h-full">
          <h4
            className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-1 truncate"
            title={item.productName}
          >
            {item.productName}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
            <span className="font-mono truncate">{item.barcode || 'No Barcode'}</span>
            <span className="text-gray-300">•</span>
            <span className="truncate">per {item.unit || 'pcs'}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 font-mono leading-none">
              ${item.sellingPrice.toFixed(2)}
            </span>
            {hasAdjustments && (
              <span className="inline-block h-1.5 w-1.5 bg-[#EF4444] rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* 3. RIGHT - Controls (Quantity Adjustment & Delete/Adjust & Subtotal) */}
        <div className="flex items-center gap-2.5 shrink-0 h-full">
          {/* Controls Substack */}
          <div className="flex flex-col items-end justify-between h-full py-0.5">
            {/* Quantity Control Row */}
            <QuantityControl
              quantity={item.quantity}
              onIncrease={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              onDecrease={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              isDisabled={isDisabled}
            />

            {/* Subtotal Display (Below quantity) */}
            <span className="text-[12.5px] font-semibold text-[#22C55E] font-mono leading-none">
              ${itemSubtotal.toFixed(2)}
            </span>
          </div>

          {/* Action column (Adjust and Remove) */}
          <div className="flex flex-col items-center justify-between h-full py-0.5">
            {/* Adjustments cog */}
            <button
              type="button"
              onClick={() => setShowAdjustments(!showAdjustments)}
              className={`p-1 rounded-md transition-colors cursor-pointer border ${
                showAdjustments
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
              }`}
              title="Adjust Item Discount/Tax"
            >
              <Settings2 className="h-3 w-3" />
            </button>

            {/* Trash Bin / Delete button with interactive vibration animations */}
            <motion.button
              type="button"
              onClick={() => onRemove(item.productId)}
              whileHover={{ rotate: [0, -6, 6, -6, 6, 0], scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all cursor-pointer"
              title="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Expandable Adjustments Drawers (Inline editing discount / tax) */}
      <AnimatePresence>
        {showAdjustments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden bg-slate-50 dark:bg-slate-850 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-[14px] -mt-1 mx-2"
          >
            <div className="p-3 grid grid-cols-2 gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {/* Discount field */}
              <div className="flex flex-col gap-1 text-left">
                <span className="flex items-center gap-0.5 uppercase tracking-wider font-bold">
                  <Tag className="h-3 w-3 text-[#EF4444]" />
                  Discount ($)
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.discount || ''}
                  onChange={(e) =>
                    onUpdateDiscount(
                      item.productId,
                      Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  placeholder="0.00"
                  className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[12px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>

              {/* Tax Rate Field */}
              <div className="flex flex-col gap-1 text-left">
                <span className="flex items-center gap-0.5 uppercase tracking-wider font-bold">
                  <Percent className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  Tax Rate (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.tax || ''}
                  onChange={(e) =>
                    onUpdateTax(
                      item.productId,
                      Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                    )
                  }
                  placeholder="0%"
                  className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-[12px] font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(CartItemCard);
