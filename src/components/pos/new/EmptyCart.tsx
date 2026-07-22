import React from 'react';
import { ShoppingCart, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyCartProps {
  onBrowse?: () => void;
}

export const EmptyCart: React.FC<EmptyCartProps> = ({ onBrowse }) => {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center select-none"
      id="pos-shopping-cart-empty-state"
    >
      {/* Premium Animated Shopping Cart Icon container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="h-20 w-20 rounded-full bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 dark:border-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 shadow-3xs relative"
      >
        <ShoppingCart className="h-9 w-9 stroke-[1.5]" />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-3xs"
        >
          0
        </motion.span>
      </motion.div>

      {/* Texts */}
      <h3 className="text-[16px] font-black text-slate-900 dark:text-slate-100 tracking-tight">
        Shopping Cart is Empty
      </h3>
      <p className="text-[13px] text-slate-500 dark:text-slate-450 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
        Search and add products to start billing. Click on the catalog categories or items.
      </p>

      {/* Browse button */}
      {onBrowse && (
        <motion.button
          type="button"
          onClick={onBrowse}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 h-[44px] px-5 bg-indigo-600/10 dark:bg-indigo-400/10 hover:bg-indigo-600/15 dark:hover:bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold text-[13.5px] rounded-xl flex items-center gap-2 transition-all duration-150 cursor-pointer border border-indigo-600/15 dark:border-indigo-400/15"
          id="empty-cart-browse-btn"
        >
          <Compass className="h-4.5 w-4.5 stroke-[2.2]" />
          <span>Browse Products</span>
        </motion.button>
      )}
    </div>
  );
};

export default React.memo(EmptyCart);
