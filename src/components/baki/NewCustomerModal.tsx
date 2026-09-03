// ==============================================================================
// MudiDokan (মুদিদোকান) New Bakir Khata Creator Modal
// Ultra User-Friendly, Touch-Optimized (56px+ targets), Mobile/Tablet First
// Supports Opening Due Balance (পূর্বের বকেয়া) & Locality Quick Chips
// ==============================================================================

import React, { useState } from 'react';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { Customer } from '../../@types/database.types';
import { formatBengaliCurrency } from '../../lib/banglaNumberFormatter';
import {
  X,
  UserPlus,
  Phone,
  MapPin,
  ShieldAlert,
  Wallet,
  Check,
} from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    phone: string,
    address?: string,
    creditLimit?: number,
    openingDue?: number
  ) => Promise<{ success: boolean; error?: string; customer?: Customer }>;
  onCustomerCreated?: (customer: Customer) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCustomerCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [hasOpeningDue, setHasOpeningDue] = useState(false);
  const [openingDue, setOpeningDue] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useModalDismiss<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const localityPresets = [
    'মাস্টারপাড়া',
    'বাজারের পিছনে',
    'স্কুল রোড',
    'মসজিদের গলি',
    'পূর্ব পাড়া',
    'বাড়ি নং',
  ];

  const creditLimitPresets = [3000, 5000, 10000, 20000];
  const openingDuePresets = [500, 1000, 2000, 3000, 5000];

  const handleLocalityChip = (chip: string) => {
    if (!address) {
      setAddress(chip + ' ');
    } else if (!address.includes(chip)) {
      setAddress((prev) => prev.trim() + ', ' + chip + ' ');
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    setPhone(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('দয়া করে গ্রাহকের নাম লিখুন।');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711998877)');
      return;
    }

    setIsSubmitting(true);
    const finalOpeningDue = hasOpeningDue ? Math.max(0, Number(openingDue) || 0) : 0;
    const res = await onSubmit(
      name.trim(),
      cleanPhone,
      address.trim() || undefined,
      creditLimit,
      finalOpeningDue
    );
    setIsSubmitting(false);

    if (res.success && res.customer) {
      if (onCustomerCreated) {
        onCustomerCreated(res.customer);
      }
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue(0);
      setHasOpeningDue(false);
      onClose();
    } else {
      setErrorMsg(res.error || 'খাতা তৈরিতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="নতুন খাতা খুলুন"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black">নতুন বাকির খাতা খুলুন</h3>
              <p className="text-xs text-slate-300">গ্রাহকের নাম, মোবাইল নম্বর ও পূর্বের বকেয়া হিসাব</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              গ্রাহকের পূর্ণ নাম *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: হাজী রফিকুল ইসলাম / কালাম ভাই"
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-200 text-base font-bold text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* 2. 11-digit Mobile Number */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                ১১ ডিজিটের মোবাইল নম্বর *
              </label>
              {phone.length === 11 && /^01[3-9]\d{8}$/.test(phone) && (
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> সঠিক নম্বর
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="tel"
                required
                maxLength={11}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="01711998877"
                className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-base font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
              />
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ✓ এই নম্বরে সরাসরি হোয়াটসঅ্যাপে হিসাবের তাগাদা ও ডিজিটাল রসিদ পাঠানো যাবে।
            </p>
          </div>

          {/* 3. Opening Due Balance (পূর্বের বকেয়া) */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold text-slate-800">
                  পূর্বে কোনো বাকি আছে কি? (প্রারম্ভিক বকেয়া)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasOpeningDue(!hasOpeningDue)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  hasOpeningDue
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-300'
                }`}
              >
                {hasOpeningDue ? 'হ্যাঁ, বাকি আছে' : 'না (০ বাকি)'}
              </button>
            </div>

            {hasOpeningDue && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={openingDue || ''}
                    onChange={(e) => setOpeningDue(parseFloat(e.target.value) || 0)}
                    placeholder="আগের খাতার বকেয়া টাকা..."
                    className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-amber-300 bg-white text-xl font-black text-slate-900 focus:border-amber-500 outline-none"
                  />
                  <div className="absolute left-4 top-3 text-lg font-black text-amber-800">৳</div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {openingDuePresets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningDue(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        openingDue === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      {formatBengaliCurrency(amt)}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-amber-900/80 font-medium">
                  💡 খাতা খোলার সাথে সাথে এই পরিমাণ টাকা গ্রাহকের দেনা হিসেবে যুক্ত হবে এবং লেজারে সংরক্ষিত থাকবে।
                </p>
              </div>
            )}
          </div>

          {/* 4. Locality / Address / Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              ঠিকানা বা মহল্লা (ঐচ্ছিক)
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি নং ৪২, মাস্টারপাড়া রোড"
                className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-500 outline-none"
              />
              <div className="absolute left-4 top-3.5 text-slate-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {/* Locality Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {localityPresets.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleLocalityChip(chip)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Credit Limit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              সর্বোচ্চ বাকির সীমা (ক্রেডিট লিমিট)
            </label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-200 text-base font-bold text-slate-900 focus:border-emerald-500 outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {creditLimitPresets.map((lim) => (
                <button
                  key={lim}
                  type="button"
                  onClick={() => setCreditLimit(lim)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    creditLimit === lim
                      ? 'bg-slate-900 text-white font-black shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {formatBengaliCurrency(lim)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
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
              disabled={isSubmitting || !name.trim() || phone.length !== 11}
              className="w-2/3"
              icon={Check}
            >
              {isSubmitting ? 'খাতা খোলা হচ্ছে...' : 'খাতা নিশ্চিত করুন'}
            </BigButton>
          </div>
        </form>
      </div>
    </div>
  );
};
