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
