// ==============================================================================
// MudiDokan (মুদিদোকান) Real-time Sync Status Indicator & Test Switch
// ==============================================================================

import React from 'react';
<<<<<<< HEAD
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
=======
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
>>>>>>> c18622f (Bug Fix)
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingCount: number;
<<<<<<< HEAD
  isSyncing: boolean;
  onTriggerSync: () => void;
=======
  failedCount: number;
  isSyncing: boolean;
  isStoragePersisted: boolean;
  onTriggerSync: () => void;
  onRetryFailed: () => void;
>>>>>>> c18622f (Bug Fix)
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingCount,
<<<<<<< HEAD
  isSyncing,
  onTriggerSync,
=======
  failedCount,
  isSyncing,
  isStoragePersisted,
  onTriggerSync,
  onRetryFailed,
>>>>>>> c18622f (Bug Fix)
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Live Badge */}
      {isSyncing ? (
        <button
          onClick={onTriggerSync}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/10 text-blue-700 text-[10px] sm:text-xs font-bold border border-blue-200 animate-pulse cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
          <span className="hidden xs:inline">সিঙ্ক ({toBanglaDigits(pendingCount)})</span>
        </button>
      ) : isOnline ? (
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold border border-emerald-200">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
          <span className="hidden md:inline">অনলাইন</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-amber-50 text-amber-800 text-[10px] sm:text-xs font-bold border border-amber-300">
          <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
          <span>অফলাইন{pendingCount > 0 ? ` (${toBanglaDigits(pendingCount)})` : ''}</span>
        </div>
      )}

<<<<<<< HEAD
      {/* Storage Persistence Guaranteed Badge (Hidden on very narrow screens) */}
      <div
        title="মেমরি সুরক্ষা সক্রিয়: ব্রাউজার বা মোবাইল এই ডেটা কখনো মুছবে না"
        className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-600 cursor-help"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>মেমরি সুরক্ষিত</span>
=======
      {/* Failed mutations need a human, so they get their own affordance. */}
      {failedCount > 0 && (
        <button
          onClick={onRetryFailed}
          title="কিছু তথ্য ক্লাউডে পাঠানো যায়নি"
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-50 border border-rose-300 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{toBanglaDigits(failedCount)} টি আটকে আছে</span>
        </button>
      )}

      {/* Real storage-persistence state. This badge was hardcoded, so it claimed
          the data was protected even when the browser had refused. */}
      <div
        title={isStoragePersisted ? 'মেমরি সুরক্ষা সক্রিয়' : 'সতর্কতা: ব্রাউজার স্টোরেজ সুরক্ষা দেয়নি। নিয়মিত ব্যাকআপ নিন।'}
        className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-semibold cursor-help ${
          isStoragePersisted
            ? 'bg-slate-100 border-slate-200/80 text-slate-600'
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isStoragePersisted ? 'bg-emerald-500' : 'bg-amber-500'}`}
        />
        <span>{isStoragePersisted ? 'মেমরি সুরক্ষিত' : 'মেমরি অরক্ষিত'}</span>
>>>>>>> c18622f (Bug Fix)
      </div>

      {/* Offline Test Simulation Button */}
      <button
        onClick={onToggleSimulatedOffline}
        title="ইন্টারনেট ড্রপ পরীক্ষা করুন"
        className={`px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-colors cursor-pointer ${
          isSimulatedOffline
            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
        }`}
      >
        {isSimulatedOffline ? 'অফলাইন টেস্ট অন' : 'টেস্ট'}
      </button>
    </div>
  );
};
