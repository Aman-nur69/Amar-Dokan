// ==============================================================================
// MudiDokan (মুদিদোকান) Real-time Sync Status Indicator & Test Switch
// ==============================================================================

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingCount,
  isSyncing,
  onTriggerSync,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Live Badge */}
      {isSyncing ? (
        <button
          onClick={onTriggerSync}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/40 animate-pulse"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>সিঙ্ক হচ্ছে ({toBanglaDigits(pendingCount)})...</span>
        </button>
      ) : isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">অনলাইন (ক্লাউড সক্রিয়)</span>
          <span className="sm:hidden">অনলাইন</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>অফলাইন ({toBanglaDigits(pendingCount)} জমা)</span>
        </div>
      )}

      {/* Offline Test Simulation Button */}
      <button
        onClick={onToggleSimulatedOffline}
        title="ইন্টারনেট ড্রপ পরীক্ষা করুন"
        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
          isSimulatedOffline
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
        }`}
      >
        {isSimulatedOffline ? 'অফলাইন টেস্ট চলছে' : 'অফলাইন টেস্ট'}
      </button>
    </div>
  );
};
