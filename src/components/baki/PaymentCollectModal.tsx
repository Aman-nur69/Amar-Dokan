// ==============================================================================
// MudiDokan (মুদিদোকান) Payment Collect Modal (বাকি আদায়)
// Fast Cash/MFS Collection with Real-Time Customer Balance Recalculation
// ==============================================================================

import React, { useState } from 'react';
import { Customer, MfsProvider } from '../../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits, formatBengaliPhone } from '../../lib/banglaNumberFormatter';
import { X, Check, HandCoins, Smartphone, Sparkles } from 'lucide-react';
import { BigButton } from '../common/BigButton';
import confetti from 'canvas-confetti';

interface PaymentCollectModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, amount: number, method: MfsProvider, note?: string) => Promise<boolean>;
}

export const PaymentCollectModal: React.FC<PaymentCollectModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<MfsProvider>('CASH');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !customer) return null;

  const currentDue = customer.current_balance;
  const remainingDue = Math.max(0, currentDue - (amount || 0));
  const isFullyCleared = amount >= currentDue && currentDue > 0;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      alert('দয়া করে আদায়ের সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    setIsSubmitting(true);
    const success = await onConfirm(customer.id, amount, method, note);
    setIsSubmitting(false);

    if (success) {
      if (isFullyCleared) {
        try {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">বাকি টাকা আদায় ও জমা</h3>
              <p className="text-xs text-slate-300">খাতায় জমা এন্ট্রি করা হচ্ছে</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Customer Profile Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-base text-slate-900">{customer.name}</h4>
              <p className="text-xs text-slate-500 font-medium">{formatBengaliPhone(customer.phone)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">বর্তমান মোট বাকি:</span>
              <span className="text-xl font-black text-rose-600">
                {formatBengaliCurrency(currentDue)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              আদায়ের পরিমাণ (টাকা):
            </label>
            <div className="relative">
              <input
                type="number"
                autoFocus
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="কত টাকা আদায় হলো..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-2xl font-black text-slate-900 focus:border-emerald-500 outline-none"
              />
              <div className="absolute left-4 top-3.5 text-xl font-black text-slate-400">৳</div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(currentDue)}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>সম্পূর্ণ বাকি ({toBanglaDigits(currentDue)})</span>
              </button>
              {[100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
                >
                  +{toBanglaDigits(val)}৳
                </button>
              ))}
            </div>
          </div>

          {/* Realtime Recalculated Balance Indicator */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-sm">
            <span className="text-slate-700 font-semibold">জমা হওয়ার পর অবশিষ্ট দেনা:</span>
            <span
              className={`font-black text-base ${
                remainingDue === 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {remainingDue === 0 ? '৳ ০.০০ (হিসাব ক্লিয়ার!)' : formatBengaliCurrency(remainingDue)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              আদায়ের মাধ্যম:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  method === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>নগদ ক্যাশ</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('BKASH')}
                className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  method === 'BKASH'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>বিকাশ</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('NAGAD')}
                className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  method === 'NAGAD'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>নগদ</span>
              </button>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="নোট বা বিবরণ (ঐচ্ছিক, যেমন: ছোট ভাই দিয়ে গেছে)..."
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 h-14 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
          >
            বাতিল
          </button>
          <BigButton
            variant="cash"
            onClick={handleSubmit}
            disabled={isSubmitting || amount <= 0}
            className="w-2/3"
            icon={Check}
          >
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'আদায় নিশ্চিত করুন'}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
