// ==============================================================================
// MudiDokan (মুদিদোকান) Cash Drawer Note Counter & Reconciliation Modal
// Allows shopkeepers to match physical cash in the till with calculated sales
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { X, CheckCircle2, AlertTriangle, Calculator, Sparkles, RefreshCw } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface CashCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCash: number;
}

interface Denomination {
  value: number;
  label: string;
}

const DENOMINATIONS: Denomination[] = [
  { value: 1000, label: '১০০০ টাকার নোট' },
  { value: 500, label: '৫০০ টাকার নোট' },
  { value: 200, label: '২০০ টাকার নোট' },
  { value: 100, label: '১০০ টাকার নোট' },
  { value: 50, label: '৫০ টাকার নোট' },
  { value: 20, label: '২০ টাকার নোট' },
  { value: 10, label: '১০ টাকার নোট' },
  { value: 5, label: '৫ টাকার নোট/কয়েন' },
  { value: 2, label: '২ টাকার নোট/কয়েন' },
  { value: 1, label: '১ টাকার কয়েন' },
];

export const CashCountModal: React.FC<CashCountModalProps> = ({
  isOpen,
  onClose,
  expectedCash,
}) => {
  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  const [directAmount, setDirectAmount] = useState<string>('');
  const [useManualTotal, setUseManualTotal] = useState<boolean>(false);

  const handleCountChange = (val: number, count: number) => {
    setCounts((prev) => ({
      ...prev,
      [val]: Math.max(0, count || 0),
    }));
  };

  const handleReset = () => {
    setCounts({
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      2: 0,
      1: 0,
    });
    setDirectAmount('');
  };

  // Calculated physical cash
  const totalPhysicalCash = useMemo(() => {
    if (useManualTotal) {
      return parseFloat(directAmount) || 0;
    }
    return DENOMINATIONS.reduce((acc, d) => acc + d.value * (counts[d.value] || 0), 0);
  }, [counts, useManualTotal, directAmount]);

  const difference = totalPhysicalCash - expectedCash;
  const isMatch = Math.abs(difference) < 1;
  const isSurplus = difference > 0;
  const isShort = difference < 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">ক্যাশবাক্সের নগদ টাকা মেলান</h3>
              <p className="text-xs text-slate-300">
                ড্রয়ারের নগদ টাকা গুনে সফটওয়্যার হিসাবের সাথে যাচাই করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Hero Card */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-0.5">
                সফটওয়্যার অনুযায়ী থাকার কথা
              </span>
              <span className="text-xl font-black text-slate-900">
                {formatBengaliCurrency(expectedCash)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-0.5">
                আপনার গোনায় বর্তমান ক্যাশ
              </span>
              <span className="text-xl font-black text-emerald-700">
                {formatBengaliCurrency(totalPhysicalCash)}
              </span>
            </div>
          </div>

          {/* Reconciliation Result Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isMatch
                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                : isSurplus
                ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                : 'bg-rose-100/70 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isMatch ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              ) : (
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 ${isSurplus ? 'text-amber-700' : 'text-rose-700'}`}
                />
              )}
              <div>
                <span className="text-sm font-black block">
                  {isMatch
                    ? 'ক্যাশ হুবহু মিলে গেছে! (Perfect Match)'
                    : isSurplus
                    ? `ক্যাশে ${formatBengaliCurrency(difference)} টাকা বেশি আছে (Surplus)`
                    : `ক্যাশে ${formatBengaliCurrency(Math.abs(difference))} টাকা শর্ট আছে (Shortage)`}
                </span>
                <span className="text-xs opacity-80">
                  {isMatch
                    ? 'আজকের সকল আয়-ব্যয় ক্যাশবাক্সের সাথে ১০০% সামঞ্জস্যপূর্ণ।'
                    : 'দয়া করে আজকের খরচ বা চালানের নগদ এন্ট্রি পুনরায় যাচাই করুন।'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Toggle: Detailed Note Count vs Direct Amount */}
        <div className="px-5 pt-3 flex items-center justify-between">
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setUseManualTotal(false)}
              className={`px-3 py-1 rounded-lg transition-all ${
                !useManualTotal ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              নোট গুনে হিসাব
            </button>
            <button
              onClick={() => setUseManualTotal(true)}
              className={`px-3 py-1 rounded-lg transition-all ${
                useManualTotal ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              একবারে মোট টাকা লিখুন
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>রিসেট</span>
          </button>
        </div>

        {/* Counter Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {useManualTotal ? (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                ক্যাশবাক্সের মোট ক্যাশ একবারে লিখুন (৳)
              </label>
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="যেমন: ২৫৫০০"
                className="w-full h-14 px-4 rounded-2xl border-2 border-emerald-400 text-2xl font-black text-slate-900 outline-none focus:border-emerald-600 bg-white"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                আপনি সরাসরি ড্রয়ারের মোট টাকা লিখে হিসাব মেলাতে পারেন।
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 mb-2">
                কোন নোট কতটি আছে লিখুন:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DENOMINATIONS.map((d) => {
                  const count = counts[d.value] || 0;
                  const lineTotal = d.value * count;

                  return (
                    <div
                      key={d.value}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-[120px]">
                        <span className="text-xs font-bold text-slate-800 block">{d.label}</span>
                        <span className="text-[11px] font-black text-emerald-700">
                          = {formatBengaliCurrency(lineTotal)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={count === 0 ? '' : count}
                          onChange={(e) =>
                            handleCountChange(d.value, parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="০"
                          className="w-16 h-10 px-2 text-center rounded-xl border border-slate-200 text-sm font-black outline-none focus:border-emerald-500 bg-slate-50"
                        />
                        <span className="text-xs font-semibold text-slate-400">টি</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3">
          <BigButton variant="secondary" onClick={onClose} className="flex-1">
            হিসাব শেষ ও বন্ধ
          </BigButton>
        </div>
      </div>
    </div>
  );
};
