// ==============================================================================
// Amar Dokan (আমার দোকান) Toast Host
// Mounted once at the app shell; renders whatever the toast store holds.
// ==============================================================================

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastTone } from '../../hooks/useToastStore';

const TONE_STYLES: Record<ToastTone, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'bg-emerald-600 border-emerald-700 text-white',
    icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
  },
  error: {
    box: 'bg-rose-600 border-rose-700 text-white',
    icon: <XCircle className="w-5 h-5 flex-shrink-0" />,
  },
  warning: {
    box: 'bg-amber-500 border-amber-600 text-slate-950',
    icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  },
  info: {
    box: 'bg-slate-900 border-slate-700 text-white',
    icon: <Info className="w-5 h-5 flex-shrink-0" />,
  },
};

export const ToastHost: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 inset-x-0 z-[100] px-3 flex flex-col items-center gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const tone = TONE_STYLES[t.tone];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-md flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${tone.box}`}
          >
            {tone.icon}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="বন্ধ করুন"
              className="p-1 rounded-lg hover:bg-black/15 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
