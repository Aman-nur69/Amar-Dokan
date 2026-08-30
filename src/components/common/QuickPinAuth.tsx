// ==============================================================================
// MudiDokan (মুদিদোকান) Quick Pin Lock / Cashier Verification Modal
// ==============================================================================

import React, { useState } from 'react';
import { Lock, Unlock, Delete, X } from 'lucide-react';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';

interface QuickPinAuthProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  expectedPin?: string;
}

export const QuickPinAuth: React.FC<QuickPinAuthProps> = ({
  isOpen,
  onSuccess,
  onClose,
  title = 'ক্যাশবাক্স আনলক করুন (পিন দিন)',
  expectedPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin) {
          setTimeout(() => {
            onSuccess();
            setPin('');
          }, 150);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">সিকিউরিটি</span>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
          {error ? <Lock className="w-8 h-8 text-rose-600 animate-bounce" /> : <Unlock className="w-8 h-8" />}
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-6">ডিফল্ট পিন: ১২৩৪</p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 scale-110'
                    : 'bg-emerald-600 scale-110'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-rose-600 text-xs font-semibold mb-3">ভুল পিন! আবার চেষ্টা করুন।</p>}

        {/* Big Touch Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 active:text-emerald-700 text-2xl font-bold text-slate-800 transition-colors border border-slate-200 shadow-sm"
            >
              {toBanglaDigits(digit)}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 text-2xl font-bold text-slate-800 transition-colors border border-slate-200 shadow-sm"
          >
            {toBanglaDigits('0')}
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors border border-rose-200 shadow-sm"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
