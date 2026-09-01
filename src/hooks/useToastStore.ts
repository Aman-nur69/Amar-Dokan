// ==============================================================================
// Amar Dokan (আমার দোকান) Toast Notifications
// Replaces blocking window.alert() calls, which freeze the till and render as a
// browser chrome dialog on Android WebView.
// ==============================================================================

import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info', durationMs = 3800) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, tone, durationMs }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, durationMs);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helpers so non-component code can raise a toast. */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error', 5000),
  warning: (message: string) => useToastStore.getState().push(message, 'warning', 4500),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};
