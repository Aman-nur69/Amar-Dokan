// ==============================================================================
// Amar Dokan (আমার দোকান) Simple & Clean Navigation Bar
// Human-Centered Design: Uncluttered, Role-Aware, & Intuitive
// ==============================================================================

import React from 'react';
import { ShoppingCart, BookOpen, Boxes, BarChart3, Users } from 'lucide-react';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { useAuthStore } from '../../hooks/useAuthStore';

export type ActiveTab = 'POS' | 'BAKI' | 'INVENTORY' | 'DASHBOARD' | 'STAFF' | 'SUPER_ADMIN';

interface MobileNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartItemCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  cartItemCount,
}) => {
  const { hasAccess, isSuperAdmin, inspectingStore, exitStoreInspection } = useAuthStore();

  // Clean, focused tabs list based on role
  // If Super Admin is NOT inspecting a specific shop, show ONLY the Super Admin portal tab to prevent ambiguity!
  const isSuperAdminWithoutShop = isSuperAdmin() && !inspectingStore;

  const allTabs = [
    {
      id: 'SUPER_ADMIN' as ActiveTab,
      label: 'কেন্দ্রীয় কন্ট্রোল প্যানেল (সব দোকান)',
      icon: Users,
      show: isSuperAdmin(),
      isSpecial: true,
    },
    {
      id: 'POS' as ActiveTab,
      label: 'বিক্রি (POS)',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? toBanglaDigits(cartItemCount) : undefined,
      show: !isSuperAdminWithoutShop && hasAccess('POS'),
    },
    {
      id: 'BAKI' as ActiveTab,
      label: 'বাকির খাতা',
      icon: BookOpen,
      show: !isSuperAdminWithoutShop && hasAccess('BAKI'),
    },
    {
      id: 'INVENTORY' as ActiveTab,
      label: 'পণ্য ও মজুদ',
      icon: Boxes,
      show: !isSuperAdminWithoutShop && hasAccess('INVENTORY_VIEW'),
    },
    {
      id: 'DASHBOARD' as ActiveTab,
      label: 'দৈনিক রিপোর্ট',
      icon: BarChart3,
      show: !isSuperAdminWithoutShop && hasAccess('REPORTS'),
    },
    {
      id: 'STAFF' as ActiveTab,
      label: 'স্টাফ ও রোল',
      icon: Users,
      show: !isSuperAdminWithoutShop && hasAccess('STAFF'),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'SUPER_ADMIN') {
      exitStoreInspection();
    }
    onTabChange(tabId);
  };

  // If Super Admin is at the central platform control center (not visiting any shop),
  // hide the sub-navigation completely so only the central dashboard is shown!
  if (isSuperAdminWithoutShop) {
    return null;
  }

  return (
    <>
      {/* 1. Desktop Simple Top Subnav */}
      <nav className="hidden md:block bg-white border-b border-slate-200 px-4 py-2 sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer select-none
                    ${
                      isActive
                        ? tab.isSpecial
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'bg-slate-900 text-white'
                        : tab.isSpecial
                        ? 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${tab.isSpecial && !isActive ? 'text-purple-700' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-black ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {isSuperAdmin() ? (
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                সুপার অ্যাডমিন প্ল্যাটফর্ম মোড
              </span>
            ) : (
              'আমার দোকান • সহজ রিটেইল পিওএস'
            )}
          </div>
        </div>
      </nav>

      {/* 2. Mobile Floating Island / Modern Glass Dock (Tailwind UI Inspired) */}
      <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-3 pointer-events-none safe-area-pb">
        <nav className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.16)] rounded-2xl sm:rounded-3xl p-1.5 flex items-center justify-around gap-1 transition-all duration-300 ring-1 ring-black/5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSpecial = tab.isSpecial;

            // Compact readable label for mobile dock
            const shortLabel =
              tab.id === 'SUPER_ADMIN'
                ? 'কন্ট্রোল'
                : tab.id === 'POS'
                ? 'বিক্রি'
                : tab.id === 'BAKI'
                ? 'বাকি'
                : tab.id === 'INVENTORY'
                ? 'মজুদ'
                : tab.id === 'DASHBOARD'
                ? 'রিপোর্ট'
                : tab.id === 'STAFF'
                ? 'স্টাফ'
                : tab.label;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl select-none transition-all duration-200 active:scale-90 cursor-pointer group
                  ${
                    isActive
                      ? isSpecial
                        ? 'bg-purple-900 text-white shadow-md shadow-purple-900/30'
                        : 'bg-slate-900 text-white shadow-md shadow-slate-900/30'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                  }
                `}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? 'scale-110 -translate-y-0.5 text-white'
                        : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black shadow-xs ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950 font-extrabold'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight transition-all duration-200 truncate max-w-[62px] mt-0.5 ${
                    isActive ? 'font-black opacity-100' : 'font-semibold opacity-75'
                  }`}
                >
                  {shortLabel}
                </span>

                {/* Subtle Glowing Active Indicator Dot */}
                {isActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-all ${
                      isSpecial ? 'bg-purple-300 animate-pulse' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
