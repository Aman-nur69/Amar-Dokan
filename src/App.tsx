// ==============================================================================
// Amar Dokan (আমার দোকান) SaaS & Retail POS Master Shell
// Multi-Role Auth + React 19 + TypeScript + Zustand + Dexie.js
// ==============================================================================

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { initializeLocalDatabase } from './db/offlineDb';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useCartStore } from './hooks/useCartStore';
import { useAuthStore } from './hooks/useAuthStore';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNavigation, ActiveTab } from './components/layout/MobileNavigation';
// The till must open fast on a 2G connection, so only the POS screen is in the
// initial chunk; the rest arrive when the shopkeeper first opens them.
import { POSView } from './views/POSView';
const BakiKhataView = lazy(() =>
  import('./views/BakiKhataView').then((m) => ({ default: m.BakiKhataView }))
);
const InventoryView = lazy(() =>
  import('./views/InventoryView').then((m) => ({ default: m.InventoryView }))
);
const DashboardView = lazy(() =>
  import('./views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const StaffManagementView = lazy(() =>
  import('./views/StaffManagementView').then((m) => ({ default: m.StaffManagementView }))
);
const SuperAdminDashboardView = lazy(() =>
  import('./views/SuperAdminDashboardView').then((m) => ({ default: m.SuperAdminDashboardView }))
);

const ViewFallback: React.FC = () => (
  <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
    <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
    <span className="text-xs font-bold">স্ক্রিন লোড হচ্ছে...</span>
  </div>
);
import { LoginScreen } from './components/auth/LoginScreen';
import { QuickPinAuth } from './components/common/QuickPinAuth';
import { ToastHost } from './components/common/ToastHost';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Store } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    hasAccess,
    inspectingStore,
    exitStoreInspection,
    isLocked,
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('POS');
  const [isDbReady, setIsDbReady] = useState(false);

  // Set default tab on user login or role change:
  // - Super Admin without inspection -> SUPER_ADMIN
  // - Super Admin inspecting -> INVENTORY
  // - Normal users (owner, manager, cashier) -> POS
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setActiveTab('POS');
      return;
    }

    if (currentUser.role === 'super_admin') {
      if (inspectingStore) {
        setActiveTab('INVENTORY');
      } else {
        setActiveTab('SUPER_ADMIN');
      }
    } else {
      setActiveTab('POS');
    }
  }, [isAuthenticated, currentUser, inspectingStore]);

  // Synchronized tab changer: if switching to Central Panel (SUPER_ADMIN), exit inspection mode completely
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'SUPER_ADMIN') {
      exitStoreInspection();
    }
    setActiveTab(tab);
  };

  const {
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingCount,
    failedCount,
    isSyncing,
    isStoragePersisted,
    triggerSync,
    retryFailedItems,
  } = useOfflineSync();

  const { getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  // Initialize Dexie local database with seed data
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await initializeLocalDatabase();
      } catch (err) {
        console.warn('[AmarDokan App] Database initialization fallback active:', err);
      } finally {
        if (isMounted) {
          setIsDbReady(true);
        }
      }
    }
    init();

    // Fallback safety timeout so the app never hangs on initialization
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsDbReady(true);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
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
    return (
      <>
        <LoginScreen />
        <ToastHost />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Simple, Clean Header with User Profile & Logout */}
      <AppHeader
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        pendingCount={pendingCount}
        failedCount={failedCount}
        isSyncing={isSyncing}
        isStoragePersisted={isStoragePersisted}
        onTriggerSync={triggerSync}
        onRetryFailed={retryFailedItems}
      />

      {/* 2. Simple Role-Aware Navigation Bar */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={cartItemCount}
      />

      {/* 3. Active View Content (With generous bottom padding on mobile to float over modern dock) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-6">
        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<ViewFallback />}>
          {activeTab === 'SUPER_ADMIN' && (
            <SuperAdminDashboardView onNavigateToShop={() => setActiveTab('INVENTORY')} />
          )}
          {activeTab === 'POS' && <POSView />}
          {activeTab === 'BAKI' && <BakiKhataView />}
          {activeTab === 'INVENTORY' && <InventoryView />}
          {activeTab === 'DASHBOARD' && <DashboardView />}
          {activeTab === 'STAFF' && <StaffManagementView />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Register lock gate - the app stays mounted behind it. */}
      <QuickPinAuth isOpen={isLocked} />
      <ToastHost />
    </div>
  );
};

export default App;
