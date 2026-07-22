import React from 'react';
import { Search, Barcode, Mic, Clock } from 'lucide-react';

export interface SearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  onScan?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value = '', onChange, onScan }) => {
  return (
    <div className="flex items-center gap-3 w-full" id="pos-search-bar-container">
      {/* Search Input field */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-450" />
        </div>
        <input
          type="text"
          className="w-full h-10 pl-11 pr-4 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl text-[14px] text-[#111827] dark:text-slate-100 placeholder-[#6B7280] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 dark:focus:ring-indigo-500/20 dark:focus:border-indigo-500 transition-all"
          placeholder="Search product, barcode or SKU..."
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>

      {/* Barcode Scan Button */}
      <button
        type="button"
        onClick={onScan}
        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[14px] rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-102 hover:shadow-md cursor-pointer shrink-0 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        id="pos-barcode-scan-btn"
      >
        <Barcode className="h-5 w-5" />
        <span>Scan</span>
      </button>

      {/* Voice Search Button */}
      <div className="relative group shrink-0">
        <button
          type="button"
          disabled
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 text-[#6B7280] rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-102 cursor-not-allowed"
          id="pos-voice-search-btn"
        >
          <Mic className="h-5 w-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[12px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-55">
          Coming Soon
        </div>
      </div>

      {/* Recent Search Button */}
      <div className="relative group shrink-0">
        <button
          type="button"
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 text-[#6B7280] rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-102 cursor-pointer"
          id="pos-recent-search-btn"
        >
          <Clock className="h-5 w-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[12px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-55">
          Recent Searches
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchBar);
