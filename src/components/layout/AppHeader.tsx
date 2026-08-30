// ==============================================================================
// MudiDokan (মুদিদোকান) App Header Component
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { DEFAULT_STORE } from '../../db/offlineDb';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { Store, Lock, Clock } from 'lucide-react';

interface AppHeaderProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onLockApp: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingCount,
  isSyncing,
  onTriggerSync,
  onLockApp,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'দুপুর' : 'সকাল';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;

      setTimeStr(`${period} ${toBanglaDigits(hours)}:${toBanglaDigits(minutes)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Store Brand & Location */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg leading-tight text-white tracking-wide">
                {DEFAULT_STORE.name}
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-bold text-emerald-400 border border-slate-700">
                মুদিদোকান POS v২.০
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {DEFAULT_STORE.proprietor} • {DEFAULT_STORE.address}
            </p>
          </div>
        </div>

        {/* Right: Live Clock, Sync Badge & Lock Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-xs font-semibold text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{timeStr}</span>
          </div>

          <SyncStatusIndicator
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={onToggleSimulatedOffline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            onTriggerSync={onTriggerSync}
          />

          <button
            onClick={onLockApp}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
            title="ক্যাশ রেজিস্টার লক করুন"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
