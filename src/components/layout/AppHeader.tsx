// ==============================================================================
// Amar Dokan (আমার দোকান) App Header Component
// Simple, Clean, Human-Friendly Navbar with User Role & 1-Click Logout
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useAuthStore, getRoleInfo } from '../../hooks/useAuthStore';
import { useActiveStore } from '../../hooks/useActiveStore';
import { Store, LogOut, ChevronDown, User, Lock } from 'lucide-react';

interface AppHeaderProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  isStoragePersisted: boolean;
  onTriggerSync: () => void;
  onRetryFailed: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingCount,
  failedCount,
  isSyncing,
  isStoragePersisted,
  onTriggerSync,
  onRetryFailed,
}) => {
  const {
    currentUser,
    logout,
    isSuperAdmin,
    inspectingStore,
    exitStoreInspection,
    lockRegister,
  } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentStore = useActiveStore();
  const roleInfo = getRoleInfo(currentUser?.role);

  // Close menu on click outside
  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [isMenuOpen]);

  return (
    <>
      {/* Superadmin Store Inspection Notification Strip */}
      {isSuperAdmin() && inspectingStore && (
        <div className="bg-purple-950 text-purple-200 px-3 sm:px-4 py-2 text-xs font-semibold border-b border-purple-800 z-50">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-xs">
                পরিদর্শন মোড: <strong>"{inspectingStore.name}"</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={exitStoreInspection}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-700 active:bg-purple-900 text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer text-center"
            >
              পোর্টালে ফিরুন ✕
            </button>
          </div>
        </div>
      )}

      <header className="bg-white text-slate-800 border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Store Name (Truncates gracefully on smaller screens) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-black text-sm sm:text-base md:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                আমার দোকান
              </h1>
              {isSuperAdmin() && !inspectingStore ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0">
                  সুপার অ্যাডমিন
                </span>
              ) : (
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                  Amar Dokan
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              {isSuperAdmin()
                ? inspectingStore
                  ? `${inspectingStore.name} • ${inspectingStore.address || inspectingStore.proprietor}`
                  : 'সেন্ট্রাল কন্ট্রোল প্যানেল'
                : currentStore?.name
                ? `${currentStore.name} • ${currentStore.address || currentStore.proprietor}`
                : 'সহজ রিটেইল পিওএস'}
            </p>
          </div>
        </div>

        {/* Right: Sync Status & User Profile Dropdown (Never shrink, always fully visible) */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <SyncStatusIndicator
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={onToggleSimulatedOffline}
            pendingCount={pendingCount}
            failedCount={failedCount}
            isSyncing={isSyncing}
            isStoragePersisted={isStoragePersisted}
            onTriggerSync={onTriggerSync}
            onRetryFailed={onRetryFailed}
          />

          {/* Register lock - documented in the README but never implemented. */}
          {!isSuperAdmin() && (
            <button
              onClick={lockRegister}
              title="ক্যাশ রেজিস্টার লক করুন"
              aria-label="ক্যাশ রেজিস্টার লক করুন"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* User Account / Role Badge & Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left cursor-pointer"
              title="ব্যবহারকারী প্রোফাইল"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                {currentUser?.full_name ? currentUser.full_name.charAt(0) : <User className="w-4 h-4" />}
              </div>

              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                  {currentUser?.full_name || 'ব্যবহারকারী'}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700">
                  {roleInfo.labelBn}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser?.phone}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-200 bg-slate-50 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${roleInfo.dotColor}`} />
                    <span>{roleInfo.labelBn}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-1.5">
                  <button
                    onClick={() => logout()}
                    className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};
