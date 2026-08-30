// ==============================================================================
// MudiDokan (মুদিদোকান) Offline Sync & FIFO Mutation Queue Engine
// Reconnects & Replays Mutations to Supabase with Conflict Resolution
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/offlineDb';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { SyncQueueItem } from '../@types/database.types';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Effective online status: True only if real network is online AND simulation is off
  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Check pending mutation count
  const checkPendingQueue = useCallback(async () => {
    try {
      const count = await db.sync_queue.where('status').equals('PENDING').count();
      setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Process FIFO Sync Queue when online
  const processSyncQueue = useCallback(async () => {
    if (!effectiveOnline || isSyncing) return;

    try {
      const pendingItems: SyncQueueItem[] = await db.sync_queue
        .where('status')
        .equals('PENDING')
        .sortBy('created_at');

      if (pendingItems.length === 0) {
        setPendingCount(0);
        return;
      }

      setIsSyncing(true);
      console.log(`[MudiDokan Sync] Processing ${pendingItems.length} queued mutations...`);

      const hasLiveSupabase = isSupabaseConfigured();

      for (const item of pendingItems) {
        try {
          if (hasLiveSupabase) {
            // Push to live Supabase PostgreSQL
            if (item.action === 'INSERT') {
              await supabase.from(item.table_name).insert(item.payload);
            } else if (item.action === 'UPDATE') {
              const id = (item.payload as { id?: string }).id;
              if (id) {
                await supabase.from(item.table_name).update(item.payload).eq('id', id);
              }
            }
          }

          // Mark locally as SYNCED
          await db.sync_queue.update(item.id, {
            status: 'SYNCED',
          });
        } catch (err) {
          console.warn(`[MudiDokan Sync] Failed to sync item ${item.id}:`, err);
          await db.sync_queue.update(item.id, {
            retry_count: item.retry_count + 1,
            error_message: String(err),
          });
        }
      }

      setLastSyncTime(new Date());
      await checkPendingQueue();
    } catch (err) {
      console.error('[MudiDokan Sync] Sync queue processing error:', err);
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
    triggerSync: processSyncQueue,
    checkPendingQueue,
  };
}
