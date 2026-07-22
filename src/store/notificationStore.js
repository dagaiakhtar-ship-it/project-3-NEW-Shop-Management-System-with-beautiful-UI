import { create } from 'zustand';

/**
 * Zustand Notification Store
 * Manages the client-side system alert stack, log details,
 * and read/unread statuses.
 */
export const useNotificationStore = create((set) => ({
  notifications: [
    {
      id: 'init-db',
      title: 'Database Active',
      message: 'IndexedDB (Dexie) is mounted and ready for offline use.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    }
  ],

  addNotification: (notification) =>
    set((state) => {
      const newNotif = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification,
      };
      return {
        notifications: [newNotif, ...state.notifications],
      };
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));

export default useNotificationStore;
