import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, List, LayoutGrid } from 'lucide-react';
import { db } from '../../../database/db';
import ProductCard, { ProductItem } from './ProductCard';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

interface ProductGridProps {
  searchQuery?: string;
  activeCategoryId?: string | number;
  onAddProduct?: (product: ProductItem) => void;
  refreshTrigger?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  searchQuery = '',
  activeCategoryId = 'All',
  onAddProduct,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [browseFavoritesOnly, setBrowseFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Stagger variants for motion animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 450, damping: 30 } },
  };

  // High density lists can fit more rows on a single POS screen
  const pageSize = viewMode === 'list' ? 14 : 12;

  // Fetch active products from IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const activeProducts = await db.products.where('status').equals('Active').toArray();
        const categories = await db.categories.toArray();
        const catMap = new Map(categories.map((c) => [c.id, c.name]));

        // Map dynamic IndexedDB product fields to ProductItem structure
        const mapped: ProductItem[] = activeProducts.map((p) => {
          const resolvedCatName = catMap.get(p.categoryId) || 'General';
          return {
            id: p.id!,
            name: p.name,
            barcode: p.barcode,
            category: resolvedCatName,
            categoryName: resolvedCatName,
            price: p.sellingPrice ?? p.price ?? 0,
            sellingPrice: p.sellingPrice ?? p.price ?? 0,
            unit: p.unit || 'pcs',
            stock: p.currentStock ?? p.stock ?? 0,
            currentStock: p.currentStock ?? p.stock ?? 0,
            lowStockThreshold: p.minimumStock ?? 5,
            minimumStock: p.minimumStock ?? 5,
            image: p.image,
          };
        });
        setProducts(mapped);
      } catch (err) {
        console.error('Failed to load active products for POS grid:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [refreshTrigger]);

  // Load favorites list from localStorage
  const favoriteIds = useMemo(() => {
    try {
      const favs = localStorage.getItem('pos_favorites');
      return favs ? JSON.parse(favs) : [];
    } catch {
      return [];
    }
  }, [products, refreshTrigger]);

  // Toggle favorite ID in localStorage
  const handleToggleFavorite = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const favs = localStorage.getItem('pos_favorites');
      let favList: (string | number)[] = favs ? JSON.parse(favs) : [];
      if (favList.includes(id)) {
        favList = favList.filter((item) => item !== id);
      } else {
        favList.push(id);
      }
      localStorage.setItem('pos_favorites', JSON.stringify(favList));
      // Trigger a local state/render re-evaluation by using the reload trigger trick
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Listen to cross-component localStorage changes to keep Favorites up-to-date
  const [storageTrigger, setStorageTrigger] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => setStorageTrigger((prev) => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const memoizedFavoriteIds = useMemo(() => {
    return favoriteIds;
  }, [favoriteIds, storageTrigger]);

  // Filter products in memory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Favorites tab filter
      if (browseFavoritesOnly && !memoizedFavoriteIds.includes(p.id)) {
        return false;
      }
      // 2. Filter by Category
      if (activeCategoryId !== 'All' && p.categoryName !== activeCategoryId && p.category !== activeCategoryId) {
        return false;
      }
      // 3. Filter by search string
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const nameMatches = p.name.toLowerCase().includes(q);
        const barcodeMatches = (p.barcode || '').toLowerCase().includes(q);
        const categoryMatches = (p.categoryName || '').toLowerCase().includes(q);
        return nameMatches || barcodeMatches || categoryMatches;
      }
      return true;
    });
  }, [products, searchQuery, activeCategoryId, browseFavoritesOnly, memoizedFavoriteIds]);

  // Reset page when filter configurations change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategoryId, browseFavoritesOnly, viewMode]);

  // Pagination bounds
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  return (
    <div className="flex flex-col gap-4 w-full text-left" id="pos-product-grid-root">
      {/* 1. Sub-Header Toolbar (Favorites Tab and Layout Toggle) */}
      <div className="flex items-center justify-between gap-4" id="pos-product-grid-toolbar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBrowseFavoritesOnly(false)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
              !browseFavoritesOnly
                ? 'bg-indigo-600/10 dark:bg-indigo-400/10 border-indigo-600/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-105'
            }`}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={() => setBrowseFavoritesOnly(true)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
              browseFavoritesOnly
                ? 'bg-amber-600/10 dark:bg-amber-400/10 border-amber-600/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-105'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${browseFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </button>
        </div>

        {/* Layout Modes and Product Counter */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {totalItems} Items
          </span>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Loading State */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} count={pageSize} />
      ) : filteredProducts.length === 0 ? (
        /* 3. Empty State */
        <EmptyState
          title={browseFavoritesOnly ? 'No Favorite Products' : 'No Products Found'}
          description={
            browseFavoritesOnly
              ? "You don't have any products marked as favorites yet. Star them inside the grid!"
              : `We couldn't find any products matching "${searchQuery}" under the selected category.`
          }
        />
      ) : viewMode === 'list' ? (
        /* 4. Compact Row List View */
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[14px] overflow-hidden shadow-xs">
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-850 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono select-none">
            <div className="col-span-1">Fav</div>
            <div className="col-span-6 text-left">Product Details</div>
            <div className="col-span-2 text-left">Barcode</div>
            <div className="col-span-1.5 text-right">Stock</div>
            <div className="col-span-1.5 text-right">Price</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedProducts.map((p) => {
              const isFav = memoizedFavoriteIds.includes(p.id);
              const isOutOfStock = p.stock! <= 0;
              const isLowStock = p.stock! > 0 && p.stock! <= p.lowStockThreshold!;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddProduct?.(p)}
                  className={`grid grid-cols-12 gap-3 px-4 py-2 text-[14px] items-center transition-colors group select-none ${
                    isOutOfStock
                      ? 'opacity-60 bg-gray-50/50 dark:bg-slate-900/50 cursor-not-allowed'
                      : 'hover:bg-indigo-600/5 dark:hover:bg-indigo-400/5 cursor-pointer'
                  }`}
                >
                  {/* Favorite Selector Button */}
                  <div className="col-span-1 text-left">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(p.id, e)}
                      className="p-1 rounded-lg text-gray-300 hover:text-[#F59E0B] transition-colors"
                    >
                      <Star className={`h-4 w-4 ${isFav ? 'fill-[#F59E0B] text-[#F59E0B]' : ''}`} />
                    </button>
                  </div>

                  {/* Product Details info */}
                  <div className="col-span-6 text-left truncate min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-750">
                        {p.category || 'General'}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  {/* Barcode / SKU code */}
                  <div className="col-span-2 text-left font-mono text-[12px] text-slate-500 dark:text-slate-400 truncate">
                    {p.barcode || 'No SKU'}
                  </div>

                  {/* Stock Counter */}
                  <div className="col-span-1.5 text-right font-mono text-[13px] font-bold">
                    {isOutOfStock ? (
                      <span className="text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-[#EF4444]/20">Out</span>
                    ) : isLowStock ? (
                      <span className="text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded text-[11px] font-black animate-pulse border border-[#F59E0B]/20">
                        {p.stock}
                      </span>
                    ) : (
                      <span className="text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">{p.stock}</span>
                    )}
                  </div>

                  {/* Price info */}
                  <div className="col-span-1.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                    ${p.price?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 5. Elegant Grid of Product Cards view */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full"
        >
          <AnimatePresence mode="popLayout">
            {paginatedProducts.map((p) => {
              const isFav = memoizedFavoriteIds.includes(p.id);
              return (
                <motion.div key={p.id} variants={cardVariants} layout>
                  <ProductCard
                    product={p}
                    onAdd={onAddProduct}
                    isFavorite={isFav}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 6. Dynamic Pagination Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-[14px] shadow-2xs mt-1">
          <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100 font-mono px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductGrid);
