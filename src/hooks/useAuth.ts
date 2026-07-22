import { useAuthStore, type UserRole } from '../store/authStore';
import type { User } from '../database/db';

/**
 * Custom hook to interact with the authentication store.
 * Provides the current authentication state and core actions.
 */
export function useAuth() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const isFirstLoginNotice = useAuthStore((state) => state.isFirstLoginNotice);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isFirstLoginNotice,
    login,
    logout,
    clearError,
    initializeAuth,
  };
}

/**
 * Custom hook to get and update the current logged-in user profile.
 */
export function useCurrentUser() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateProfile = useAuthStore((state) => state.updateCurrentUserProfile);
  const changePassword = useAuthStore((state) => state.changeUserPassword);

  return {
    user: currentUser,
    updateProfile,
    changePassword,
  };
}

// Map of modules and who can access them
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Administrator: [
    'dashboard',
    'products',
    'categories',
    'customers',
    'suppliers',
    'purchases',
    'sales',
    'credit_payments',
    'expenses',
    'reports',
    'settings',
    'users',
    'profile',
  ],
  Cashier: [
    'products',
    'categories',
    'sales',
    'profile',
  ],
};

/**
 * Custom hook to evaluate user permissions based on their role.
 * Implements strict role-based access control (RBAC).
 */
export function usePermissions() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const role: UserRole | null = currentUser?.role || null;

  const isAdmin = role === 'Administrator';
  const isCashier = role === 'Cashier';

  /**
   * Checks if the active user can access a specific module.
   * @param module Name of the module/page.
   */
  const canAccess = (module: string): boolean => {
    if (!role) return false;
    const allowedModules = ROLE_PERMISSIONS[role];
    return allowedModules.includes(module.toLowerCase().trim());
  };

  return {
    role,
    isAdmin,
    isCashier,
    canAccess,
    allowedModules: role ? ROLE_PERMISSIONS[role] : [],
  };
}
