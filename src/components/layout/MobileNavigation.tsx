// ==============================================================================
// MudiDokan (মুদিদোকান) Mobile Bottom Dock & Desktop Tab Navigation
// Touch Hitboxes >= 56px, High-Contrast Bengali Semantics, and Cart Badges
// ==============================================================================

import React from 'react';
import { ShoppingCart, BookOpen, Boxes, BarChart3 } from 'lucide-react';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';

export type ActiveTab = 'POS' | 'BAKI' | 'INVENTORY' | 'DASHBOARD';

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
  const tabs = [
    {
      id: 'POS' as ActiveTab,
      label: 'ক্যাশ বিক্রি',
      subLabel: 'POS স্ক্রিন',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? toBanglaDigits(cartItemCount) : undefined,
    },
    {
      id: 'BAKI' as ActiveTab,
      label: 'বাকির খাতা',
      subLabel: 'লেজার ও তাগাদা',
      icon: BookOpen,
    },
    {
      id: 'INVENTORY' as ActiveTab,
      label: 'পণ্য মজুদ',
      subLabel: 'স্টক ও আগমন',
      icon: Boxes,
    },
    {
      id: 'DASHBOARD' as ActiveTab,
      label: 'দৈনিক হিসাব',
      subLabel: 'প্রফিট ও রিপোর্ট',
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* 1. Desktop / Tablet Top Subnav (visible md and up) */}
      <nav className="hidden md:block bg-white border-b border-slate-200 px-4 py-2 sticky top-[65px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-150 select-none
                    ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-bold text-slate-500">
            মুদিদোকান • অফলাইন ক্যাশ ও বাকির খাতা
          </div>
        </div>
      </nav>

      {/* 2. Mobile Bottom Dock (visible on mobile < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl safe-area-pb">
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 select-none transition-all
                  ${isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 font-medium'}
                `}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-2 -right-3 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black border-2 border-white shadow">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-8 h-1 bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
