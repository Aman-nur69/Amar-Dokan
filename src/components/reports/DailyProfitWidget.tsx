// ==============================================================================
// MudiDokan (মুদিদোকান) Daily Hisab-Kitab & Executive Cockpit Widget
// High-Contrast Visual Balance, Cash Drawer Reconciliation, & Net Profit Engine
// ==============================================================================

import React from 'react';
import {
  formatBengaliCurrency,
  toBanglaDigits,
} from '../../lib/banglaNumberFormatter';
import {
  TrendingUp,
  Wallet,
  FileText,
  HandCoins,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Calculator,
  FileCheck,
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';

export interface DailyMetrics {
  totalSales: number;
  totalCashCollected: number; // Cash in Drawer
  totalNewDue: number;
  totalDueCollected: number;
  totalExpenses: number;
  totalCogs: number;
  netProfit: number;
  saleCount: number;
  // Supplier Chalan Metrics
  totalChalanPurchases: number; // আজকের চালান মোট ক্রয়
  totalChalanCashPaid: number;  // কোম্পানিকে নগদ প্রদান (ক্যাশ ড্রয়ার থেকে)
  totalChalanDue: number;       // কোম্পানির নতুন বাকি
  totalSupplierDuePaid?: number; // আগে বাকি থাকা চালানের আজ পরিশোধ
  chalanCount: number;          // আজকের চালানের সংখ্যা
  totalCustomerDueAllTime?: number; // দোকানের মোট কাস্টমার বাকি পাওনা
  totalSupplierDueAllTime?: number; // মহাজনদের মোট দেনা
}

interface DailyProfitWidgetProps {
  metrics: DailyMetrics;
  onOpenExpenseModal: () => void;
  onOpenCashCountModal: () => void;
  onOpenDayClosingModal: () => void;
}

export const DailyProfitWidget: React.FC<DailyProfitWidgetProps> = ({
  metrics,
  onOpenExpenseModal,
  onOpenCashCountModal,
  onOpenDayClosingModal,
}) => {
  const { hasAccess, isSuperAdmin } = useAuthStore();
  const canSeeProfit = hasAccess('NET_PROFIT');

  const isProfitPositive = metrics.netProfit >= 0;
  const profitMarginPercent =
    metrics.totalSales > 0 ? (metrics.netProfit / metrics.totalSales) * 100 : 0;

  const directCashSales = Math.max(0, metrics.totalSales - metrics.totalNewDue);

  return (
    <div className="space-y-4">
      {/* 1. Executive Deck: 2 Large High-Contrast Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hero Card 1: Cash in Drawer (ক্যাশবাক্স নগদ স্থিতি) */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                ক্যাশবাক্সে বর্তমান নগদ স্থিতি (Cash in Drawer)
              </span>

              {!isSuperAdmin() && (
                <button
                  onClick={onOpenCashCountModal}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>ক্যাশ মেলান</span>
                </button>
              )}
            </div>

            <div className="my-2">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400">
                {formatBengaliCurrency(metrics.totalCashCollected)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                দোকানের ক্যাশ ড্রয়ারে ঠিক এই পরিমাণ কাঁচা টাকা জমা থাকার কথা
              </p>
            </div>
          </div>

          {/* Real-time Math Formula breakdown pills */}
          <div className="pt-3 border-t border-slate-800/80 mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-300 border border-slate-700">
              + নগদ বিক্রি: {formatBengaliCurrency(directCashSales)}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-teal-300 border border-slate-700">
              + বাকি আদায়: {formatBengaliCurrency(metrics.totalDueCollected)}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-amber-300 border border-slate-700">
              - খরচ: {formatBengaliCurrency(metrics.totalExpenses)}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-rose-300 border border-slate-700">
              - চালান পরিশোধ: {formatBengaliCurrency(metrics.totalChalanCashPaid)}
            </span>
            {metrics.totalSupplierDuePaid !== undefined && metrics.totalSupplierDuePaid > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-rose-300 border border-slate-700">
                - চালান বকেয়া শোধ: {formatBengaliCurrency(metrics.totalSupplierDuePaid)}
              </span>
            )}
          </div>
        </div>

        {/* Hero Card 2: Revenue & Net Operating Profit */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5" />
                দিনের আর্থিক লাভ ও বিক্রি (Sales & Profit)
              </span>

              {!isSuperAdmin() && (
                <button
                  onClick={onOpenDayClosingModal}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition-all"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ক্লোজিং রসিদ</span>
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {formatBengaliCurrency(metrics.totalSales)}
              </h2>
              {metrics.totalSales > 0 && (
                canSeeProfit ? (
                  <span
                    className={`text-sm font-extrabold flex items-center gap-0.5 px-2.5 py-1 rounded-xl ${
                      isProfitPositive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isProfitPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    লাভ: {formatBengaliCurrency(metrics.netProfit)} ({toBanglaDigits(profitMarginPercent.toFixed(1))}%)
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    🔒 লাভ শুধুমাত্র মালিক দেখতে পারেন
                  </span>
                )
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              মোট {toBanglaDigits(metrics.saleCount)} টি বিক্রি ইনভয়েস
              {metrics.chalanCount > 0 && ` এবং ${toBanglaDigits(metrics.chalanCount)} টি কোম্পানির চালান`}
            </p>
          </div>

          {!isSuperAdmin() && (
            <div className="pt-3 border-t border-slate-800/80 mt-2 flex gap-2">
              <button
                onClick={onOpenExpenseModal}
                className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>+ দৈনিক খরচ লিখুন</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 4 Core Pillars of Dokan Operation (Card Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Pillar 1: Total Sales */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">মোট বিক্রি (Sales)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {formatBengaliCurrency(metrics.totalSales)}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1">
              <span className="text-emerald-700">ক্যাশ: {formatBengaliCurrency(directCashSales)}</span>
              <span>•</span>
              <span className="text-rose-600">বাকি: {formatBengaliCurrency(metrics.totalNewDue)}</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Customer Due Pulse (কাস্টমার বাকি ও আদায়) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">কাস্টমার বাকি বিস্তার</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-teal-700">
              {formatBengaliCurrency(metrics.totalDueCollected)}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1">
              <span>আদায় হয়েছে</span>
              <span>•</span>
              <span className="text-rose-600">নতুন বাকি: {formatBengaliCurrency(metrics.totalNewDue)}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Supplier Inward Mal & Payments (কোম্পানি চালান) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">কোম্পানির চালান ক্রয়</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {formatBengaliCurrency(metrics.totalChalanPurchases)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-1">
              <span className="text-emerald-700">
                পরিশোধ: {formatBengaliCurrency(metrics.totalChalanCashPaid + (metrics.totalSupplierDuePaid || 0))}
              </span>
              <span>•</span>
              <span className="text-rose-600">বাকি: {formatBengaliCurrency(metrics.totalChalanDue)}</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Store Overhead Expenses (দোকান খরচ) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">দোকান খরচ (Expense)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-800">
              {formatBengaliCurrency(metrics.totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">চা, নাস্তা, বিদ্যুৎ বিল ও পরিবহন</p>
          </div>
        </div>
      </div>

      {/* 3. Overall Cumulative Ledger (মোট কাস্টমার বাকি পাওনা বনাম মোট মহাজন দেনা) */}
      {(metrics.totalCustomerDueAllTime !== undefined || metrics.totalSupplierDueAllTime !== undefined) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">দোকানের সামগ্রিক মোট দেনা-পাওনা স্থিতি</h4>
              <p className="text-xs text-slate-400">সকল কাস্টমার বাকি খাতা ও মহাজন চালানের বর্তমান ব্যালেন্স</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <div className="px-3.5 py-2 rounded-xl bg-teal-950/80 border border-teal-600/40 text-teal-300">
              <span className="text-[10px] text-teal-400 font-semibold block uppercase">গ্রাহকদের কাছে মোট পাওনা</span>
              <span className="text-base font-black text-teal-300">
                {formatBengaliCurrency(metrics.totalCustomerDueAllTime || 0)}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-600/40 text-rose-300">
              <span className="text-[10px] text-rose-400 font-semibold block uppercase">মহাজনদের মোট বাকি দেনা</span>
              <span className="text-base font-black text-rose-300">
                {formatBengaliCurrency(metrics.totalSupplierDueAllTime || 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
