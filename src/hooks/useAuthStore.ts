// ==============================================================================
// Amar Dokan (আমার দোকান) Authentication & Role-Based Access Control Store
// Zustand-powered persistent state with offline profile authentication
// ==============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, UserSession, Profile } from '../@types/database.types';
import { db, INITIAL_PROFILES } from '../db/offlineDb';

interface AuthState {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoading: boolean;

  // Authentication actions
  loginWithPhoneAndPin: (phone: string, pin: string) => Promise<boolean>;
  quickLoginDemoRole: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;

  // Permissions helpers
  hasAccess: (feature: 'POS' | 'BAKI' | 'INVENTORY_VIEW' | 'INVENTORY_MANAGE' | 'CHALAN' | 'REPORTS' | 'NET_PROFIT' | 'STAFF') => boolean;
  isSuperAdmin: () => boolean;
  isOwnerOrAbove: () => boolean;
  isManagerOrAbove: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      loginError: null,
      isLoading: false,

      clearError: () => set({ loginError: null }),

      loginWithPhoneAndPin: async (phone: string, pin: string): Promise<boolean> => {
        set({ isLoading: true, loginError: null });
        const cleanPhone = phone.trim();
        const cleanPin = pin.trim();

        try {
          // Look up in Dexie offline database
          let profile: Profile | undefined = await db.profiles.where('phone').equals(cleanPhone).first();

          // Fallback to initial seed profiles if database isn't fully ready
          if (!profile) {
            profile = INITIAL_PROFILES.find((p) => p.phone === cleanPhone);
          }

          if (!profile) {
            set({
              isLoading: false,
              loginError: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
            });
            return false;
          }

          if (profile.pin_code !== cleanPin) {
            set({
              isLoading: false,
              loginError: 'ভুল পিন কোড! সঠিক ৪-সংখ্যার পিন দিন।',
            });
            return false;
          }

          const session: UserSession = {
            id: profile.id,
            store_id: profile.store_id,
            full_name: profile.full_name,
            phone: profile.phone || '',
            role: profile.role,
            logged_at: new Date().toISOString(),
          };

          set({
            currentUser: session,
            isAuthenticated: true,
            loginError: null,
            isLoading: false,
          });
          return true;
        } catch (error) {
          console.error('[AmarDokan Auth] Login error:', error);
          set({
            isLoading: false,
            loginError: 'লগইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
          });
          return false;
        }
      },

      quickLoginDemoRole: async (role: UserRole): Promise<boolean> => {
        set({ isLoading: true, loginError: null });
        const target = INITIAL_PROFILES.find((p) => p.role === role);
        if (!target) {
          set({ isLoading: false, loginError: 'ডেমো রোল পাওয়া যায়নি।' });
          return false;
        }

        const session: UserSession = {
          id: target.id,
          store_id: target.store_id,
          full_name: target.full_name,
          phone: target.phone || '',
          role: target.role,
          logged_at: new Date().toISOString(),
        };

        set({
          currentUser: session,
          isAuthenticated: true,
          loginError: null,
          isLoading: false,
        });
        return true;
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          loginError: null,
          isLoading: false,
        });
      },

      hasAccess: (feature) => {
        const user = get().currentUser;
        if (!user) return false;
        const role = user.role;

        switch (feature) {
          case 'POS':
          case 'BAKI':
          case 'INVENTORY_VIEW':
            return true; // All roles can sell, collect baki, view catalog

          case 'INVENTORY_MANAGE':
          case 'CHALAN':
            return role === 'super_admin' || role === 'owner' || role === 'manager';

          case 'REPORTS':
            return role === 'super_admin' || role === 'owner' || role === 'manager';

          case 'NET_PROFIT':
          case 'STAFF':
            return role === 'super_admin' || role === 'owner';

          default:
            return false;
        }
      },

      isSuperAdmin: () => {
        return get().currentUser?.role === 'super_admin';
      },

      isOwnerOrAbove: () => {
        const role = get().currentUser?.role;
        return role === 'super_admin' || role === 'owner';
      },

      isManagerOrAbove: () => {
        const role = get().currentUser?.role;
        return role === 'super_admin' || role === 'owner' || role === 'manager';
      },
    }),
    {
      name: 'amar_dokan_auth_session',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Display label and styling helpers for roles
export const getRoleInfo = (role?: UserRole) => {
  switch (role) {
    case 'super_admin':
      return {
        labelBn: 'সুপার অ্যাডমিন',
        labelEn: 'Super Admin',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        dotColor: 'bg-purple-500',
      };
    case 'owner':
      return {
        labelBn: 'দোকান মালিক',
        labelEn: 'Shop Owner',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'manager':
      return {
        labelBn: 'ম্যানেজার',
        labelEn: 'Manager',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'cashier':
      return {
        labelBn: 'ক্যাশিয়ার',
        labelEn: 'Cashier',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    default:
      return {
        labelBn: 'গেস্ট',
        labelEn: 'Guest',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        dotColor: 'bg-slate-400',
      };
  }
};
