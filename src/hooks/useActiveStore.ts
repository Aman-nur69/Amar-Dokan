// ==============================================================================
// Amar Dokan (আমার দোকান) Active Store Resolver
// Queries Supabase live database for active store identity
// ==============================================================================

import { useEffect, useState } from 'react';
import { Store } from '../@types/database.types';
import { useAuthStore } from './useAuthStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export const DEFAULT_STORE: Store = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'আমার দোকান (Amar Dokan)',
  proprietor: '',
  phone: '',
  address: '',
  currency_symbol: '৳',
  verification_status: 'approved',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useActiveStore(): Store {
  const { activeStoreId } = useAuthStore();
  const [store, setStore] = useState<Store>(DEFAULT_STORE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeStoreId) return;
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', activeStoreId)
            .maybeSingle();

          if (!error && data && !cancelled) {
            setStore(data);
            return;
          }
        }
      } catch (err) {
        console.warn('[useActiveStore] Could not load store from Supabase:', err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeStoreId]);

  return store;
}
