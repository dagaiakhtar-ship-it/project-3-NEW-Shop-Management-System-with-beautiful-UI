import React from 'react';

interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
  isDiscontinued?: boolean;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  lowStockThreshold = 5,
  isDiscontinued = false,
}) => {
  let badgeColor = 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
  let badgeLabel = 'In Stock';

  if (isDiscontinued) {
    badgeColor = 'bg-gray-100 text-gray-500 border-gray-200';
    badgeLabel = 'Discontinued';
  } else if (stock <= 0) {
    badgeColor = 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 animate-pulse';
    badgeLabel = 'Out of Stock';
  } else if (stock <= lowStockThreshold) {
    badgeColor = 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
    badgeLabel = 'Low Stock';
  } else {
    // Green / In Stock
    badgeColor = 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
    badgeLabel = 'In Stock';
  }

  return (
    <span
      className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border tracking-wide uppercase select-none ${badgeColor}`}
    >
      {badgeLabel} ({stock})
    </span>
  );
};

export default React.memo(StockBadge);
