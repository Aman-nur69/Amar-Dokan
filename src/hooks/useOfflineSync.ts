// ==============================================================================
// MudiDokan (মুদিদোকান) Offline Sync & FIFO Mutation Queue Engine
// Reconnects & Replays Mutations to Supabase with Conflict Resolution
// ==============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
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
  cash_counts: 13,
  day_closings: 14,
};

const MAX_RETRIES = 5;
const SYNCED_RETENTION_MS = 24 * 60 * 60 * 1000; // keep a day of history, then prune

/** 5s, 20s, 45s, 80s, 125s — enough to ride out a 2G dropout without hammering. */
function backoffDelayMs(retryCount: number): number {
  return Math.min(5000 * retryCount * retryCount, 5 * 60 * 1000);
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amar_dokan_simulated_offline') === '1';
    } catch {
      return false;
    }
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isStoragePersisted, setIsStoragePersisted] = useState<boolean>(false);

  // A ref, not state: the previous version put isSyncing in the callback deps,
  // so finishing a run re-created the callback, re-fired the effect and looped
  // instantly — burning all five retries in a couple of seconds.
  const syncingRef = useRef(false);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Check storage persistence status
  useEffect(() => {
    async function checkPersist() {
      if (navigator.storage && navigator.storage.persisted) {
        try {
          setIsStoragePersisted(await navigator.storage.persisted());
        } catch {
          setIsStoragePersisted(false);
        }
      }
    }
    checkPersist();
  }, []);

  const checkPendingQueue = useCallback(async () => {
    try {
      const [pending, failed] = await Promise.all([
        db.sync_queue.where('status').equals('PENDING').count(),
        db.sync_queue.where('status').equals('FAILED').count(),
      ]);
      setPendingCount(pending);
      setFailedCount(failed);
    } catch {
      // ignore
    }
  }, []);

  /** Drops long-since-synced rows so IndexedDB does not grow without bound. */
  const pruneSyncedHistory = useCallback(async () => {
    try {
      const cutoff = Date.now() - SYNCED_RETENTION_MS;
      const stale = await db.sync_queue.where('status').equals('SYNCED').toArray();
      const expired = stale
        .filter((item) => new Date(item.synced_at || item.created_at).getTime() < cutoff)
        .map((item) => item.id);
      if (expired.length > 0) await db.sync_queue.bulkDelete(expired);
    } catch {
      // ignore
    }
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (!effectiveOnline || syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const now = Date.now();
      const rawPendingItems: SyncQueueItem[] = await db.sync_queue
        .where('status')
        .equals('PENDING')
        .toArray();

      // Respect backoff windows.
      const dueItems = rawPendingItems.filter(
        (item) => !item.next_attempt_at || item.next_attempt_at <= now
      );

      if (dueItems.length === 0) {
        setPendingCount(rawPendingItems.length);
        return;
      }

      // Sort topologically to guarantee Foreign Key integrity:
      // - INSERT / UPDATE: lowest rank first (parent -> child)
      // - DELETE: highest rank first (child -> parent)
      const sortedItems = [...dueItems].sort((a, b) => {
        const rankA = TABLE_HIERARCHY_RANK[a.table_name] || 99;
        const rankB = TABLE_HIERARCHY_RANK[b.table_name] || 99;

        if (a.action === 'DELETE' && b.action === 'DELETE') return rankB - rankA;
        if (a.action === 'DELETE') return 1;
        if (b.action === 'DELETE') return -1;

        if (rankA !== rankB) return rankA - rankB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      console.log(`[AmarDokan Sync] Processing ${sortedItems.length} ordered mutations...`);

      const hasLiveSupabase = isSupabaseConfigured();
      if (!hasLiveSupabase) {
        // Nothing is configured to sync to — leave the queue untouched rather
        // than pretending the rows reached a server.
        setLastSyncError('ক্লাউড কনফিগার করা নেই — সব তথ্য ডিভাইসে সংরক্ষিত আছে।');
        return;
      }

      let firstError: string | null = null;

      for (const item of sortedItems) {
        if (item.retry_count >= MAX_RETRIES) {
          await db.sync_queue.update(item.id, {
            status: 'FAILED',
            error_message: `Max retry attempts (${MAX_RETRIES}) reached.`,
          });
          continue;
        }

        try {
          const recordId = (item.payload as { id?: string })?.id;

          // supabase-js resolves with { data, error }; it does NOT throw.
          // Not reading `error` was silently marking rejected rows as synced.
          let error: { message: string } | null = null;

          if (item.action === 'INSERT') {
            ({ error } = await supabase
              .from(item.table_name)
              .upsert(item.payload, { onConflict: 'id' }));
          } else if (item.action === 'UPDATE') {
            if (!recordId) throw new Error('UPDATE payload is missing an id');
            ({ error } = await supabase.from(item.table_name).update(item.payload).eq('id', recordId));
          } else if (item.action === 'DELETE') {
            if (!recordId) throw new Error('DELETE payload is missing an id');
            ({ error } = await supabase.from(item.table_name).delete().eq('id', recordId));
          }

          if (error) throw new Error(error.message);

          await db.sync_queue.update(item.id, {
            status: 'SYNCED',
            synced_at: new Date().toISOString(),
            error_message: undefined,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[AmarDokan Sync] Failed to sync item ${item.id}:`, message);
          if (!firstError) firstError = message;

          const nextRetry = (item.retry_count || 0) + 1;
          await db.sync_queue.update(item.id, {
            retry_count: nextRetry,
            status: nextRetry >= MAX_RETRIES ? 'FAILED' : 'PENDING',
            next_attempt_at: Date.now() + backoffDelayMs(nextRetry),
            error_message: message,
          });
        }
      }

      setLastSyncError(firstError);
      setLastSyncTime(new Date());
      await pruneSyncedHistory();
    } catch (err) {
      console.error('[AmarDokan Sync] Sync queue processing error:', err);
      setLastSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await checkPendingQueue();
    }
  }, [effectiveOnline, checkPendingQueue, pruneSyncedHistory]);

  // Network event listeners + periodic poll
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingQueue();

    const interval = setInterval(() => {
      checkPendingQueue();
      if (effectiveOnline) processSyncQueue();
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [effectiveOnline, checkPendingQueue, processSyncQueue]);

  // Immediately drain the queue when connectivity returns.
  useEffect(() => {
    if (effectiveOnline) processSyncQueue();
  }, [effectiveOnline, processSyncQueue]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('amar_dokan_simulated_offline', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  /** Puts quarantined rows back in the queue — used by the sync detail panel. */
  const retryFailedItems = useCallback(async () => {
    const failed = await db.sync_queue.where('status').equals('FAILED').toArray();
    await Promise.all(
      failed.map((item) =>
        db.sync_queue.update(item.id, { status: 'PENDING', retry_count: 0, next_attempt_at: undefined })
      )
    );
    await checkPendingQueue();
    await processSyncQueue();
  }, [checkPendingQueue, processSyncQueue]);

  return {
    isOnline: effectiveOnline,
    isRealOnline: isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingCount,
    failedCount,
    isSyncing,
    lastSyncTime,
    lastSyncError,
    isStoragePersisted,
    triggerSync: processSyncQueue,
    checkPendingQueue,
    retryFailedItems,
  };
}
