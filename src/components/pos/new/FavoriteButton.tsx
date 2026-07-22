import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      className={`p-1.5 rounded-lg bg-white/90 border border-[#E5E7EB] shadow-3xs flex items-center justify-center cursor-pointer transition-colors ${
        isFavorite
          ? 'text-[#EF4444] border-[#EF4444]/20 bg-red-50/50'
          : 'text-[#6B7280] hover:text-[#EF4444]'
      } ${className}`}
      id="pos-favorite-button-reusable"
    >
      <Heart
        className={`h-4.5 w-4.5 transition-colors ${
          isFavorite ? 'fill-current' : ''
        }`}
      />
    </motion.button>
  );
};

export default React.memo(FavoriteButton);
