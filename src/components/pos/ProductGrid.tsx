import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Inbox, Star, List, LayoutGrid, Plus, AlertTriangle } from 'lucide-react';
import { db, type Product } from '../../database/db';
import ProductCard from './ProductCard';

interface ProductGridProps {
  filters: {
    query: string;
    categoryId: number | 'All';
    brand: string | 'All';
    quickFilter?: 'All' | 'Favorites' | 'Frequent' | 'Recent' | 'LowStock' | 'Offers';
  };
  onAddProduct: (product: Product) => void;
  refreshTrigger?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filters,
  onAddProduct,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [browseFavoritesOnly, setBrowseFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); // Default to modern Grid Cards as requested!
  
  // High density lists can fit more rows on a single POS screen
  const pageSize = viewMode === 'list' ? 15 : 12;

  // Fetch active products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      // slight delay for smooth transition
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        const activeProducts = await db.products.where('status').equals('Active').toArray();
        setProducts(activeProducts);
      } catch (err) {
        console.error('Failed to load active products for POS grid:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [refreshTrigger]);

  // Load favorites list
  const favoriteIds = useMemo(() => {
    try {
      const favs = localStorage.getItem('pos_favorites');
      return favs ? JSON.parse(favs) : [];
    } catch {
      return [];
    }
  }, [products, refreshTrigger, filters]);

  // Filter products in memory
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply left sidebar quick filters
    if (filters.quickFilter) {
      if (filters.quickFilter === 'Favorites') {
        result = result.filter((p) => favoriteIds.includes(p.id));
      } else if (filters.quickFilter === 'Frequent') {
        // Deterministic frequently sold filter (e.g. even IDs or higher IDs)
        result = result.filter((p) => (p.id ?? 0) % 2 === 0);
      } else if (filters.quickFilter === 'Recent') {
        // Sort in place by ID desc as proxy for newly added
        result.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      } else if (filters.quickFilter === 'LowStock') {
        result = result.filter((p) => (p.currentStock ?? p.stock ?? 0) <= (p.minimumStock ?? 5));
      } else if (filters.quickFilter === 'Offers') {
        // Represent active promo products
        result = result.filter((p) => (p.id ?? 0) % 3 === 0);
      }
    }

    return result.filter((p) => {
      // Favorites tab filter
      if (browseFavoritesOnly && !favoriteIds.includes(p.id)) {
        return false;
      }
      // Filter by Category
      if (filters.categoryId !== 'All' && p.categoryId !== filters.categoryId) {
        return false;
      }
      // Filter by Brand
      if (filters.brand !== 'All' && p.brand !== filters.brand) {
        return false;
      }
      // Filter by search string
      const q = filters.query.toLowerCase().trim();
      if (q) {
        const nameMatches = p.name.toLowerCase().includes(q);
        const skuMatches = p.sku.toLowerCase().includes(q);
        const barcodeMatches = (p.barcode || '').toLowerCase().includes(q);
        const brandMatches = (p.brand || '').toLowerCase().includes(q);
        return nameMatches || skuMatches || barcodeMatches || brandMatches;
      }
      return true;
    });
  }, [products, filters, browseFavoritesOnly, favoriteIds]);

  // Reset page on filter changes or mode change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, browseFavoritesOnly, viewMode]);

  // Paginate
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

  // Stagger variants for motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
  };

  // Render Skeleton Placeholders
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className={viewMode === 'list' ? "flex flex-col gap-2 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl p-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"}>
          {Array.from({ length: viewMode === 'list' ? 6 : 8 }).map((_, idx) => (
            viewMode === 'list' ? (
              <div key={idx} className="h-14 w-full bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
            ) : (
              <div key={idx} className="flex flex-col p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl animate-pulse gap-3">
                <div className="h-28 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded mt-1" />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-7 w-7 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mini sub-header: favorites tab and view toggles */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBrowseFavoritesOnly(false)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              !browseFavoritesOnly
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-extrabold border border-indigo-100 dark:border-indigo-900/40'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={() => setBrowseFavoritesOnly(true)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              browseFavoritesOnly
                ? 'bg-amber-400 border border-amber-450 text-slate-950 font-black shadow-sm'
                : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${browseFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </button>
        </div>

        {/* View mode buttons & count */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            FOUND: {totalItems} ITEMS
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-350'
              }`}
              title="Compact Rows List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-350'
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid rendering */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 text-center shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No Products Registered</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {browseFavoritesOnly
              ? "You haven't added any products to your favorites list yet. Star them inside the catalog."
              : "We couldn't find any active products matching your filter conditions. Make sure they are in stock and active."}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            /* COMPACT ROWS PRODUCT LIST */
            <div className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-900/60 pos-table-text text-[14px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850 font-mono select-none">
                <div className="col-span-1">Image</div>
                <div className="col-span-5 text-left">Product Details</div>
                <div className="col-span-3 text-left">Barcode</div>
                <div className="col-span-1.5 text-right">Stock</div>
                <div className="col-span-1.5 text-right">Price</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {paginatedProducts.map((p) => {
                  const stock = p.currentStock ?? p.stock ?? 0;
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= (p.minimumStock ?? 5);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && onAddProduct(p)}
                      className={`grid grid-cols-12 gap-3 px-5 py-4.5 pos-table-text text-[14px] items-center transition-colors group select-none ${
                        isOutOfStock
                          ? 'opacity-55 bg-slate-50/40 dark:bg-slate-900/10 cursor-not-allowed'
                          : 'hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="col-span-1 flex items-center justify-start">
                        <div className="h-11 w-11 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-xs">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Inbox className="h-5 w-5 text-slate-350" />
                          )}
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="col-span-5 text-left min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="pos-small-text text-[12px] font-bold text-slate-400 dark:text-slate-505 truncate max-w-[100px]">
                            {p.brand || 'Local'}
                          </span>
                          <span className="pos-small-text text-[12px] font-extrabold text-indigo-500/80 dark:text-indigo-400/80">
                            {p.categoryName}
                          </span>
                        </div>
                        <h4 className="pos-normal-text text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors mt-1">
                          {p.name}
                        </h4>
                      </div>

                      {/* Barcode */}
                      <div className="col-span-3 text-left font-mono pos-small-text text-[13px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {p.barcode || p.sku || 'No Barcode'}
                      </div>

                      {/* Stock Status */}
                      <div className="col-span-1.5 text-right font-mono pos-normal-text text-[14px] font-bold">
                        {isOutOfStock ? (
                          <span className="text-rose-600 font-extrabold text-[12px] uppercase tracking-wider px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40">Out</span>
                        ) : isLowStock ? (
                          <span className="text-amber-700 font-extrabold text-[13px] animate-pulse px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 font-black">
                            {stock}!!
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-black px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40">{stock}</span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="col-span-1.5 text-right font-mono font-black text-slate-900 dark:text-white pos-price text-[18px]">
                        ${(p.sellingPrice ?? p.price ?? 0).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STANDARD GRID OF CARDS */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="pos-product-grid"
            >
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map((p) => (
                  <motion.div key={p.id} variants={cardVariants} layout>
                    <ProductCard product={p} onAdd={onAddProduct} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xs mt-1 transition-all">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <span className="text-[12px] font-bold text-slate-750 dark:text-slate-300 font-mono px-4 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;

