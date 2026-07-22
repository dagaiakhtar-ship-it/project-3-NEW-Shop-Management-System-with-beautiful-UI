import React from 'react';
import { 
  Store, 
  Receipt, 
  ShoppingBag, 
  ShoppingCart, 
  Boxes, 
  CreditCard, 
  Coins, 
  LayoutDashboard, 
  Cloud, 
  Lock, 
  Users, 
  Bell, 
  Palette, 
  Globe, 
  Sliders,
  Search,
  Check,
  Filter,
  Activity,
  Sparkles
} from 'lucide-react';

interface CategoryItem {
  id: string;
  label: string;
  icon: any;
  description: string;
}

export const SETTINGS_CATEGORIES: CategoryItem[] = [
  { id: 'shop_info', label: 'Shop Information', icon: Store, description: 'Store name, logo, contact, and street address profile' },
  { id: 'receipt', label: 'Receipt settings', icon: Receipt, description: 'Thermal width, logo options, barcodes, and custom messages' },
  { id: 'sales', label: 'Sales settings', icon: ShoppingBag, description: 'Default checkout payment, tax, negative stock checks, formats' },
  { id: 'purchase', label: 'Purchase settings', icon: ShoppingCart, description: 'Procurement prefixes, automatic stock updates, defaults' },
  { id: 'inventory', label: 'Inventory settings', icon: Boxes, description: 'Low stock limits, alert states, formats, unit defaults' },
  { id: 'credit', label: 'Customer Credit', icon: CreditCard, description: 'Credit limits, overdue grace periods, automatic hold bounds' },
  { id: 'expenses', label: 'Expenses settings', icon: Coins, description: 'Procurement costs prefix, categories, and recurrences' },
  { id: 'dashboard', label: 'Dashboard widgets', icon: LayoutDashboard, description: 'Analytic dates, refresh timers, bento card grid configurations' },
  { id: 'sync', label: 'Backup & Cloud Sync', icon: Cloud, description: 'Google Spreadsheet links, manual database JSON imports/exports' },
  { id: 'security', label: 'Security & Access', icon: Lock, description: 'Session timeouts, auto logout checks, password complexity' },
  { id: 'users', label: 'User Operator profiles', icon: Users, description: 'Listing, registering, deactivating, or resetting cashier passes' },
  { id: 'notifications', label: 'System Notifications', icon: Bell, description: 'Toggle push notices regarding stock levels, debts, backup reports' },
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette, description: 'Application color skins, font sizes, compact display grids' },
  { id: 'appearance_display', label: 'Appearance & Display', icon: Palette, description: 'UI scale, text size, padding, table density, button & input heights' },
  { id: 'localization', label: 'Localization', icon: Globe, description: 'Languages, active country currency standards, and time formats' },
  { id: 'ai', label: 'AI Integration', icon: Sparkles, description: 'Gemini API key settings, model selection, custom assistant tuning' },
  { id: 'system_audit', label: 'System Audit & Diagnostics', icon: Activity, description: 'Database performance metrics, cashier trail logs, connection health' },
  { id: 'advanced', label: 'Advanced Operations', icon: Sliders, description: 'Indices rebuilds, cache clears, and database segmentation resets' },
];

interface SettingsSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  systemFilter: 'all' | 'system' | 'custom';
  onSystemFilterChange: (filter: 'all' | 'system' | 'custom') => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  systemFilter,
  onSystemFilterChange
}) => {
  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
        />
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-slate-850">
        <span className="text-[10px] text-slate-400 pl-2 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3" />
          <span className="font-extrabold uppercase">Filter</span>
        </span>
        <div className="flex items-center gap-1 ml-auto w-full justify-end">
          {(['all', 'system', 'custom'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onSystemFilterChange(f)}
              className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                systemFilter === f
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Category List */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1.5 scrollbar-thin">
        {SETTINGS_CATEGORIES.filter(cat => {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return cat.label.toLowerCase().includes(query) || cat.description.toLowerCase().includes(query);
          }
          return true;
        }).map((cat) => {
          const Icon = cat.icon;
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`group flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-600 dark:border-indigo-400 pl-2 shadow-xs'
                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40 border-l-4 border-transparent pl-2'
              }`}
            >
              <span className={`p-1.5 rounded-lg transition-colors mt-0.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 dark:group-hover:bg-slate-800'
              }`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={`text-xs font-bold leading-normal truncate ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-350'
                }`}>
                  {cat.label}
                </span>
                <span className="text-[9px] leading-tight text-slate-450 dark:text-slate-500 font-semibold line-clamp-2">
                  {cat.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsSidebar;
