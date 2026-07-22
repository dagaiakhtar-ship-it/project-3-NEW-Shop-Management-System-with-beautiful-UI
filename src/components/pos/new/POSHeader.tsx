import React from 'react';
import { ShoppingBag, Bell, Settings, User, PlayCircle, History, Sun, Moon } from 'lucide-react';
import SearchBar, { SearchBarProps } from './SearchBar';
import useAppStore from '../../../store/useAppStore';

interface POSHeaderProps extends SearchBarProps {
  currentTime: Date;
  cashierName?: string;
  storeName?: string;
  currentSaleNo?: string;
  activeMode?: 'pos' | 'ledger';
  onModeChange?: (mode: 'pos' | 'ledger') => void;
  ledgerTotal?: number;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  currentTime,
  cashierName = 'John Doe',
  storeName = 'Vertex Retail Store',
  currentSaleNo = '#INV-00248',
  value,
  onChange,
  onScan,
  activeMode = 'pos',
  onModeChange,
  ledgerTotal = 0,
}) => {
  const { themeMode, toggleThemeMode } = useAppStore();

  // Format current date and time
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header
      className="h-14 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0 z-30 w-full"
      id="pos-sticky-header"
    >
      {/* Header Left: Store Logo, Store Name, Current Sale */}
      <div className="flex items-center gap-2.5 shrink-0" id="pos-header-left">
        <div className="h-8.5 w-8.5 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-lg flex items-center justify-center border border-indigo-600/20 dark:border-indigo-400/20 shadow-xs">
          <ShoppingBag className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex flex-col text-left text-slate-900 dark:text-slate-100">
          <span className="text-[14px] font-bold leading-tight tracking-tight">
            {storeName}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            Active Sale: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentSaleNo}</span>
          </span>
        </div>
      </div>

      {/* Header Center: Large Search Bar */}
      <div className="hidden md:block flex-1 max-w-lg mx-3" id="pos-header-center">
        <SearchBar value={value} onChange={onChange} onScan={onScan} />
      </div>

      {/* Header Right: Mode Switcher, Cashier Profile, Icons */}
      <div className="flex items-center gap-3 shrink-0" id="pos-header-right">
        {/* Mode Switcher */}
        {onModeChange && (
          <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-750 shrink-0">
            <button
              onClick={() => onModeChange('pos')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-all duration-150 flex items-center gap-1 ${
                activeMode === 'pos'
                  ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <PlayCircle className="h-3 w-3" />
              <span>Terminal</span>
            </button>
            <button
              onClick={() => onModeChange('ledger')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-all duration-150 flex items-center gap-1 ${
                activeMode === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <History className="h-3 w-3" />
              <span>Ledger ({ledgerTotal})</span>
            </button>
          </div>
        )}

        {/* Date & Time */}
        <div className="hidden xl:flex flex-col text-right">
          <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">
            {formattedTime}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {formattedDate}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden xl:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Cashier Name & Profile */}
        <div className="flex items-center gap-2 text-left">
          <div className="h-8 w-8 rounded-full bg-indigo-600/15 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold text-[12px] flex items-center justify-center border border-indigo-600/10 dark:border-indigo-400/10">
            {cashierName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {cashierName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-none">
              Cashier
            </span>
          </div>
        </div>

        {/* Settings & Alert Icons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleThemeMode}
            className="h-8.5 w-8.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-850 transition-all duration-200 cursor-pointer"
            title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="h-8.5 w-8.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-850 transition-all duration-200 cursor-pointer"
            id="pos-header-notifications-btn"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8.5 w-8.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-850 transition-all duration-200 cursor-pointer"
            id="pos-header-settings-btn"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default React.memo(POSHeader);
