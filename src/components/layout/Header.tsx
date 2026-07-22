import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Search, Menu, User as UserIcon, Check, Trash2, Calendar, Clock } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { APP_INFO } from '../../constants/constants';
import ProfileMenu from '../auth/ProfileMenu';

export const Header: React.FC = () => {
  const {
    themeMode,
    toggleThemeMode,
    toggleSidebar,
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAppStore();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  // Keep date and clock in sync in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-950">
      {/* Left: Clean spacing and Workspace identity */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none">
          Workspace
        </span>
      </div>

      {/* Middle: Universal Search input bar */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoice or product SKU..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-950 dark:focus:ring-indigo-950/20"
          />
        </div>
      </div>

      {/* Right: Date/Time, Notification Alerts, Dark Mode Toggle & User session */}
      <div className="flex items-center gap-4">
        {/* Real-time calendar date and digital clock */}
        <div className="hidden xl:flex items-center gap-3.5 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold border border-slate-100/50 dark:border-slate-800/30 select-none">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span className="font-mono">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Theme mode toggler */}
        <button
          onClick={toggleThemeMode}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 cursor-pointer"
          title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications list dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 cursor-pointer"
            title="System Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown menu panel */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-100 bg-white shadow-xl dark:border-slate-800/80 dark:bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-50 px-4 py-3 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Alerts</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="rounded p-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 cursor-pointer"
                    title="Mark all as read"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                    title="Clear alerts"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 text-xs transition-colors ${
                        notif.read ? 'opacity-65' : 'bg-slate-50/50 dark:bg-slate-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {notif.title}
                          </span>
                          <span className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal">
                            {notif.message}
                          </span>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="rounded-full bg-indigo-50 p-0.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 cursor-pointer shrink-0"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800/80" />

        {/* Dynamic User Profile dropdown */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Header;
