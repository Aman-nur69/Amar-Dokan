// ==============================================================================
// Amar Dokan (আমার দোকান) Authentication & Role-Based Access Control Store
// Zustand-powered persistent state with offline profile authentication
//
// Secrets are never kept in the clear: a salted SHA-256 digest is stored and
// legacy plaintext records are upgraded the first time they are used.
// ==============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, UserSession, Profile, Store } from '../@types/database.types';
import { db, INITIAL_PROFILES, buildSyncItem } from '../db/offlineDb';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { hashSecret, verifySecret } from '../lib/secureHash';

export const DEMO_STORE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Demo shortcuts must never reach a real till. */
export const DEMO_LOGINS_ENABLED = import.meta.env.DEV;

interface AuthState {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoading: boolean;
  activeStoreId: string;
  inspectingStore: Store | null;
  /** Register lock — the till is on screen but requires a PIN to use. */
  isLocked: boolean;
  lockError: string | null;

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

  // Register lock
  lockRegister: () => void;
  unlockRegister: (pin: string) => Promise<boolean>;
  clearLockError: () => void;

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
      activeStoreId: DEMO_STORE_ID,
      inspectingStore: null,
      isLocked: false,
      lockError: null,

      clearError: () => set({ loginError: null }),
      clearLockError: () => set({ lockError: null }),

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
          activeStoreId: DEMO_STORE_ID,
          currentUser: state.currentUser ? { ...state.currentUser, store_id: DEMO_STORE_ID } : null,
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

