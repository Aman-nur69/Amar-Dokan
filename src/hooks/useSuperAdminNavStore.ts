// ==============================================================================
// Amar Dokan (আমার দোকান) Super Admin Navigation & Platform State Store
// Synchronizes sticky sub-navbar and floating mobile dock with admin dashboard
// ==============================================================================

import { create } from 'zustand';

export type SuperAdminTab = 'ALL' | 'pending' | 'approved';

interface SuperAdminNavState {
  adminTab: SuperAdminTab;
  isAddShopModalOpen: boolean;
  totalShopsCount: number;
  pendingShopsCount: number;
  approvedShopsCount: number;

  setAdminTab: (tab: SuperAdminTab) => void;
  openAddShopModal: () => void;
  closeAddShopModal: () => void;
  setPlatformCounts: (counts: { total: number; pending: number; approved: number }) => void;
}

export const useSuperAdminNavStore = create<SuperAdminNavState>((set) => ({
  adminTab: 'ALL',
  isAddShopModalOpen: false,
  totalShopsCount: 0,
  pendingShopsCount: 0,
  approvedShopsCount: 0,

  setAdminTab: (tab) => set({ adminTab: tab }),
  openAddShopModal: () => set({ isAddShopModalOpen: true }),
  closeAddShopModal: () => set({ isAddShopModalOpen: false }),
  setPlatformCounts: ({ total, pending, approved }) =>
    set({
      totalShopsCount: total,
      pendingShopsCount: pending,
      approvedShopsCount: approved,
    }),
}));
