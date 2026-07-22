import { create } from 'zustand';
import { DEFAULT_USER, DEFAULT_SETTINGS } from '../constants/appConstants';

/**
 * Zustand UI Store
 * Holds and manages the high-level interface states, search inputs,
 * session user metadata, and shop configuration.
 */
export const useUIStore = create((set) => ({
  // Sidebar State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  // Search Context State
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),

  // Current User Session
  currentUser: DEFAULT_USER,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearCurrentUser: () => set({ currentUser: null }),

  // Shop/Business Information Settings
  shopInfo: {
    name: DEFAULT_SETTINGS.storeName,
    address: DEFAULT_SETTINGS.storeAddress,
    phone: DEFAULT_SETTINGS.storePhone,
    taxRate: DEFAULT_SETTINGS.taxRate,
    currency: DEFAULT_SETTINGS.currency,
  },
  updateShopInfo: (info) =>
    set((state) => ({
      shopInfo: { ...state.shopInfo, ...info },
    })),
}));

export default useUIStore;
