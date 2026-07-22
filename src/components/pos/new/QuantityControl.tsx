import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isDisabled?: boolean;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  isDisabled = false,
}) => {
  return (
    <div
      className="flex items-center bg-[#F5F7FA] dark:bg-slate-950 rounded-[10px] border border-[#E5E7EB] dark:border-slate-800 p-0.5 shadow-3xs"
      id="pos-quantity-control"
    >
      {/* Minus Button */}
      <motion.button
        type="button"
        disabled={quantity <= 1 || isDisabled}
        onClick={onDecrease}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-[#6B7280] dark:text-slate-450 ${
          quantity <= 1 || isDisabled
            ? 'opacity-40 cursor-not-allowed bg-transparent'
            : 'hover:bg-white dark:hover:bg-slate-800 hover:text-[#111827] dark:hover:text-white hover:shadow-3xs'
        }`}
        id="quantity-decrease-btn"
      >
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
      </motion.button>

      {/* Quantity Display */}
      <span className="text-[13px] font-extrabold text-[#111827] dark:text-white w-8 text-center font-mono select-none">
        {quantity}
      </span>

      {/* Plus Button */}
      <motion.button
        type="button"
        disabled={isDisabled}
        onClick={onIncrease}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-[#6B7280] dark:text-slate-450 ${
          isDisabled
            ? 'opacity-40 cursor-not-allowed bg-transparent'
            : 'hover:bg-white dark:hover:bg-slate-800 hover:text-[#2563EB] dark:hover:text-indigo-400 hover:shadow-3xs'
        }`}
        id="quantity-increase-btn"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      </motion.button>
    </div>
  );
};

export default React.memo(QuantityControl);
