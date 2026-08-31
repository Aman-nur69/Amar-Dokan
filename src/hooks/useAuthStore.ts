// ==============================================================================
// Amar Dokan (আমার দোকান) Authentication & Role-Based Access Control Store
// Zustand-powered persistent state with offline profile authentication
// ==============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, UserSession, Profile, Store } from '../@types/database.types';
import { db, INITIAL_PROFILES } from '../db/offlineDb';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

interface AuthState {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoading: boolean;
  activeStoreId: string;
  inspectingStore: Store | null;

  // Authentication actions
  loginWithPhoneAndPassword: (phone: string, password: string) => Promise<boolean>;
  loginWithPhoneAndPin: (phone: string, pin: string) => Promise<boolean>; // Backwards-compatible alias
  quickLoginDemoRole: (role: UserRole) => Promise<boolean>;
  registerNewShop: (shopData: {
    shopName: string;
    proprietor: string;
    phone: string;
    password: string;
    pin?: string;
    address: string;
    tradeLicenceNo: string;
    tradeLicenceDocUrl?: string;
    tinNumber: string;
  }) => Promise<{ success: boolean; message: string }>;
  switchActiveStore: (storeId: string) => void;
  enterStoreInspection: (store: Store) => void;
  exitStoreInspection: () => void;
  logout: () => void;
  clearError: () => void;

  // Permissions helpers
  hasAccess: (feature: 'POS' | 'BAKI' | 'INVENTORY_VIEW' | 'INVENTORY_MANAGE' | 'CHALAN' | 'REPORTS' | 'NET_PROFIT' | 'STAFF' | 'SUPER_ADMIN') => boolean;
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
      activeStoreId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      inspectingStore: null,

      clearError: () => set({ loginError: null }),

      switchActiveStore: (storeId: string) => {
        set((state) => ({
          activeStoreId: storeId,
          currentUser: state.currentUser ? { ...state.currentUser, store_id: storeId } : null,
        }));
      },

      enterStoreInspection: (store: Store) => {
        set((state) => ({
          activeStoreId: store.id,
          inspectingStore: store,
          currentUser: state.currentUser ? { ...state.currentUser, store_id: store.id } : null,
        }));
      },