          // 2. Direct live Supabase authentication lookup
          let profile: Profile | undefined;
          if (isSupabaseConfigured()) {
            try {
              const { data: sbProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone', cleanPhone)
                .maybeSingle();
              if (sbProfile) {
                profile = sbProfile;
                await db.profiles.put(sbProfile);
              }
            } catch (sbErr) {
              console.warn('[AmarDokan Auth] Supabase live profile query:', sbErr);
            }
          }

          if (!profile) {
            profile = await db.profiles.where('phone').equals(cleanPhone).first();
          }

          if (!profile) {
            profile = INITIAL_PROFILES.find((p) => p.phone === cleanPhone);
            if (profile) {
              await db.profiles.put(profile);
            }
          }

          if (!profile) {
            set({ isLoading: false, loginError: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' });
            return false;
          }

          if (profile.is_active === false) {
            set({
              isLoading: false,
              loginError: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। দোকান মালিকের সাথে যোগাযোগ করুন।',
            });
            return false;
          }

          // Verify against the digest, falling back to pre-seeded demo credentials or legacy plaintext.
          let stored = profile.password_hash || profile.password || profile.pin_hash || profile.pin_code;
          if (!stored) {
            const initialMatch = INITIAL_PROFILES.find((p) => p.phone === cleanPhone);
            stored = initialMatch?.password_hash || initialMatch?.password;
          }

          const { valid, needsUpgrade } = await verifySecret(cleanPhone, cleanSecret, stored);

          if (!valid) {
            set({ isLoading: false, loginError: 'ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।' });
            return false;
          }

          // Migrate the record off plaintext now that we know the secret.
          if (needsUpgrade) {
            try {
              const stored2 = await db.profiles.get(profile.id);
              if (stored2) {
                const { password: _legacyPassword, pin_code: _legacyPin, ...rest } = stored2;
                const updatedProfile = {
                  ...rest,
                  password_hash: await hashSecret(cleanPhone, cleanSecret),
                  pin_hash: _legacyPin
                    ? await hashSecret(cleanPhone, _legacyPin)
                    : rest.pin_hash,
                  updated_at: new Date().toISOString(),
                };
                await db.profiles.put(updatedProfile);
                if (isSupabaseConfigured()) {
                  await supabase.from('profiles').update(updatedProfile).eq('id', profile.id);
                }
              }
            } catch (upgradeErr) {
              console.warn('[AmarDokan Auth] Could not upgrade stored secret:', upgradeErr);
            }
          }

          // Check if store is approved (non-super_admin roles)
          if (profile.role !== 'super_admin') {
            let store: Store | null = null;
            if (isSupabaseConfigured()) {
              try {
                const { data: sbStore } = await supabase
                  .from('stores')
                  .select('*')
                  .eq('id', profile.store_id)
                  .maybeSingle();
                if (sbStore) {
                  store = sbStore;
                  await db.stores.put(sbStore);
                }
              } catch (sbErr) {
                console.warn('[AmarDokan Auth] Supabase store query:', sbErr);
              }
            }
            if (!store) {
              store = (await db.stores.get(profile.store_id)) || null;
            }

            if (store && store.verification_status === 'pending') {
              set({
                isLoading: false,
                loginError:
                  'আপনার দোকানটি এখনও সুপার অ্যাডমিন দ্বারা যাচাইাধীন। অনুগ্রহ করে অনুমোদন পর্যন্ত অপেক্ষা করুন।',
              });
              return false;
            }
            if (store && store.verification_status === 'rejected') {
              set({
                isLoading: false,
                loginError: `আবেদন প্রত্যাখ্যাত: ${store.verification_notes || 'কাগজপত্রে অসামঞ্জস্য রয়েছে।'}`,
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
            isLocked: false,
            loginError: null,
            isLoading: false,
          });
          return true;
        } catch (error) {
          console.error('[AmarDokan Auth] Login error:', error);
          set({ isLoading: false, loginError: 'লগইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' });
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
          // Client-minted ids must be real UUIDs — `store-<timestamp>` is
          // rejected by every uuid column in the cloud schema.
          const storeId = crypto.randomUUID();
          const cleanPhone = shopData.phone.trim();
          const now = new Date().toISOString();

          const existingProfile = await db.profiles.where('phone').equals(cleanPhone).first();
          if (existingProfile) {
            set({ isLoading: false });
            return {
              success: false,
              message: 'এই মোবাইল নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। সরাসরি লগইন করুন।',
            };
          }

          const newStore: Store = {
            id: storeId,
            name: shopData.shopName.trim(),
            proprietor: shopData.proprietor.trim(),
            phone: cleanPhone,
            address: shopData.address.trim(),
            trade_licence_no: shopData.tradeLicenceNo.trim(),
            trade_licence_doc_url: shopData.tradeLicenceDocUrl,
            tin_number: shopData.tinNumber.trim(),
            verification_status: 'pending',
            verification_notes: 'ট্রেড লাইসেন্স ও টিআইএন যাচাই প্রক্রিয়াধীন',
            currency_symbol: '৳',
            is_active: false,
            created_at: now,
            updated_at: now,
          };

          const passwordVal = (shopData.password || shopData.pin || '').trim();
          if (passwordVal.length < 6) {
            set({ isLoading: false });
            return { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
          }

          // If Supabase is configured, create the Auth user and directly insert to cloud
          let authUid: string = crypto.randomUUID();
          if (isSupabaseConfigured()) {
            try {
              const { data: authData } = await supabase.auth.signUp({
                email: `${cleanPhone}@mudidokan.internal`,
                password: passwordVal,
                options: {
                  data: {
                    full_name: shopData.proprietor.trim(),
                    phone: cleanPhone,
                    role: 'owner',
                  },
                },
              });
              if (authData?.user?.id) authUid = authData.user.id;
            } catch (sbErr) {
              console.warn('[AmarDokan Auth] Supabase cloud registration user signUp error:', sbErr);
            }
          }

          const newProfile: Profile = {
            id: authUid,
            store_id: storeId,
            full_name: shopData.proprietor.trim(),
            phone: cleanPhone,
            role: 'owner',
            password_hash: await hashSecret(cleanPhone, passwordVal),
            pin_hash: await hashSecret(cleanPhone, passwordVal.slice(0, 4)),
            is_active: true,
            created_at: now,
            updated_at: now,
          };

          // 1. Direct cloud push so the Super Admin immediately receives the pending request
          if (isSupabaseConfigured()) {
            try {
              const { error: storeErr } = await supabase.from('stores').upsert(newStore, { onConflict: 'id' });
              if (storeErr) {
                console.warn('[AmarDokan Auth] Direct cloud store insert note:', storeErr.message);
              }
              const { error: profileErr } = await supabase.from('profiles').upsert(
                {
                  id: newProfile.id,
                  store_id: newProfile.store_id,
                  full_name: newProfile.full_name,
                  phone: newProfile.phone,
                  role: newProfile.role,
                  is_active: true,
                  created_at: now,
                  updated_at: now,
                },
                { onConflict: 'id' }
              );
              if (profileErr) {
                console.warn('[AmarDokan Auth] Direct cloud profile insert note:', profileErr.message);
              }
            } catch (cloudErr) {
              console.warn('[AmarDokan Auth] Direct cloud insert skipped (offline fallback active):', cloudErr);
            }
          }

          // 2. Local Dexie transactional save and offline sync queue fallback
          await db.transaction('rw', [db.stores, db.profiles, db.sync_queue], async () => {
            await db.stores.put(newStore);
            await db.profiles.put(newProfile);
            await db.sync_queue.bulkAdd([
              buildSyncItem('stores', 'INSERT', newStore as unknown as Record<string, unknown>),
              buildSyncItem('profiles', 'INSERT', {
                id: newProfile.id,
                store_id: newProfile.store_id,
                full_name: newProfile.full_name,
                phone: newProfile.phone,
                role: newProfile.role,
                is_active: true,
                created_at: now,
                updated_at: now,
              }),
            ]);
          });

          set({ isLoading: false });
          return {
            success: true,
            message: 'আপনার দোকান সফলভাবে নথিভুক্ত হয়েছে! সুপার অ্যাডমিনের যাচাই শেষে অ্যাকাউন্ট সক্রিয় হবে।',
          };
        } catch (error) {
          console.error('Registration error:', error);
          set({ isLoading: false, loginError: 'নিবন্ধন সম্পন্ন করা যায়নি।' });
          return { success: false, message: 'নিবন্ধন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' };
        }
      },

      /**
       * Development-only role switcher. In a production build this refuses:
       * it used to hand out a super-admin session with no credential at all.
       */
      quickLoginDemoRole: async (role: UserRole): Promise<boolean> => {
        if (!DEMO_LOGINS_ENABLED) {
          set({ loginError: 'ডেমো লগইন বন্ধ রয়েছে। মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।' });
          return false;
        }

        set({ isLoading: true, loginError: null });
        const target = INITIAL_PROFILES.find((p) => p.role === role);
        if (!target) {
          set({ isLoading: false, loginError: 'ডেমো রোল পাওয়া যায়নি।' });
          return false;
        }

        set({
          currentUser: {
            id: target.id,
            store_id: target.store_id,
            full_name: target.full_name,
            phone: target.phone || '',
            role: target.role,
            logged_at: new Date().toISOString(),
          },
          activeStoreId: target.store_id,
          isAuthenticated: true,
          isLocked: false,
          loginError: null,
          isLoading: false,
        });
        return true;
      },

      logout: () => {
        if (isSupabaseConfigured()) {
          supabase.auth.signOut().catch(() => {});
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          inspectingStore: null,
          activeStoreId: DEMO_STORE_ID,
          loginError: null,
          isLoading: false,
          isLocked: false,
          lockError: null,
        });
      },

      lockRegister: () => set({ isLocked: true, lockError: null }),

      unlockRegister: async (pin: string): Promise<boolean> => {
        const user = get().currentUser;
        if (!user) return false;

        const entered = pin.trim();
        if (!entered) {
          set({ lockError: 'পিন দিন।' });
          return false;
        }

        try {
          const profile =
            (await db.profiles.get(user.id)) || INITIAL_PROFILES.find((p) => p.id === user.id);
          if (!profile) {
            set({ lockError: 'প্রোফাইল পাওয়া যায়নি।' });
            return false;
          }

          const stored = profile.pin_hash || profile.pin_code || profile.password_hash || profile.password;
          const { valid, needsUpgrade } = await verifySecret(user.phone, entered, stored);

          if (!valid) {
            set({ lockError: 'পিন মেলেনি। আবার চেষ্টা করুন।' });
            return false;
          }

          if (needsUpgrade) {
            const { pin_code: _legacyPin, ...rest } = profile;
            await db.profiles.put({
              ...rest,
              pin_hash: await hashSecret(user.phone, entered),
              updated_at: new Date().toISOString(),
            });
          }

          set({ isLocked: false, lockError: null });
          return true;
        } catch (err) {
          console.error('[AmarDokan Auth] Unlock error:', err);
          set({ lockError: 'পিন যাচাই করা যায়নি।' });
          return false;
        }
      },

      hasAccess: (feature) => {
        const user = get().currentUser;
        if (!user) return false;
        const role = user.role;

        // Super Admin permissions:
        // Central management: SUPER_ADMIN
        // Shop inspection: strictly read-only for INVENTORY_VIEW and REPORTS
        // Strictly FORBIDDEN: POS, BAKI, INVENTORY_MANAGE, CHALAN, STAFF
        if (role === 'super_admin') {
          switch (feature) {
            case 'SUPER_ADMIN':
            case 'INVENTORY_VIEW':
            case 'REPORTS':
              return true;
            default:
              return false;
          }
        }

        switch (feature) {
          case 'POS':
          case 'BAKI':
          case 'INVENTORY_VIEW':
            return true; // Store roles can sell, collect baki, view catalog

          case 'INVENTORY_MANAGE':
          case 'CHALAN':
          case 'REPORTS':
            return role === 'owner' || role === 'manager';

          case 'NET_PROFIT':
          case 'STAFF':
            return role === 'owner';

          case 'SUPER_ADMIN':
          default:
            return false;
        }
      },

      isSuperAdmin: () => get().currentUser?.role === 'super_admin',

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
        // activeStoreId must survive a reload. Without it the store reset to the
        // bundled demo shop while the session still belonged to a real shop, so
        // a refresh showed another tenant's stock and khata.
        activeStoreId: state.activeStoreId,
        isLocked: state.isLocked,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Belt and braces: always trust the session's own store on restore.
        if (state.currentUser?.store_id) {
          state.activeStoreId = state.currentUser.store_id;
        }
      },
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
