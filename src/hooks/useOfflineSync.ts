// ==============================================================================
// MudiDokan (মুদিদোকান) Offline Sync & FIFO Mutation Queue Engine
// Reconnects & Replays Mutations to Supabase with Conflict Resolution
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/offlineDb';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { SyncQueueItem } from '../@types/database.types';

// Relational hierarchy for foreign-key safety:
// Parent records must insert before child records, but delete after child records.
const TABLE_HIERARCHY_RANK: Record<string, number> = {
  stores: 1,
  profiles: 2,
  categories: 3,
  products: 4,
  customers: 5,
  sales: 6,
  sale_items: 7,
  baki_transactions: 8,
  expenses: 9,
  supplier_chalans: 10,
  chalan_items: 11,
  supplier_payments: 12,
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isStoragePersisted, setIsStoragePersisted] = useState<boolean>(true);

  // Effective online status: True only if real network is online AND simulation is off
  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Check storage persistence status
  useEffect(() => {
    async function checkPersist() {
      if (navigator.storage && navigator.storage.persisted) {
        try {
          const persisted = await navigator.storage.persisted();
          setIsStoragePersisted(persisted);
        } catch {
          // ignore
        }
      }
    }
    checkPersist();
  }, []);

  // Check pending mutation count
  const checkPendingQueue = useCallback(async () => {
    try {
      const count = await db.sync_queue.where('status').equals('PENDING').count();
      setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Process Dependency-Ordered Sync Queue when online
  const processSyncQueue = useCallback(async () => {
    if (!effectiveOnline || isSyncing) return;

    try {
      const rawPendingItems: SyncQueueItem[] = await db.sync_queue
        .where('status')
        .equals('PENDING')
        .toArray();

      if (rawPendingItems.length === 0) {
        setPendingCount(0);
        return;
      }

      // Sort items topologically to guarantee Foreign Key integrity:
      // - For INSERT and UPDATE: lowest rank first (parent -> child)
      // - For DELETE: highest rank first (child -> parent)
      const sortedItems = [...rawPendingItems].sort((a, b) => {
        const rankA = TABLE_HIERARCHY_RANK[a.table_name] || 99;
        const rankB = TABLE_HIERARCHY_RANK[b.table_name] || 99;

        if (a.action === 'DELETE' && b.action === 'DELETE') {
          return rankB - rankA; // child before parent
        }
        if (a.action === 'DELETE') return 1;
        if (b.action === 'DELETE') return -1;

        if (rankA !== rankB) return rankA - rankB; // parent before child
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setIsSyncing(true);
      console.log(`[AmarDokan Sync] Processing ${sortedItems.length} ordered mutations...`);

      const hasLiveSupabase = isSupabaseConfigured();

      for (const item of sortedItems) {
        // Poison pill guard: quarantine mutations that exceeded retry threshold
        if (item.retry_count >= 5) {
          console.warn(`[AmarDokan Sync] Item ${item.id} quarantined due to excessive retries.`);
          await db.sync_queue.update(item.id, {
            status: 'FAILED',
            error_message: 'Max retry attempts (5) reached.',
          });
          continue;
        }

        try {
          if (hasLiveSupabase) {
            const recordId = (item.payload as { id?: string })?.id;

            if (item.action === 'INSERT') {
              // Upsert to handle offline idempotent replays smoothly
              await supabase.from(item.table_name).upsert(item.payload, { onConflict: 'id' });
            } else if (item.action === 'UPDATE') {
              if (recordId) {
                await supabase.from(item.table_name).update(item.payload).eq('id', recordId);
              }
            } else if (item.action === 'DELETE') {
              if (recordId) {
                await supabase.from(item.table_name).delete().eq('id', recordId);
              }
            }
          }

          // Mark locally as SYNCED
          await db.sync_queue.update(item.id, {
            status: 'SYNCED',
          });
        } catch (err) {
          console.warn(`[AmarDokan Sync] Failed to sync item ${item.id}:`, err);
          const nextRetry = (item.retry_count || 0) + 1;
          await db.sync_queue.update(item.id, {
            retry_count: nextRetry,
            status: nextRetry >= 5 ? 'FAILED' : 'PENDING',
            error_message: String(err),
          });
        }
      }

      setLastSyncTime(new Date());
      await checkPendingQueue();
    } catch (err) {
      console.error('[AmarDokan Sync] Sync queue processing error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [effectiveOnline, isSyncing, checkPendingQueue]);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkPendingQueue();

    // Periodic sync poll every 10 seconds
    const interval = setInterval(() => {
      checkPendingQueue();
      if (effectiveOnline) {
        processSyncQueue();
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [effectiveOnline, checkPendingQueue, processSyncQueue]);

  // When network transitions back to online, immediately trigger FIFO queue processing
  useEffect(() => {
    if (effectiveOnline) {
      processSyncQueue();
    }
  }, [effectiveOnline, processSyncQueue]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  return {
    isOnline: effectiveOnline,
    isRealOnline: isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    isStoragePersisted,
    triggerSync: processSyncQueue,
    checkPendingQueue,
  };
}
