// ==============================================================================
// MudiDokan (মুদিদোকান) SaaS & Offline POS Master App Shell
// React 19 + TypeScript + Zustand + Dexie.js + Offline FIFO Sync Engine
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { initializeLocalDatabase } from './db/offlineDb';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useCartStore } from './hooks/useCartStore';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNavigation, ActiveTab } from './components/layout/MobileNavigation';
import { POSView } from './views/POSView';
import { BakiKhataView } from './views/BakiKhataView';
import { InventoryView } from './views/InventoryView';
import { DashboardView } from './views/DashboardView';
import { QuickPinAuth } from './components/common/QuickPinAuth';
import { WifiOff, AlertCircle } from 'lucide-react';
import { toBanglaDigits } from './lib/banglaNumberFormatter';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('POS');
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const {
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingCount,
    isSyncing,
    triggerSync,
  } = useOfflineSync();

  const { getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  // Initialize Dexie local database with seed data
  useEffect(() => {
    async function init() {
      try {
        await initializeLocalDatabase();
        setIsDbReady(true);
      } catch (err) {
        console.error('[MudiDokan App] Database initialization error:', err);
      }
    }
    init();
  }, []);

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center text-3xl font-black mb-4 shadow-xl shadow-emerald-500/20 animate-bounce">
          🏪
        </div>
        <h1 className="text-2xl font-black tracking-wide text-emerald-400 mb-2">
          মুদিদোকান (MudiDokan)
        </h1>
        <p className="text-sm text-slate-400 animate-pulse">
          অফলাইন ডেটাবেজ প্রস্তুত করা হচ্ছে, দয়া করে অপেক্ষা করুন...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Header with Store Identity, Live Clock, & Sync Engine Status */}
      <AppHeader
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onTriggerSync={triggerSync}
        onLockApp={() => setIsLocked(true)}
      />

      {/* 2. Desktop Navigation Bar (and bottom dock for mobile) */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={cartItemCount}
      />

      {/* 3. Offline Alert Banner (Appears when mobile network drops) */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>
                ইন্টারনেট সংযোগ বিচ্ছিন্ন (অফলাইন মোড সক্রিয়)। আপনি নির্বিঘ্নে বিক্রি ও বাকি আদায় চালিয়ে যান,
                ইন্টারনেট আসলে স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হবে।
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[11px] font-black">
                {toBanglaDigits(pendingCount)} টি লেনদেন মেমরিতে সংরক্ষিত
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Active View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activeTab === 'POS' && <POSView />}
        {activeTab === 'BAKI' && <BakiKhataView />}
        {activeTab === 'INVENTORY' && <InventoryView />}
        {activeTab === 'DASHBOARD' && <DashboardView />}
      </main>

      {/* 5. Quick PIN Lock Screen */}
      <QuickPinAuth
        isOpen={isLocked}
        onClose={() => setIsLocked(false)}
        onSuccess={() => setIsLocked(false)}
      />
    </div>
  );
};

export default App;
