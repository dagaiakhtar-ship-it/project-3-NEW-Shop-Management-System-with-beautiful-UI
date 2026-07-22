import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickAddButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  onClick,
  isLoading = false,
  isDisabled = false,
}) => {
  return (
    <motion.button
      type="button"
      disabled={isDisabled || isLoading}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`h-[36px] px-3 rounded-[8px] flex items-center justify-center gap-1 transition-all duration-150 font-bold text-[12px] border cursor-pointer ${
        isDisabled
          ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs hover:shadow-md dark:bg-indigo-600 dark:hover:bg-indigo-700'
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Plus className="h-4.5 w-4.5 font-black" />
          <span>Add</span>
        </>
      )}
    </motion.button>
  );
};

export default React.memo(QuickAddButton);
