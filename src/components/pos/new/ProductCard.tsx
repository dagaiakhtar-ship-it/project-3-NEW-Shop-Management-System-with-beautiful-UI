import React from 'react';
import StockBadge from './StockBadge';
import FavoriteButton from './FavoriteButton';
import QuickAddButton from './QuickAddButton';

export interface ProductItem {
  id: string | number;
  name: string;
  barcode?: string;
  category?: string;
  categoryName?: string;
  price?: number;
  sellingPrice?: number;
  unit?: string;
  stock?: number;
  currentStock?: number;
  lowStockThreshold?: number;
  minimumStock?: number;
  image?: string;
}

interface ProductCardProps {
  product: ProductItem;
  onAdd?: (product: ProductItem) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string | number, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  isLoading = false,
  isDisabled = false,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const stock = product.currentStock ?? product.stock ?? 0;
  const sellingPrice = product.sellingPrice ?? product.price ?? 0;
  // If product.price exists and is higher than sellingPrice, we treat it as original price for discount display
  const originalPrice = product.price && product.price > sellingPrice ? product.price : undefined;
  const category = product.categoryName ?? product.category ?? 'General';
  const lowStockThreshold = product.minimumStock ?? product.lowStockThreshold ?? 5;

  const isOutOfStock = stock <= 0;

  // Handle click on the card body to trigger add
  const handleCardClick = () => {
    if (!isOutOfStock && !isDisabled && !isLoading) {
      onAdd?.(product);
    }
  };

  // Prevent event bubbling when clicking buttons
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock && !isDisabled && !isLoading) {
      onAdd?.(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`h-[195px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[14px] p-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:scale-101 transition-all duration-200 flex flex-col justify-between relative text-left select-none group ${
        isOutOfStock ? 'opacity-70 bg-gray-50/50 dark:bg-slate-900/50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      id={`product-card-${product.id}`}
    >
      {/* 1. Top Section: Favorite & Stock Badge */}
      <div className="flex justify-between items-center w-full gap-2 shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
        {onToggleFavorite ? (
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={(e) => onToggleFavorite(product.id, e)}
          />
        ) : (
          <div className="w-6 h-6" /> // spacing placeholder
        )}
        <StockBadge stock={stock} lowStockThreshold={lowStockThreshold} />
      </div>

      {/* 2. Center Section: Lazy Image & Meta Details */}
      <div className="flex gap-2.5 items-center my-1 flex-1 overflow-hidden min-h-0">
        {/* Product Image Box */}
        <div className="h-[80px] w-[80px] rounded-[10px] bg-[#F8FAFC] dark:bg-slate-850 border border-[#F1F5F9] dark:border-slate-800 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-3xs group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors duration-200">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="text-[16px] font-black text-slate-500/20 dark:text-slate-400/20 tracking-wider select-none font-sans">
              {product.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Product Meta Info */}
        <div className="flex flex-col justify-center min-w-0 flex-1 h-full text-left">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-mono truncate">
            {category}
          </span>
          <h3
            className="text-[13px] font-bold text-slate-900 dark:text-slate-150 leading-tight line-clamp-2 mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150"
            title={product.name}
          >
            {product.name}
          </h3>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-none truncate">
              {product.barcode || 'No Barcode'}
            </span>
            <span className="text-[10px] text-[#94A3B8] font-semibold leading-none mt-0.5">
              per {product.unit || 'pcs'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Pricing Details & Quick Add */}
      <div className="flex items-end justify-between gap-2 border-t border-[#F1F5F9] dark:border-slate-800 pt-1.5 shrink-0 z-10">
        <div className="flex flex-col text-left justify-end">
          {originalPrice && (
            <span className="text-[11px] text-[#94A3B8] line-through font-mono leading-none mb-0.5">
              ${originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400 leading-none tracking-tight">
            ${sellingPrice.toFixed(2)}
          </span>
        </div>

        <QuickAddButton
          onClick={handleQuickAdd}
          isLoading={isLoading}
          isDisabled={isOutOfStock || isDisabled}
        />
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
