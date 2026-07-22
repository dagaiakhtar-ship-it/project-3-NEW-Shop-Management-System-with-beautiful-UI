import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Plus, AlertTriangle, Star, Check } from 'lucide-react';
import { type Product } from '../../database/db';

interface POSProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<POSProductCardProps> = ({
  product,
  onAdd,
}) => {
  const stock = product.currentStock ?? product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= (product.minimumStock ?? 5);

  // Quick favorite toggle (stored locally per browser session for simplicity)
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = localStorage.getItem('pos_favorites');
      return favs ? JSON.parse(favs).includes(product.id) : false;
    } catch {
      return false;
    }
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const favsStr = localStorage.getItem('pos_favorites');
      const favs = favsStr ? JSON.parse(favsStr) : [];
      let updatedFavs;
      if (isFavorite) {
        updatedFavs = favs.filter((id: number) => id !== product.id);
      } else {
        updatedFavs = [...favs, product.id];
      }
      localStorage.setItem('pos_favorites', JSON.stringify(updatedFavs));
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      onClick={() => !isOutOfStock && onAdd(product)}
      id={`pos-prod-${product.id}`}
      whileHover={isOutOfStock ? {} : { y: -4, scale: 1.02 }}
      whileTap={isOutOfStock ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative flex flex-col justify-between p-4 pos-card rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 select-none ${
        isOutOfStock
          ? 'opacity-60 cursor-not-allowed border-slate-200/60 dark:border-slate-800/40'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-md hover:shadow-indigo-500/[0.04] cursor-pointer'
      }`}
    >
      {/* Upper Section: Images, Badges, and Star */}
      <div className="w-full">
        {/* Visual Container */}
        <div className="relative h-32 w-full rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/50 overflow-hidden flex items-center justify-center mb-3 shadow-2xs">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-700">
              <Package className="h-8 w-8 stroke-[1.5]" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-mono">No Image</span>
            </div>
          )}

          {/* Quick Favorite Overlay */}
          {!isOutOfStock && (
            <button
              onClick={toggleFavorite}
              className={`absolute top-2 left-2 p-1.5 rounded-lg border backdrop-blur-md transition-all duration-150 cursor-pointer ${
                isFavorite
                  ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:scale-105'
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Stock Badges overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900/30">
                Void
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-55 text-amber-900 border border-amber-300/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/40 animate-pulse flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {stock} Left
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 font-mono">
                Qty: {stock}
              </span>
            )}
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="pos-small-text text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 font-mono uppercase truncate max-w-[90px]">
            {product.brand || 'Local'}
          </span>
          {product.categoryName && (
            <span className="pos-small-text text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">
              {product.categoryName}
            </span>
          )}
        </div>

        <h4 className="pos-normal-text text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug line-clamp-2 h-9 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors">
          {product.name}
        </h4>

        <div className="flex items-center justify-between mt-1 pos-small-text text-[10px] font-medium text-slate-450 dark:text-slate-500 font-mono uppercase tracking-wider">
          <span>SKU: {product.sku || 'N/A'}</span>
          {product.unit && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black font-sans tracking-normal normal-case">
              {product.unit}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Area: Pricing & Actions */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/50 w-full">
        <div className="flex flex-col text-left">
          <span className="pos-small-text text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</span>
          <span className="pos-price text-[15.5px] font-black text-slate-900 dark:text-white font-mono leading-none mt-0.5">
            ${(product.sellingPrice ?? product.price ?? 0).toFixed(2)}
          </span>
        </div>

        {isOutOfStock ? (
          <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-850 text-slate-400 rounded-md">
            Sold Out
          </div>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-150 shadow-2xs">
            <Plus className="h-4 w-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
