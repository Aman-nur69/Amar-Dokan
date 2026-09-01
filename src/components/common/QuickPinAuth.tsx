// ==============================================================================
// MudiDokan (মুদিদোকান) Register Lock / Cashier PIN Verification
// A cashier stepping away from the till must not leave the khata, day report
// and stock open to whoever picks up the phone. Previously this component
// auto-approved every prompt, so the documented lock did not exist.
// ==============================================================================

import React, { useState } from 'react';
import { Lock, Delete, LogOut } from 'lucide-react';
import { useAuthStore, getRoleInfo } from '../../hooks/useAuthStore';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';

interface QuickPinAuthProps {
  /** Rendered as a full-screen gate; the app stays mounted behind it. */
  isOpen: boolean;
  onSuccess?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

export const QuickPinAuth: React.FC<QuickPinAuthProps> = ({ isOpen, onSuccess }) => {
  const { currentUser, unlockRegister, lockError, clearLockError, logout } = useAuthStore();
  const [pin, setPin] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const roleInfo = getRoleInfo(currentUser?.role);

  if (!isOpen) return null;

  const submit = async (value: string) => {
    setIsChecking(true);
    const ok = await unlockRegister(value);
    setIsChecking(false);
    setPin('');
    if (ok) onSuccess?.();
  };

  const handleKey = async (key: string) => {
    clearLockError();

    if (key === 'clear') {
      setPin('');
      return;
    }
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }

    const next = (pin + key).slice(0, 4);
    setPin(next);
    if (next.length === 4) await submit(next);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="ক্যাশ রেজিস্টার লক"
    >
      <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-emerald-400" />
      </div>

      <h2 className="text-xl font-black mb-1">ক্যাশ রেজিস্টার লক করা আছে</h2>
      <p className="text-sm text-slate-400 mb-1">
        {currentUser?.full_name} • {roleInfo.labelBn}
      </p>
      <p className="text-xs text-slate-500 mb-6">খুলতে আপনার ৪ ডিজিটের পিন দিন</p>

      {/* PIN dots */}
      <div className="flex gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              pin.length > i ? 'bg-emerald-400 border-emerald-400 scale-110' : 'border-slate-600'
            }`}
          />
        ))}
      </div>

      {lockError && (
        <p className="text-xs font-bold text-rose-400 mb-3 animate-in fade-in" role="alert">
          {lockError}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={isChecking}
            onClick={() => handleKey(key)}
            aria-label={key === 'back' ? 'একটি ডিজিট মুছুন' : key === 'clear' ? 'সব মুছুন' : key}
            className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-2xl font-black flex items-center justify-center transition-colors disabled:opacity-40"
          >
            {key === 'back' ? (
              <Delete className="w-6 h-6 text-slate-300" />
            ) : key === 'clear' ? (
              <span className="text-sm font-bold text-slate-300">মুছুন</span>
            ) : (
              toBanglaDigits(key)
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-300 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>অন্য অ্যাকাউন্টে লগইন করুন</span>
      </button>
    </div>
  );
};
