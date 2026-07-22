import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Filter, X, Mic, MicOff } from 'lucide-react';
import { db, type Category } from '../../database/db';
import showToast from '../../utils/toast';

interface ProductSearchProps {
  onSearch: (filters: {
    query: string;
    categoryId: number | 'All';
    brand: string | 'All';
  }) => void;
  onBarcodeScan: (barcode: string) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onSearch,
  onBarcodeScan,
}) => {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'All'>('All');
  const [selectedBrand, setSelectedBrand] = useState<string | 'All'>('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isBarcodeFocus, setIsBarcodeFocus] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const barcodeRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load categories and brands
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const cats = await db.categories.where('status').equals('Active').toArray();
        setCategories(cats);

        const prods = await db.products.toArray();
        const uniqueBrands = Array.from(new Set(prods.map((p) => p.brand?.trim()).filter(Boolean))) as string[];
        setBrands(uniqueBrands.sort());
      } catch (err) {
        console.error('Failed to load filters for POS search:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Sync state filters to parent
  useEffect(() => {
    onSearch({
      query,
      categoryId: selectedCategory,
      brand: selectedBrand,
    });
  }, [query, selectedCategory, selectedBrand, onSearch]);

  // Autofocus Barcode Input on start
  useEffect(() => {
    if (barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onBarcodeScan(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const handleClearFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedBrand('All');
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast.error("Voice recognition is not supported by this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        showToast.info("Listening for search query...");
      };

      rec.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setQuery(speechToText);
        showToast.success(`Searched: "${speechToText}"`);
      };

      rec.onerror = (e: any) => {
        console.error(e);
        showToast.error("Could not catch voice. Try again.");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xs text-left transition-all">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        
        {/* 1. Barcode Direct Input - Span 4 on desktop */}
        <form onSubmit={handleBarcodeSubmit} className="relative md:col-span-4 flex flex-col justify-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Barcode className={`h-4.5 w-4.5 transition-colors ${isBarcodeFocus ? 'text-indigo-600 dark:text-indigo-450' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <input
            ref={barcodeRef}
            id="barcode-search-input"
            type="text"
            className="w-full h-10 pos-search-bar pos-input-text pl-10 pr-16 text-xs font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 placeholder-slate-450 font-mono transition-all shadow-2xs"
            placeholder="Scan / Type Barcode..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onFocus={() => setIsBarcodeFocus(true)}
            onBlur={() => setIsBarcodeFocus(false)}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 pos-btn-text text-[11px] font-extrabold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition duration-150 cursor-pointer flex items-center justify-center"
          >
            Add
          </button>
        </form>

        {/* 2. Text Search Input with Voice Search Icon - Span 8 on desktop */}
        <div className="relative md:col-span-8 flex flex-col justify-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            id="product-search-input"
            type="text"
            className="w-full h-10 pos-search-bar pos-input-text pl-10 pr-24 text-xs font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 placeholder-slate-455 transition-all shadow-2xs"
            placeholder="Search Product or Scan Barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <div className="absolute right-2.5 inset-y-0 flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`p-1.5 rounded-lg border h-7.5 w-7.5 flex items-center justify-center transition duration-150 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-550 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice search"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Shortcut key tag */}
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:text-slate-550 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded font-mono select-none">
              F1
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Chips List */}
      <div className="flex flex-col gap-2 mt-1">
        <span className="pos-section-title text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Browse Categories</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 pos-btn-text text-xs font-bold rounded-lg transition-all border whitespace-nowrap cursor-pointer duration-150 ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs font-extrabold'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id!)}
              className={`px-3.5 py-1.5 pos-btn-text text-xs font-bold rounded-lg transition-all border whitespace-nowrap cursor-pointer duration-150 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Brand Filter and Clear Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-900 pt-3 mt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 select-none h-8">
            <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
            <span className="pos-small-text text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand:</span>
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="pos-input pos-input-text text-xs font-bold bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 px-3 py-1 rounded-lg text-slate-800 dark:text-slate-200 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-indigo-500 shadow-2xs h-8"
          >
            <option value="All">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {(query || selectedCategory !== 'All' || selectedBrand !== 'All') && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 pos-btn-text text-[10.5px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:bg-rose-600 bg-rose-50/60 dark:bg-rose-955/20 px-3 py-1.5 border border-rose-200 dark:border-rose-900/40 rounded-lg transition duration-150 cursor-pointer shrink-0 shadow-2xs"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
