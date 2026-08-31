import React from 'react';
import {
  ShoppingCart,
  BookOpen,
  Boxes,
  BarChart3,
  Users,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useSuperAdminNavStore } from '../../hooks/useSuperAdminNavStore';

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
  const {
    adminTab,
    setAdminTab,
    openAddShopModal,
    totalShopsCount,
    pendingShopsCount,
    approvedShopsCount,
  } = useSuperAdminNavStore();

  // If Super Admin is at the central platform (not inspecting a specific shop),
  // show dedicated Admin Management Tabs that match the exact same look & feel as shop tabs!
  const isSuperAdminPlatform = isSuperAdmin() && !inspectingStore;

  if (isSuperAdminPlatform) {
    const adminNavTabs = [
      {
        id: 'ALL' as const,
        label: 'সব দোকান',
        mobileLabel: 'সব দোকান',
        icon: Building2,
        badge: totalShopsCount > 0 ? toBanglaDigits(totalShopsCount) : undefined,
        isActive: adminTab === 'ALL',
        onClick: () => {
          onTabChange('SUPER_ADMIN');
          setAdminTab('ALL');
        },
      },
      {
        id: 'pending' as const,
        label: 'অপেক্ষমাণ অনুমোদন',
        mobileLabel: 'অপেক্ষমাণ',
        icon: Clock,
        badge: pendingShopsCount > 0 ? toBanglaDigits(pendingShopsCount) : undefined,
        badgeColor: 'bg-amber-500 text-white',
        isActive: adminTab === 'pending',
        onClick: () => {
          onTabChange('SUPER_ADMIN');
          setAdminTab('pending');
        },
      },
      {
        id: 'approved' as const,
        label: 'অনুমোদিত দোকান',
        mobileLabel: 'অনুমোদিত',
        icon: CheckCircle2,
        badge: approvedShopsCount > 0 ? toBanglaDigits(approvedShopsCount) : undefined,
        badgeColor: 'bg-emerald-500 text-white',
        isActive: adminTab === 'approved',
        onClick: () => {
          onTabChange('SUPER_ADMIN');
          setAdminTab('approved');
        },
      },
      {
        id: 'ADD_SHOP' as const,
        label: '+ নতুন দোকান',
        mobileLabel: '+ দোকান',
        icon: Plus,
        isAction: true,
        isActive: false,
        onClick: () => {
          openAddShopModal();
        },
      },
    ];

    return (
      <>
        {/* 1. Desktop Simple Top Subnav for Super Admin */}
        <nav className="hidden md:block bg-white border-b border-slate-200 px-4 py-2 sticky top-[61px] z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {adminNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.isActive;

                return (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer select-none
                      ${
                        isActive
                          ? 'bg-purple-900 text-white shadow-xs'
                          : tab.isAction
                          ? 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-black ${
                          isActive
                            ? 'bg-purple-700 text-white'
                            : tab.badgeColor || 'bg-slate-900 text-white'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-medium flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                সুপার অ্যাডমিন প্ল্যাটফর্ম
              </span>
            </div>
          </div>
        </nav>

        {/* 2. Mobile Floating Island / Modern Glass Dock for Super Admin */}
        <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-3 pointer-events-none safe-area-pb">
          <nav className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.16)] rounded-2xl sm:rounded-3xl p-1.5 flex items-center justify-around gap-1 transition-all duration-300 ring-1 ring-black/5">
            {adminNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.isActive;

              return (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`
                    relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl select-none transition-all duration-200 active:scale-90 cursor-pointer group
                    ${
                      isActive
                        ? 'bg-purple-900 text-white shadow-md shadow-purple-900/30'
                        : tab.isAction
                        ? 'text-purple-700 hover:bg-purple-50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                    }
                  `}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive
                          ? 'scale-110 -translate-y-0.5 text-white'
                          : tab.isAction
                          ? 'text-purple-700'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                    {tab.badge && (
                      <span
                        className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black shadow-xs ${
                          isActive
                            ? 'bg-purple-300 text-purple-950'
                            : tab.badgeColor || 'bg-slate-900 text-white'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] tracking-tight transition-all duration-200 truncate max-w-[68px] mt-0.5 ${
                      isActive ? 'font-black opacity-100' : 'font-semibold opacity-75'
                    }`}
                  >
                    {tab.mobileLabel}
                  </span>

                  {/* Subtle Glowing Active Indicator Dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5 transition-all bg-purple-300 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </>
    );
  }

  // Shop Level Tabs (For Shop Owner, Manager, Cashier, or Super Admin inspecting a shop)
  const allTabs = [
    {
      id: 'SUPER_ADMIN' as ActiveTab,
      label: 'কেন্দ্রীয় কন্ট্রোল প্যানেল',
      icon: ShieldCheck,
      show: isSuperAdmin(),
      isSpecial: true,
    },
    {
      id: 'POS' as ActiveTab,
      label: 'বিক্রি (POS)',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? toBanglaDigits(cartItemCount) : undefined,
      show: !isSuperAdmin() && hasAccess('POS'),
    },
    {
      id: 'BAKI' as ActiveTab,
      label: 'বাকির খাতা',
      icon: BookOpen,
      show: !isSuperAdmin() && hasAccess('BAKI'),
    },
    {
      id: 'INVENTORY' as ActiveTab,
      label: 'পণ্য ও মজুদ',
      icon: Boxes,
      show: hasAccess('INVENTORY_VIEW'),
    },
    {
      id: 'DASHBOARD' as ActiveTab,
      label: 'দৈনিক রিপোর্ট',
      icon: BarChart3,
      show: hasAccess('REPORTS'),
    },
    {
      id: 'STAFF' as ActiveTab,
      label: 'স্টাফ ও রোল',
      icon: Users,
      show: hasAccess('STAFF'),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'SUPER_ADMIN') {
      exitStoreInspection();
    }
    onTabChange(tabId);
  };

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
                সুপার অ্যাডমিন পরিদর্শন মোড
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
                ? 'প্যানেল'
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

