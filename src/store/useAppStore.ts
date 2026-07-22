import { create } from 'zustand';
import { DEFAULT_USER } from '../constants/constants';
import { db } from '../database/db';

export interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  avatarUrl: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface AppState {
  themeMode: 'light' | 'dark';
  isSidebarOpen: boolean;
  currentUser: User;
  notifications: AppNotification[];
  toggleThemeMode: () => void;
  setThemeMode: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setCurrentUser: (user: User) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Core initial states, matching the storage namespace key
  themeMode: (localStorage.getItem('theme-settings-theme') as 'light' | 'dark') || 'light',
  isSidebarOpen: true,
  currentUser: DEFAULT_USER,
  notifications: [
    {
      id: '1',
      title: 'Database Initialized',
      message: 'IndexedDB using Dexie.js created and mounted successfully!',
      type: 'success',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      title: 'Low Stock Alert System Ready',
      message: 'Automatic low inventory triggers are active.',
      type: 'info',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
    }
  ],

  // Actions
  toggleThemeMode: () =>
    set((state) => {
      const nextTheme = state.themeMode === 'light' ? 'dark' : 'light';
      
      // Apply theme class to document root for tailwind dark-mode modifiers
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      localStorage.setItem('theme-settings-theme', nextTheme);

      // Persist to IndexedDB offline settings table
      db.settings.get('theme').then((existing) => {
        db.settings.put({
          key: 'theme',
          value: nextTheme,
          category: existing?.category || 'Shop Information',
          description: existing?.description || 'The visual color theme (light, dark, or system)',
          isSystem: existing?.isSystem !== undefined ? existing.isSystem : true,
          createdAt: existing?.createdAt || new Date(),
          updatedAt: new Date()
        }).catch(err => console.error('Failed to update theme setting in DB:', err));
      }).catch(err => console.error('Failed to get existing theme setting:', err));

      return { themeMode: nextTheme };
    }),

  setThemeMode: (theme: 'light' | 'dark') =>
    set(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme-settings-theme', theme);
      return { themeMode: theme };
    }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen: boolean) =>
    set({ isSidebarOpen: isOpen }),

  setCurrentUser: (user: User) =>
    set({ currentUser: user }),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        {
          ...notif,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markNotificationAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotifications: () =>
    set({ notifications: [] }),
}));
export default useAppStore;
