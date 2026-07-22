import { create } from 'zustand';
import { db, type User } from '../database/db';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { logAction } from '../utils/auditLogger';

// Role type matching database definition
export type UserRole = 'Administrator' | 'Cashier';

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  isFirstLoginNotice: boolean; // Display a message that default password should be changed after first login.
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (username: string, passwordHash: string, rememberMe: boolean) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateCurrentUserProfile: (fields: Partial<User>) => Promise<void>;
  changeUserPassword: (userId: number, currentPass: string, newPass: string) => Promise<void>;
}

const SESSION_KEY = 'shop_auth_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  rememberMe: false,
  isLoading: true,
  error: null,
  isFirstLoginNotice: false,

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Seed default user if no users exist
      const userCount = await db.users.count();
      if (userCount === 0) {
        const defaultAdminPasswordHash = await hashPassword('admin123');
        await db.users.add({
          fullName: 'Default Administrator',
          username: 'admin',
          email: 'admin@shop.com',
          phone: '+123456789',
          passwordHash: defaultAdminPasswordHash,
          role: 'Administrator',
          profileImage: null,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Default Admin user seeded successfully.');
      }

      // 2. Check for existing persisted session
      const savedSessionStr = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        const now = Date.now();

        // Check if session has expired
        if (session.expiresAt && now > session.expiresAt) {
          // Session expired
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          set({ currentUser: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // Fetch user from DB to verify still exists and active
        const user = await db.users.get(session.userId);
        if (user && user.status === 'active') {
          // Update expiration timestamp if rememberMe is enabled
          const expiresAt = now + SESSION_TIMEOUT_MS;
          const updatedSession = { ...session, expiresAt };
          
          if (localStorage.getItem(SESSION_KEY)) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
          } else {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
          }

          // Check if it's the default admin password to show password change notice
          const isDefaultPass = await verifyPassword('admin123', user.passwordHash);

          set({
            currentUser: user,
            isAuthenticated: true,
            rememberMe: !!localStorage.getItem(SESSION_KEY),
            isFirstLoginNotice: isDefaultPass && user.username === 'admin',
            isLoading: false,
          });
          return;
        }
      }
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    } catch (err: any) {
      console.error('Error in initializeAuth:', err);
      set({ error: err.message || 'Database initialization error', isLoading: false });
    }
  },

  login: async (username, password, rememberMe) => {
    set({ isLoading: true, error: null });
    try {
      // Find user by username (case-insensitive or exact, let's find exact and trim)
      const user = await db.users.where('username').equalsIgnoreCase(username.trim()).first();
      
      if (!user) {
        throw new Error('Wrong username or password.');
      }

      if (user.status !== 'active') {
        throw new Error('This user account is inactive. Please contact the administrator.');
      }

      // Verify Password Hash
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Wrong username or password.');
      }

      // Record Last Login
      const now = new Date();
      await db.users.update(user.id!, {
        lastLogin: now,
        updatedAt: now,
      });
      user.lastLogin = now;

      // Create Session
      const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
      const sessionData = {
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: Date.now(),
        expiresAt,
      };

      if (rememberMe) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      }

      // Check if logged in with default password
      const isDefaultPass = await verifyPassword('admin123', user.passwordHash);

      set({
        currentUser: user,
        isAuthenticated: true,
        rememberMe,
        isFirstLoginNotice: isDefaultPass && user.username === 'admin',
        isLoading: false,
      });

      // Audit Log for Login
      await logAction('Login', 'Auth', `User logged in: ${user.fullName} (${user.role})`);

      return user;
    } catch (err: any) {
      set({ error: err.message || 'Authentication failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { currentUser } = get();
    set({ isLoading: true });
    try {
      if (currentUser) {
        await logAction('Logout', 'Auth', `User logged out: ${currentUser.fullName}`);
      }
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      set({
        currentUser: null,
        isAuthenticated: false,
        rememberMe: false,
        isFirstLoginNotice: false,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message || 'Logout error', isLoading: false });
    }
  },

  updateCurrentUserProfile: async (fields) => {
    const { currentUser } = get();
    if (!currentUser || !currentUser.id) return;

    try {
      const now = new Date();
      const updatedFields = {
        ...fields,
        updatedAt: now,
      };

      await db.users.update(currentUser.id, updatedFields);
      const freshUser = await db.users.get(currentUser.id);
      if (freshUser) {
        set({ currentUser: freshUser });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile' });
      throw err;
    }
  },

  changeUserPassword: async (userId, currentPass, newPass) => {
    set({ isLoading: true, error: null });
    try {
      const user = await db.users.get(userId);
      if (!user) {
        throw new Error('User not found.');
      }

      // Verify current password
      const isCurrentValid = await verifyPassword(currentPass, user.passwordHash);
      if (!isCurrentValid) {
        throw new Error('Current password is incorrect.');
      }

      // Hash new password and save
      const newHash = await hashPassword(newPass);
      const now = new Date();
      await db.users.update(userId, {
        passwordHash: newHash,
        updatedAt: now,
      });

      // Audit Log for Password Change
      await logAction('Update', 'Auth', `Password updated for user ID: ${userId}`);

      // Update state if changing password for logged in user
      const { currentUser } = get();
      if (currentUser && currentUser.id === userId) {
        const freshUser = { ...currentUser, passwordHash: newHash, updatedAt: now };
        
        // Clear first-login notice if password is changed from admin123
        const stillDefault = await verifyPassword('admin123', newHash);

        set({
          currentUser: freshUser,
          isFirstLoginNotice: stillDefault && freshUser.username === 'admin',
        });
      }

      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to change password', isLoading: false });
      throw err;
    }
  },
}));

export default useAuthStore;
