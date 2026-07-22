import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'Search items...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-xs ${className}`}>
      <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs font-medium py-2 pl-10 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none transition-all duration-150 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20"
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-all duration-150 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBox;
