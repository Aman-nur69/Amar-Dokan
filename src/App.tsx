// ==============================================================================
// Amar Dokan (আমার দোকান) SaaS & Retail POS Master Shell
// Multi-Role Auth + React 19 + TypeScript + Zustand + Dexie.js
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { initializeLocalDatabase } from './db/offlineDb';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useCartStore } from './hooks/useCartStore';
import { useAuthStore } from './hooks/useAuthStore';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNavigation, ActiveTab } from './components/layout/MobileNavigation';
import { POSView } from './views/POSView';
import { BakiKhataView } from './views/BakiKhataView';
import { InventoryView } from './views/InventoryView';
import { DashboardView } from './views/DashboardView';
import { StaffManagementView } from './views/StaffManagementView';
import { LoginScreen } from './components/auth/LoginScreen';
import { WifiOff, Store } from 'lucide-react';
import { toBanglaDigits } from './lib/banglaNumberFormatter';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('POS');
  const [isDbReady, setIsDbReady] = useState(false);

  const { isAuthenticated, hasAccess } = useAuthStore();

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
        console.error('[AmarDokan App] Database initialization error:', err);
      }
    }
    init();
  }, []);

  // Make sure active tab is allowed for current role
  useEffect(() => {
    if (activeTab === 'STAFF' && !hasAccess('STAFF')) {
      setActiveTab('POS');
    } else if (activeTab === 'DASHBOARD' && !hasAccess('REPORTS')) {
      setActiveTab('POS');
    }
  }, [activeTab, hasAccess]);

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-3xl font-black mb-4 shadow-xl shadow-emerald-600/20 animate-bounce">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-wide text-white mb-2">
          আমার দোকান <span className="text-emerald-400 font-bold text-lg">(Amar Dokan)</span>
        </h1>
        <p className="text-sm text-slate-400 animate-pulse">
          ডেটাবেজ ও কনফিগারেশন প্রস্তুত করা হচ্ছে, দয়া করে অপেক্ষা করুন...
        </p>
      </div>
    );
  }

  // If not logged in, display the clean Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Simple, Clean Header with User Profile & Logout */}
      <AppHeader
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onTriggerSync={triggerSync}
      />

      {/* 2. Simple Role-Aware Navigation Bar */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={cartItemCount}
      />

      {/* 3. Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>
                ইন্টারনেট সংযোগ বিচ্ছিন্ন (অফলাইন মোড সক্রিয়)। আপনি নির্বিঘ্নে বিক্রি ও হিসাব চালিয়ে যান,
                সংযোগ আসলে ক্লাউডে সিঙ্ক হবে।
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
        {activeTab === 'STAFF' && <StaffManagementView />}
      </main>
    </div>
  );
};

export default App;
