import React, { useState, useEffect, useRef } from 'react';
import { db, type Product, type Category } from '../../database/db';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Search, Barcode, Layers, Plus } from 'lucide-react';
import Button from '../ui/Button';

interface ProductSelectorProps {
  onSelectProduct: (product: Product) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ onSelectProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Load Categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const list = await db.categories.filter((c) => c.status !== 'Archived').toArray();
      setCategories(list);
    };
    fetchCategories();
  }, []);

  // Filter products based on category & search text
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      let list = await db.products.filter((p) => p.status === 'Active').toArray();

      if (categoryId !== 'all') {
        const catId = Number(categoryId);
        list = list.filter((p) => p.categoryId === catId);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query)
        );
      }

      setFilteredProducts(list.slice(0, 10)); // Limit to first 10 for performance
    };

    fetchFilteredProducts();
  }, [searchQuery, categoryId]);

  // Handle barcode scanner / fast enter barcode
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const match = await db.products
        .filter((p) => p.barcode?.toLowerCase() === barcodeInput.trim().toLowerCase() && p.status === 'Active')
        .first();

      if (match) {
        onSelectProduct(match);
        setBarcodeInput('');
      } else {
        // Look up by SKU too just in case
        const skuMatch = await db.products
          .filter((p) => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase() && p.status === 'Active')
          .first();
        if (skuMatch) {
          onSelectProduct(skuMatch);
          setBarcodeInput('');
        }
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
    }
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Category Filter */}
        <div className="flex flex-col">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Category Filter
          </label>
          <div className="relative">
            <Layers className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <div className="pl-6">
              <Select
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Filter by category"
              />
            </div>
          </div>
        </div>

        {/* Product Search Input */}
        <div className="flex flex-col md:col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Search Product (Name / SKU / Barcode)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Barcode Search Box */}
      <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            ref={barcodeRef}
            type="text"
            className="pl-9"
            placeholder="Scan or enter Barcode / SKU for instant add..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Add
        </Button>
      </form>

      {/* Dropdown / Search list results */}
      {searchQuery.trim() && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-md max-h-60 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {filteredProducts.map((p) => {
                const pPrice = p.purchasePrice ?? p.cost ?? 0;
                const sPrice = p.sellingPrice ?? p.price ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(p);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-450 dark:text-slate-500">
                        SKU: {p.sku} | Barcode: {p.barcode || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">
                          Stock: {p.currentStock ?? p.stock ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-450">
                          Cost: ${pPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-450 dark:text-slate-500 font-medium">
              No matching active products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
