// ==============================================================================
// Amar Dokan (আমার দোকান) App Header Component
// Simple, Clean, Human-Friendly Navbar with User Role & 1-Click Logout
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { DEFAULT_STORE, db } from '../../db/offlineDb';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useAuthStore, getRoleInfo } from '../../hooks/useAuthStore';
import { UserRole } from '../../@types/database.types';
import { Store, LogOut, ChevronDown, User, ShieldCheck } from 'lucide-react';

interface AppHeaderProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingCount,
  isSyncing,
  onTriggerSync,
}) => {
  const {
    currentUser,
    logout,
    quickLoginDemoRole,
    activeStoreId,
    isSuperAdmin,
    inspectingStore,
    exitStoreInspection,
  } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<any>(DEFAULT_STORE);
  const roleInfo = getRoleInfo(currentUser?.role);

  useEffect(() => {
    async function loadCurrentStore() {
      if (activeStoreId) {
        const s = await db.stores.get(activeStoreId);
        if (s) setCurrentStore(s);
      }
    }
    loadCurrentStore();
  }, [activeStoreId]);

  // Close menu on click outside
  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [isMenuOpen]);

  const handleRoleSwitch = (role: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    quickLoginDemoRole(role);
    setIsMenuOpen(false);
  };

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

      <header className="bg-white text-slate-800 border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                আমার দোকান
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Amar Dokan
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">
              {isSuperAdmin() ? 'প্ল্যাটফর্ম সার্বিক নিয়ন্ত্রণ' : currentStore?.name || DEFAULT_STORE.name}
            </p>
          </div>
        </div>

        {/* Right: Sync Status & User Profile Dropdown */}
        <div className="flex items-center gap-3">
          <SyncStatusIndicator
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={onToggleSimulatedOffline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            onTriggerSync={onTriggerSync}
          />

          {/* User Account / Role Badge & Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              title="ব্যবহারকারী প্রোফাইল ও রোল পরিবর্তন"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {currentUser?.full_name ? currentUser.full_name.charAt(0) : <User className="w-4 h-4" />}
              </div>

              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                  {currentUser?.full_name || 'ব্যবহারকারী'}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700">
                  {roleInfo.labelBn}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser?.phone}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-200 bg-slate-50 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${roleInfo.dotColor}`} />
                    <span>{roleInfo.labelBn}</span>
                  </div>
                </div>

                {/* Quick Role Switcher for seamless testing */}
                <div className="p-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                    রোল পরিবর্তন করুন (দ্রুত টেস্ট)
                  </p>
                  <div className="space-y-1">
                    {(['super_admin', 'owner', 'manager', 'cashier'] as UserRole[]).map((r) => {
                      const info = getRoleInfo(r);
                      const isCurrent = currentUser?.role === r;

                      return (
                        <button
                          key={r}
                          onClick={(e) => handleRoleSwitch(r, e)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{info.labelBn}</span>
                          {isCurrent && <span className="text-[10px] text-emerald-600">✓ সক্রিয়</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-1.5">
                  <button
                    onClick={() => logout()}
                    className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
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
