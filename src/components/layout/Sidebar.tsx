import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Truck,
  ShoppingBag,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  X,
  ChevronLeft,
  CreditCard,
  Cloud,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { APP_INFO } from '../../constants/constants';
import { usePermissions } from '../../hooks/useAuth';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  FolderTree,
  Package,
  Truck,
  ShoppingBag,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings: SettingsIcon,
  CreditCard,
  Cloud,
};

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const { canAccess } = usePermissions();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', permissionKey: 'dashboard' },
    { path: '/categories', label: 'Categories', icon: 'FolderTree', permissionKey: 'categories' },
    { path: '/products', label: 'Products', icon: 'Package', permissionKey: 'products' },
    { path: '/suppliers', label: 'Suppliers', icon: 'Truck', permissionKey: 'suppliers' },
    { path: '/purchases', label: 'Purchases', icon: 'ShoppingBag', permissionKey: 'purchases' },
    { path: '/customers', label: 'Customers', icon: 'Users', permissionKey: 'customers' },
    { path: '/sales', label: 'Sales (POS)', icon: 'ShoppingCart', permissionKey: 'sales' },
    { path: '/credit', label: 'Customer Credit', icon: 'CreditCard', permissionKey: 'credit_payments' },
    { path: '/expenses', label: 'Expenses', icon: 'Receipt', permissionKey: 'expenses' },
    { path: '/reports', label: 'Reports', icon: 'BarChart3', permissionKey: 'reports' },
    { path: '/sync', label: 'Cloud Sync', icon: 'Cloud', permissionKey: 'settings' },
    { path: '/settings', label: 'Settings', icon: 'Settings', permissionKey: 'settings' },
  ];

  const allowedItems = navigationItems.filter((item) => canAccess(item.permissionKey));

  return (
    <div className="relative z-50 h-full w-16 shrink-0 transition-all duration-300 sidebar-container">
      {/* Main Sidebar Panel container: minimized to w-16 by default, expands to w-64 on hover */}
      <aside
        className="absolute inset-y-0 left-0 z-50 flex h-full w-16 flex-col border-r border-slate-100 bg-white shadow-md transition-all duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-950 hover:w-64 group overflow-hidden sidebar-aside"
      >
        {/* Brand Banner Section */}
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-slate-50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3.5 pl-0.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <span className="font-extrabold text-base tracking-wider">S</span>
            </div>
            <div className="flex flex-col text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight dark:text-white leading-tight">
                {APP_INFO.shortname}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                Shop Management
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigable Links Lists */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {allowedItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-150 cursor-pointer group/item
                  ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/10 shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/55 dark:hover:text-slate-200'
                  }
                `}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <IconComponent
                    className={`h-4.5 w-4.5 transition-transform duration-150 group-hover/item:scale-105
                      ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-350'}
                    `}
                  />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom utility block: shows database connection state and version */}
        <div className="p-3 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/10 shrink-0">
          <div className="flex flex-col gap-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2 text-left">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Connected
              </span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              v{APP_INFO.version}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
