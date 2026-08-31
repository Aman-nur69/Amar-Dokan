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
  const { hasAccess, isSuperAdmin } = useAuthStore();

  // Clean, focused tabs list based on role
  const allTabs = [
    {
      id: 'SUPER_ADMIN' as ActiveTab,
      label: 'সব দোকান (ওভারভিউ)',
      icon: Users,
      show: isSuperAdmin(),
    },
    {
      id: 'POS' as ActiveTab,
      label: 'বিক্রি (POS)',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? toBanglaDigits(cartItemCount) : undefined,
      show: hasAccess('POS'),
    },
    {
      id: 'BAKI' as ActiveTab,
      label: 'বাকির খাতা',
      icon: BookOpen,
      show: hasAccess('BAKI'),
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
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer select-none
                    ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
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
            আমার দোকান • সহজ রিটেইল পিওএস
          </div>
        </div>
      </nav>

      {/* 2. Mobile Bottom Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg safe-area-pb">
        <div
          className="grid h-14 max-w-md mx-auto"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 select-none transition-colors
                  ${isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}
                `}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight">{tab.label}</span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