      exitStoreInspection: () => {
        set((state) => ({
          inspectingStore: null,
          activeStoreId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          currentUser: state.currentUser ? { ...state.currentUser, store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' } : null,
        }));
      },

      loginWithPhoneAndPassword: async (phone: string, secret: string): Promise<boolean> => {
        set({ isLoading: true, loginError: null });
        const cleanPhone = phone.trim();
        const cleanSecret = secret.trim();

        try {
          // 1. If Supabase is configured, attempt cloud authentication to establish RLS token session
          if (isSupabaseConfigured()) {
            try {
              // Convert phone to compliant format or email pseudo-identity for Supabase auth
              const authEmail = `${cleanPhone}@mudidokan.internal`;
              const { error: sbAuthError } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: cleanSecret,
              });

              if (sbAuthError) {
                console.warn('[AmarDokan Auth] Supabase cloud auth attempted:', sbAuthError.message);
              }
            } catch (sbErr) {
              console.warn('[AmarDokan Auth] Supabase online auth skipped/failed:', sbErr);
            }
          }

          // 2. Local Dexie offline authentication lookup
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

          // Verify either password or pin_code
          const isValidSecret =
            (profile.password && profile.password === cleanSecret) ||
            (profile.pin_code && profile.pin_code === cleanSecret);

          if (!isValidSecret) {
            set({
              isLoading: false,
              loginError: 'ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।',
            });
            return false;
          }

          // Check if store is approved (non-super_admin roles)
          if (profile.role !== 'super_admin') {
            const store = await db.stores.get(profile.store_id);
            if (store && store.verification_status === 'pending') {
              set({
                isLoading: false,
                loginError: 'আপনার দোকানটি এখনও সুপার অ্যাডমিন দ্বারা যাচাইাধীন। অনুগ্রহ করে অনুমোদন পর্যন্ত অপেক্ষা করুন।',
              });
              return false;
            }
            if (store && store.verification_status === 'rejected') {
              set({
                isLoading: false,
                loginError: `আবেদন প্রত্যাখ্যাত: ${store.verification_notes || 'কাগজপত্রে অসামঞ্জস্য রয়েছে।'}`,
              });
              return false;
            }
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
            activeStoreId: profile.store_id,
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

      // Backwards compatibility alias
      loginWithPhoneAndPin: async (phone: string, pin: string) => {
        return get().loginWithPhoneAndPassword(phone, pin);
      },

      registerNewShop: async (shopData) => {
        set({ isLoading: true, loginError: null });
        try {
          const storeId = `store-${Date.now()}`;
          const newStore = {
            id: storeId,
            name: shopData.shopName.trim(),
            proprietor: shopData.proprietor.trim(),
            phone: shopData.phone.trim(),
            address: shopData.address.trim(),
            trade_licence_no: shopData.tradeLicenceNo.trim(),
            trade_licence_doc_url: shopData.tradeLicenceDocUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
            tin_number: shopData.tinNumber.trim(),
            verification_status: 'pending' as const,
            verification_notes: 'ট্রেড লাইসেন্স ও টিআইএন যাচাই প্রক্রিয়াধীন',
            currency_symbol: '৳',
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const passwordVal = (shopData.password || shopData.pin || 'dokan123').trim();

          // If Supabase is configured, create Auth user so auth.uid() is provisioned
          let authUid = `p-${Date.now()}`;
          if (isSupabaseConfigured()) {
            try {
              const { data: authData } = await supabase.auth.signUp({
                email: `${shopData.phone.trim()}@mudidokan.internal`,
                password: passwordVal,
                options: {
                  data: {
                    full_name: shopData.proprietor.trim(),
                    phone: shopData.phone.trim(),
                    role: 'owner',
                  },
                },
              });
              if (authData?.user?.id) {
                authUid = authData.user.id;
              }
            } catch (sbErr) {
              console.warn('[AmarDokan Auth] Supabase cloud registration skipped/failed:', sbErr);
            }
          }

          const newProfile: Profile = {
            id: authUid,
            store_id: storeId,
            full_name: shopData.proprietor.trim(),
            phone: shopData.phone.trim(),
            role: 'owner',
            password: passwordVal,
            pin_code: passwordVal.slice(0, 4),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await db.stores.put(newStore);
          await db.profiles.put(newProfile);

          set({ isLoading: false });
          return {
            success: true,
            message: 'আপনার দোকান সফলভাবে নথিভুক্ত হয়েছে! সুপার অ্যাডমিনের যাচাই শেষে অ্যাকাউন্ট সক্রিয় হবে।',
          };
        } catch (error) {
          console.error('Registration error:', error);
          set({ isLoading: false, loginError: 'নিবন্ধন সম্পন্ন করা যায়নি।' });
          return {
            success: false,
            message: 'নিবন্ধন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
          };
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
          activeStoreId: target.store_id,
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
          inspectingStore: null,
          activeStoreId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          loginError: null,
          isLoading: false,
        });
      },

      hasAccess: (feature) => {
        const user = get().currentUser;
        if (!user) return false;
        const role = user.role;

        // Super Admin permissions:
        // Central management: SUPER_ADMIN
        // Shop inspection: strictly read-only for INVENTORY_VIEW (products) and REPORTS (daily reports)
        // Strictly FORBIDDEN: POS (sell), BAKI (payment/credit), INVENTORY_MANAGE (maintain stock), CHALAN (supplier memos), STAFF
        if (role === 'super_admin') {
          switch (feature) {
            case 'SUPER_ADMIN':
              return true;
            case 'INVENTORY_VIEW':
              return true; // Can see shop products
            case 'REPORTS':
              return true; // Can see daily reports
            case 'POS':
            case 'BAKI':
            case 'INVENTORY_MANAGE':
            case 'CHALAN':
            case 'NET_PROFIT':
            case 'STAFF':
            default:
              return false; // Cannot sell, payment, maintain stock, or manage staff
          }
        }

        switch (feature) {
          case 'POS':
          case 'BAKI':
          case 'INVENTORY_VIEW':
            return true; // Store roles can sell, collect baki, view catalog

          case 'INVENTORY_MANAGE':
          case 'CHALAN':
            return role === 'owner' || role === 'manager';

          case 'REPORTS':
            return role === 'owner' || role === 'manager';

          case 'NET_PROFIT':
          case 'STAFF':
            return role === 'owner';

          case 'SUPER_ADMIN':
            return false;

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
