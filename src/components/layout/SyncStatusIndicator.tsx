// ==============================================================================
// MudiDokan (মুদিদোকান) Real-time Supabase Cloud Database Status Indicator
// ==============================================================================

import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

interface SyncStatusIndicatorProps {
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
  pendingCount?: number;
  failedCount?: number;
  isSyncing?: boolean;
  isStoragePersisted?: boolean;
  onTriggerSync?: () => void;
  onRetryFailed?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = () => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div
        title="সরাসরি Supabase ক্লাউড ডাটাবেজ এর সাথে সংযুক্ত"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-bold border border-emerald-200/80 shadow-2xs"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Database className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">ক্লাউড ডাটাবেজ লাইভ</span>
        <CheckCircle2 className="w-3 h-3 text-emerald-500 hidden md:inline" />
      </div>
    </div>
  );
};
