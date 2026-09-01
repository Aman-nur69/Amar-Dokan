// ==============================================================================
// MudiDokan (মুদিদোকান) Supplier Due Payment Modal
// Touch-optimized, mobile/tablet friendly modal for settling company chalan dues
// ==============================================================================

import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
=======
import { toast } from '../../hooks/useToastStore';
import { useModalDismiss } from '../../hooks/useModalDismiss';
>>>>>>> c18622f (Bug Fix)
import { SupplierChalan } from '../../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { X, Check, HandCoins, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface SupplierDuePayModalProps {
  chalan: SupplierChalan | null;
  isOpen: boolean;
  onClose: () => void;
  onPayDue: (
    chalanId: string,
    amount: number,
    paymentMethod: 'CASH' | 'BKASH' | 'BANK',
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const SupplierDuePayModal: React.FC<SupplierDuePayModalProps> = ({
  chalan,
  isOpen,
  onClose,
  onPayDue,
}) => {
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'BANK'>('CASH');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (chalan && isOpen) {
      // Default to full remaining due for 1-tap clearing
      setPayAmount(chalan.due_amount);
      setPaymentMethod('CASH');
      setNote('');
    }
  }, [chalan, isOpen]);

<<<<<<< HEAD
=======
  const dialogRef = useModalDismiss<HTMLDivElement>(isOpen, onClose);

>>>>>>> c18622f (Bug Fix)
  if (!isOpen || !chalan) return null;

  const currentDue = Number(chalan.due_amount || 0);
  const cleanPayAmount = Math.min(Math.max(0, Number(payAmount) || 0), currentDue);
  const remainingDue = Math.max(0, currentDue - cleanPayAmount);

  const handleQuickChip = (amount: number) => {
    setPayAmount(Math.min(amount, currentDue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanPayAmount <= 0) {
<<<<<<< HEAD
      alert('দয়া করে সঠিক পরিশোধের পরিমাণ লিখুন।');
=======
      toast.error('দয়া করে সঠিক পরিশোধের পরিমাণ লিখুন।');
>>>>>>> c18622f (Bug Fix)
      return;
    }

    setIsSubmitting(true);
    const res = await onPayDue(
      chalan.id,
      cleanPayAmount,
      paymentMethod,
      note.trim() || `চালান নং ${chalan.chalan_no} এর বাকি পরিশোধ`
    );
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
<<<<<<< HEAD
      alert(res.error || 'বাকি পরিশোধ রেকর্ড করতে সমস্যা হয়েছে।');
=======
      toast.error(res.error || 'বাকি পরিশোধ রেকর্ড করতে সমস্যা হয়েছে।');
>>>>>>> c18622f (Bug Fix)
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
<<<<<<< HEAD
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]">
=======
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="চালানের বকেয়া পরিশোধ"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]"
      >
>>>>>>> c18622f (Bug Fix)
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black truncate">কোম্পানির চালান বাকি পরিশোধ</h3>
              <p className="text-xs text-slate-300 truncate">
                {chalan.supplier_name} • চালান: {chalan.chalan_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Due Info Cards (Responsive 3-Column on tablet, stacked on mobile) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block mb-0.5">
                চালান মূল্য
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                {formatBengaliCurrency(chalan.total_amount)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-emerald-800 block mb-0.5">
                পূর্বে পরিশোধ
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 block truncate">
                {formatBengaliCurrency(chalan.paid_amount)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-rose-800 block mb-0.5">
                বর্তমান বকেয়া
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-600 block truncate">
                {formatBengaliCurrency(currentDue)}
              </span>
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              দ্রুত পরিশোধের বাটনে চাপ দিন (১-ট্যাপ):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPayAmount(currentDue)}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                  cleanPayAmount === currentDue
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                সম্পূর্ণ বকেয়া ({formatBengaliCurrency(currentDue)})
              </button>

              {currentDue > 1000 && (
                <button
                  type="button"
                  onClick={() => handleQuickChip(1000)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  ৳১,০০০
                </button>
              )}

              {currentDue > 2000 && (
                <button
                  type="button"
                  onClick={() => handleQuickChip(2000)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  ৳২,০০০
                </button>
              )}

              {currentDue > 5000 && (
                <button
                  type="button"
                  onClick={() => handleQuickChip(5000)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  ৳৫,০০০
                </button>
              )}
            </div>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              পরিশোধের পরিমাণ (টাকা) *
            </label>
            <input
              type="number"
              min="1"
              max={currentDue}
              step="any"
              required
              value={payAmount || ''}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              placeholder="কত টাকা দিচ্ছেন..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-emerald-400 text-2xl font-black text-slate-900 bg-white outline-none focus:border-emerald-600"
              autoFocus
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              পরিশোধের মাধ্যম (কোন ফান্ড থেকে দিচ্ছেন)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>ক্যাশবাক্স নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BKASH')}
                className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'BKASH'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>বিকাশ / নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK')}
                className={`h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'BANK'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>ব্যাংক / চেক</span>
              </button>
            </div>
            {paymentMethod === 'CASH' && (
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                ✓ আজকের দৈনিক হিসাবের ক্যাশবাক্স (Cash in Drawer) থেকে স্বয়ংক্রিয়ভাবে বাদ যাবে।
              </p>
            )}
          </div>

          {/* Dynamic Post-Payment Calculation Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              পরিশোধের পর অবশিষ্ট কোম্পানির দেনা:
            </span>
            <span
              className={`text-base font-black ${
                remainingDue === 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {remainingDue === 0 ? '৳ ০.০০ (সম্পূর্ণ শোধ)' : formatBengaliCurrency(remainingDue)}
            </span>
          </div>

          {/* Optional Note */}
          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="মন্তব্য (যেমন: কোম্পানি এসআর রফিক সাহেবের হাতে বুঝিয়ে দেয়া হলো)..."
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-sm"
            >
              বাতিল
            </button>
            <BigButton
              variant="cash"
              type="submit"
              disabled={isSubmitting || cleanPayAmount <= 0}
              className="w-2/3"
              icon={Check}
            >
              {isSubmitting ? 'পরিশোধ হচ্ছে...' : 'বাকি পরিশোধ নিশ্চিত করুন'}
            </BigButton>
          </div>
        </form>
      </div>
    </div>
  );
};
