import React, { useEffect, useRef, useState } from 'react';
import { Search, Mic, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BarcodeButton from './BarcodeButton';

export interface ProductSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onScan: () => void;
  isLoading?: boolean;
  isScanning?: boolean;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  value,
  onChange,
  onScan,
  isLoading = false,
  isScanning = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders = [
    'Search by Product Name...',
    'Search by Barcode...',
    'Search by SKU...',
    'Search by Category...',
  ];

  // Rotate placeholders for dynamic active guidance
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+F to focus the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="w-full h-14 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs px-3 flex items-center gap-2 select-none"
      id="pos-enterprise-search-section"
    >
      {/* 1. Full-Width Search Input Block */}
      <div className="relative flex-1 h-10">
        {/* Leading Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          ) : (
            <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          )}
        </div>

        {/* Dynamic Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholders[placeholderIndex]}
          className="w-full h-full pl-9 pr-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[13.5px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/25 focus:border-indigo-600 dark:focus:ring-indigo-500/25 dark:focus:border-indigo-500 transition-all duration-200"
          id="enterprise-product-search-input"
        />

        {/* Floating Controls inside the Input */}
        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
          {/* Clear Search Button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Keyboard Shortcut Hint */}
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] text-[9px] font-extrabold text-slate-500 dark:text-slate-400 font-mono shadow-3xs select-none">
            <span className="text-[8px]">CTRL</span>
            <span>+</span>
            <span>F</span>
          </div>
        </div>
      </div>

      {/* 2. Barcode Scanner Trigger Button */}
      <BarcodeButton onClick={onScan} isLoading={isScanning} />

      {/* 3. Voice Search Placeholder button */}
      <div className="relative group shrink-0">
        <button
          type="button"
          disabled
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 rounded-lg flex items-center justify-center cursor-not-allowed"
          id="pos-voice-search-btn"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-50">
          Coming Soon
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductSearchBar);
