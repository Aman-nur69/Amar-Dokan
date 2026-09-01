// ==============================================================================
// Amar Dokan (আমার দোকান) Active Store Resolver
// Anything customer-facing — receipts, reminders, statements — must carry the
// signed-in shop's identity, never the bundled demo shop.
// ==============================================================================

import { useEffect, useState } from 'react';
import { db, DEFAULT_STORE } from '../db/offlineDb';
import { Store } from '../@types/database.types';
import { useAuthStore } from './useAuthStore';

export function useActiveStore(): Store {
  const { activeStoreId } = useAuthStore();
  const [store, setStore] = useState<Store>(DEFAULT_STORE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeStoreId) return;
      try {
        const found = await db.stores.get(activeStoreId);
        if (found && !cancelled) setStore(found);
      } catch (err) {
        console.warn('[useActiveStore] Could not load store, using fallback:', err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeStoreId]);

  return store;
}
