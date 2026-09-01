// ==============================================================================
// MudiDokan (মুদিদোকান) Daily Hisab-Kitab Master Financial Cockpit View
// World-class UI: Quick Date Filters, Cash Reconciliation, & Unified Activity Feed
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db/offlineDb';
import {
  Sale,
  Expense,
  BakiTransaction,
  SaleItem,
  SupplierChalan,
  SupplierPayment,
} from '../@types/database.types';
import { DailyProfitWidget } from '../components/reports/DailyProfitWidget';
import { ExpenseLoggerModal } from '../components/reports/ExpenseLoggerModal';
import { CashCountModal } from '../components/reports/CashCountModal';
import { DayClosingModal } from '../components/reports/DayClosingModal';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
} from '../lib/banglaNumberFormatter';
import { useAuthStore } from '../hooks/useAuthStore';
import {
<<<<<<< HEAD
=======
  todayDhakaKey,
  shiftDhakaDateKey,
  isOnDhakaDate,
  isWithinDhakaRange,
} from '../lib/dateUtils';
import { DayClosing } from '../@types/database.types';
import {
>>>>>>> c18622f (Bug Fix)
  Calendar,
  Receipt,
  ShoppingBag,
  Truck,
  HandCoins,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

type ActivityTab = 'ALL' | 'SALES' | 'CHALAN' | 'COLLECTIONS' | 'EXPENSES';

export const DashboardView: React.FC = () => {
  const { isSuperAdmin, activeStoreId } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bakiTx, setBakiTx] = useState<BakiTransaction[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [chalans, setChalans] = useState<SupplierChalan[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
<<<<<<< HEAD
=======
  const [previousClosing, setPreviousClosing] = useState<DayClosing | null>(null);
  const [countedCashToday, setCountedCashToday] = useState<number | undefined>(undefined);
>>>>>>> c18622f (Bug Fix)

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCashCountModalOpen, setIsCashCountModalOpen] = useState(false);
  const [isDayClosingModalOpen, setIsDayClosingModalOpen] = useState(false);

  // Date and filter states
<<<<<<< HEAD
  const todayStr = new Date().toISOString().split('T')[0];
=======
  // Bangladesh is UTC+6: a 05:30 AM sale is stored as 23:30 UTC the day before,
  // so every date boundary here must be computed in Dhaka time.
  const todayStr = todayDhakaKey();
>>>>>>> c18622f (Bug Fix)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFilterPreset, setDateFilterPreset] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'CUSTOM'>('TODAY');
  const [activityTab, setActivityTab] = useState<ActivityTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!activeStoreId) {
      setSales([]);
      setExpenses([]);
      setBakiTx([]);
      setSaleItems([]);
      setChalans([]);
      setSupplierPayments([]);
      return;
    }

    const allSales = await db.sales.where('store_id').equals(activeStoreId).toArray();
    const allExpenses = await db.expenses.where('store_id').equals(activeStoreId).toArray();
    const allBaki = await db.baki_transactions.where('store_id').equals(activeStoreId).toArray();
    const allItems = await db.sale_items.where('store_id').equals(activeStoreId).toArray();
    const allChalans = await db.supplier_chalans.where('store_id').equals(activeStoreId).toArray();
    const allPayments = await db.supplier_payments.where('store_id').equals(activeStoreId).toArray();

<<<<<<< HEAD
=======
    // Yesterday's counted cash is today's opening float.
    const closings = await db.day_closings.where('store_id').equals(activeStoreId).toArray();
    closings.sort((a, b) => b.business_date.localeCompare(a.business_date));
    setPreviousClosing(closings.find((c) => c.business_date < selectedDate) || null);

    const counts = await db.cash_counts.where('store_id').equals(activeStoreId).toArray();
    const todaysCounts = counts
      .filter((c) => c.business_date === selectedDate)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    setCountedCashToday(todaysCounts[0]?.counted_amount);

>>>>>>> c18622f (Bug Fix)
    // Sort newest first
    allSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    allExpenses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    allBaki.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    allChalans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setSales(allSales);
    setExpenses(allExpenses);
    setBakiTx(allBaki);
    setSaleItems(allItems);
    setChalans(allChalans);
    setSupplierPayments(allPayments);
<<<<<<< HEAD
  }, [activeStoreId]);
=======
  }, [activeStoreId, selectedDate]);
>>>>>>> c18622f (Bug Fix)

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Preset Date Selection
  const handleSelectPreset = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'CUSTOM') => {
    setDateFilterPreset(preset);
<<<<<<< HEAD
    const today = new Date();

    if (preset === 'TODAY') {
      setSelectedDate(today.toISOString().split('T')[0]);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      setSelectedDate(yest.toISOString().split('T')[0]);
    } else if (preset === 'WEEK') {
      // 7 days ago
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setSelectedDate(past.toISOString().split('T')[0]);
=======

    if (preset === 'TODAY') {
      setSelectedDate(todayDhakaKey());
    } else if (preset === 'YESTERDAY') {
      setSelectedDate(shiftDhakaDateKey(todayDhakaKey(), -1));
    } else if (preset === 'WEEK') {
      setSelectedDate(shiftDhakaDateKey(todayDhakaKey(), -6));
>>>>>>> c18622f (Bug Fix)
    }
  };

  // Filter checker
<<<<<<< HEAD
  const matchesDateFilter = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateFilterPreset === 'WEEK') {
      const itemDate = new Date(dateStr.split('T')[0]);
      const minDate = new Date(selectedDate);
      const maxDate = new Date(todayStr);
      return itemDate >= minDate && itemDate <= maxDate;
    }
    return dateStr.startsWith(selectedDate);
  };
=======
  const matchesDateFilter = useCallback(
    (dateStr?: string) => {
      if (!dateStr) return false;
      if (dateFilterPreset === 'WEEK') {
        return isWithinDhakaRange(dateStr, selectedDate, todayStr);
      }
      // Comparing the raw UTC prefix pushed every pre-6 AM sale into the
      // previous day's হিসাব.
      return isOnDhakaDate(dateStr, selectedDate);
    },
    [dateFilterPreset, selectedDate, todayStr]
  );
>>>>>>> c18622f (Bug Fix)

  // Filtered dataset
  const filteredSales = useMemo(
    () => sales.filter((s) => matchesDateFilter(s.created_at)),
<<<<<<< HEAD
    [sales, selectedDate, dateFilterPreset]
=======
    [sales, matchesDateFilter]
>>>>>>> c18622f (Bug Fix)
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => matchesDateFilter(e.expense_date || e.created_at)),
<<<<<<< HEAD
    [expenses, selectedDate, dateFilterPreset]
=======
    [expenses, matchesDateFilter]
>>>>>>> c18622f (Bug Fix)
  );

  const filteredBakiCollections = useMemo(
    () => bakiTx.filter((b) => b.type === 'CREDIT' && matchesDateFilter(b.created_at)),
<<<<<<< HEAD
    [bakiTx, selectedDate, dateFilterPreset]
=======
    [bakiTx, matchesDateFilter]
>>>>>>> c18622f (Bug Fix)
  );

  const filteredChalans = useMemo(
    () => chalans.filter((c) => matchesDateFilter(c.chalan_date || c.created_at)),
<<<<<<< HEAD
    [chalans, selectedDate, dateFilterPreset]
=======
    [chalans, matchesDateFilter]
>>>>>>> c18622f (Bug Fix)
  );

  const filteredSupplierPayments = useMemo(
    () => supplierPayments.filter((p) => matchesDateFilter(p.payment_date || p.created_at)),
<<<<<<< HEAD
    [supplierPayments, selectedDate, dateFilterPreset]
=======
    [supplierPayments, matchesDateFilter]
>>>>>>> c18622f (Bug Fix)
  );

  // Financial Metrics Calculation
  const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const directCashSales = filteredSales.reduce((acc, s) => acc + Number(s.paid_amount || 0), 0);
  const totalDueCollected = filteredBakiCollections.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Supplier Chalan calculations
  const totalChalanPurchases = filteredChalans.reduce(
    (acc, c) => acc + Number(c.total_amount || 0),
    0
  );
  const totalChalanCashPaid = filteredChalans.reduce(
    (acc, c) => acc + Number(c.paid_amount || 0),
    0
  );
  const totalChalanDue = filteredChalans.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);

  // Supplier Due Payments made towards previous chalans
  const totalSupplierDuePaid = filteredSupplierPayments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0
  );
  const totalSupplierDueCashPaid = filteredSupplierPayments
    .filter((p) => p.payment_method === 'CASH')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const totalDueCollectedCash = filteredBakiCollections
    .filter((b) => !b.payment_method || b.payment_method === 'CASH')
    .reduce((acc, b) => acc + Number(b.amount || 0), 0);

  // Cash in Hand: (Sales Cash + Customer Due Collections in Cash) - (Daily Store Expenses + Inward Chalan Cash Payments + Supplier Due Payments in Cash)
  const totalCashCollected =
    directCashSales +
    totalDueCollectedCash -
    (totalExpenses + totalChalanCashPaid + totalSupplierDueCashPaid);

  const salesNewDue = filteredSales.reduce((acc, s) => acc + Number(s.due_amount || 0), 0);
  const manualNewDue = bakiTx
    .filter((b) => b.type === 'DEBIT' && !b.sale_id && matchesDateFilter(b.created_at))
    .reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalNewDue = salesNewDue + manualNewDue;

  // COGS for filtered sales
  const filteredSaleIds = new Set(filteredSales.map((s) => s.id));
  const totalCogs = saleItems
    .filter((item) => filteredSaleIds.has(item.sale_id))
    .reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_cost_price || 0), 0);

  // Estimated Net Profit: Revenue - (COGS + Expenses)
  const netProfit = totalSales - (totalCogs + totalExpenses);

<<<<<<< HEAD
=======
  const openingFloat = previousClosing?.counted_cash ?? previousClosing?.cash_collected ?? 0;

>>>>>>> c18622f (Bug Fix)
  const metrics = {
    totalSales,
    totalCashCollected,
    totalNewDue,
    totalDueCollected,
    totalExpenses,
    totalCogs,
    netProfit,
    saleCount: filteredSales.length,
    totalChalanPurchases,
    totalChalanCashPaid,
    totalChalanDue,
    totalSupplierDuePaid,
    chalanCount: filteredChalans.length,
  };

  // Unified Activity Stream items
  interface FeedItem {
    id: string;
    type: 'SALE' | 'CHALAN' | 'COLLECTION' | 'EXPENSE';
    title: string;
    subtitle: string;
    amount: number;
    paidAmount?: number;
    dueAmount?: number;
    badgeText: string;
    badgeVariant: 'green' | 'red' | 'amber' | 'teal' | 'slate';
    date: string;
    isInflow: boolean;
  }

  const activityFeed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    // Sales
    filteredSales.forEach((s) => {
      items.push({
        id: s.id,
        type: 'SALE',
        title: `বিক্রি ইনভয়েস #${s.invoice_no}`,
        subtitle: s.payment_method === 'CASH' ? 'নগদ ক্যাশ বিক্রি' : s.due_amount > 0 ? `বাকি: ${formatBengaliCurrency(s.due_amount)}` : 'পরিশোধিত',
        amount: Number(s.total_amount),
        paidAmount: Number(s.paid_amount),
        dueAmount: Number(s.due_amount),
        badgeText: s.payment_method === 'CASH' ? 'ক্যাশ বিক্রি' : s.payment_method === 'BAKI' ? 'সম্পূর্ণ বাকি' : 'আংশিক জমা',
        badgeVariant: s.payment_method === 'CASH' ? 'green' : s.payment_method === 'BAKI' ? 'red' : 'teal',
        date: s.created_at,
        isInflow: true,
      });
    });

    // Chalans
    filteredChalans.forEach((c) => {
      items.push({
        id: c.id,
        type: 'CHALAN',
        title: `কোম্পানি চালান — ${c.supplier_name}`,
        subtitle: `চালান নং ${c.chalan_no} • ${toBanglaDigits(c.items_count)} টি মালামাল`,
        amount: Number(c.total_amount),
        paidAmount: Number(c.paid_amount),
        dueAmount: Number(c.due_amount),
        badgeText: c.due_amount > 0 ? `বকেয়া: ${formatBengaliCurrency(c.due_amount)}` : 'পরিশোধিত চালান',
        badgeVariant: c.due_amount > 0 ? 'red' : 'green',
        date: c.created_at,
        isInflow: false,
      });
    });

    // Supplier Due Payments (চালান বাকি পরিশোধ)
    filteredSupplierPayments.forEach((p) => {
      items.push({
        id: p.id,
        type: 'CHALAN',
        title: `কোম্পানি বাকি শোধ — ${p.supplier_name}`,
        subtitle: `চালান নং ${p.chalan_no} • মাধ্যম: ${
          p.payment_method === 'CASH' ? 'ক্যাশবাক্স নগদ' : p.payment_method === 'BKASH' ? 'বিকাশ/নগদ' : 'ব্যাংক'
        } • ${p.note || 'বকেয়া পরিশোধ'}`,
        amount: Number(p.amount),
        badgeText: 'বাকি পরিশোধ',
        badgeVariant: 'green',
        date: p.created_at,
        isInflow: false,
      });
    });

    // Baki Collections (কাস্টমার বাকি আদায়)
    filteredBakiCollections.forEach((b) => {
      const methodLabel =
        b.payment_method === 'CASH'
          ? 'ক্যাশবাক্স নগদ'
          : b.payment_method === 'BKASH'
          ? 'বিকাশ'
          : b.payment_method === 'NAGAD'
          ? 'নগদ'
          : 'জমা';

      items.push({
        id: b.id,
        type: 'COLLECTION',
        title: `কাস্টমার বাকি আদায় — ${b.customer_name || 'নগদ জমা'}`,
        subtitle: `${b.customer_phone ? `মোবাইল: ${b.customer_phone} • ` : ''}মাধ্যম: ${methodLabel} • ${
          b.note || 'বকেয়া টাকা গ্রহণ'
        }`,
        amount: Number(b.amount),
        badgeText: 'বাকি জমা',
        badgeVariant: 'teal',
        date: b.created_at,
        isInflow: true,
      });
    });

    // Manual / Opening Due Given Today (হাতে নতুন বাকি প্রদান)
    bakiTx
      .filter((b) => b.type === 'DEBIT' && !b.sale_id && matchesDateFilter(b.created_at))
      .forEach((b) => {
        items.push({
          id: b.id,
          type: 'COLLECTION',
          title: `গ্রাহকের খাতায় নতুন বাকি — ${b.customer_name || 'গ্রাহক'}`,
          subtitle: `${b.customer_phone ? `মোবাইল: ${b.customer_phone} • ` : ''}${b.note || 'হাতে নতুন বাকি প্রদান'}`,
          amount: Number(b.amount),
          badgeText: 'নতুন বাকি',
          badgeVariant: 'red',
          date: b.created_at,
          isInflow: false,
        });
      });

    // Expenses
    filteredExpenses.forEach((e) => {
      items.push({
        id: e.id,
        type: 'EXPENSE',
        title: `দোকান খরচ — ${e.category}`,
        subtitle: e.note || 'দৈনিক দোকান খরচ',
        amount: Number(e.amount),
        badgeText: 'খরচ',
        badgeVariant: 'amber',
        date: e.created_at,
        isInflow: false,
      });
    });

    // Sort all by timestamp newest first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [
    filteredSales,
    filteredChalans,
    filteredSupplierPayments,
    filteredBakiCollections,
    bakiTx,
    filteredExpenses,
<<<<<<< HEAD
    selectedDate,
    dateFilterPreset,
=======
    matchesDateFilter,
>>>>>>> c18622f (Bug Fix)
  ]);

  // Tab and search filter on activity feed
  const displayFeed = useMemo(() => {
    return activityFeed.filter((it) => {
      // Tab filter
      if (activityTab === 'SALES' && it.type !== 'SALE') return false;
      if (activityTab === 'CHALAN' && it.type !== 'CHALAN') return false;
      if (activityTab === 'COLLECTIONS' && it.type !== 'COLLECTION') return false;
      if (activityTab === 'EXPENSES' && it.type !== 'EXPENSE') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          it.title.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q) ||
          it.badgeText.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activityFeed, activityTab, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Super Admin Read-Only Notice */}
      {isSuperAdmin() && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse flex-shrink-0" />
            <span>
              সুপার অ্যাডমিন পরিদর্শন মোড: আপনি এই দোকানের দৈনিক রিপোর্ট ও অডিট পর্যবেক্ষণ করছেন (ক্যাশ মেলানো বা খরচ এন্ট্রি নিষ্ক্রিয়)।
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-950 text-[10px] font-black uppercase">
            শুধুমাত্র অডিট
          </span>
        </div>
      )}

      {/* 1. Header & Intelligent Date Controller */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-lg text-slate-900">
              দৈনিক হিসাব-নিকাশ ও ক্যাশবাক্স অডিট
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            তারিখ:{' '}
            <strong className="text-slate-800 font-bold">
              {dateFilterPreset === 'WEEK'
                ? `বিগত ৭ দিনের হিসাব (${toBanglaDigits(new Date(selectedDate).toLocaleDateString('bn-BD'))} হতে আজ)`
                : toBanglaDigits(new Date(selectedDate).toLocaleDateString('bn-BD'))}
            </strong>
          </p>
        </div>

        {/* Date Filter Preset Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => handleSelectPreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilterPreset === 'TODAY'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              আজ
            </button>
            <button
              onClick={() => handleSelectPreset('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilterPreset === 'YESTERDAY'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              গতকাল
            </button>
            <button
              onClick={() => handleSelectPreset('WEEK')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateFilterPreset === 'WEEK'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বিগত ৭ দিন
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setDateFilterPreset('CUSTOM');
                setSelectedDate(e.target.value);
              }}
              className="h-10 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none bg-slate-50 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Executive Deck: Hero Cards & Dokan Pillars */}
      <DailyProfitWidget
        metrics={metrics}
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenCashCountModal={() => setIsCashCountModalOpen(true)}
        onOpenDayClosingModal={() => setIsDayClosingModalOpen(true)}
      />

      {/* 3. Action Bar: 1-Tap Quick Action Shortcuts (Hidden for Super Admin) */}
      {!isSuperAdmin() && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setIsCashCountModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-xs flex items-center gap-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">ক্যাশবাক্সের নোট গণনা</span>
              <span className="text-[11px] text-emerald-700">ড্রয়ারের নগদ টাকা মেলান</span>
            </div>
          </button>

          <button
            onClick={() => setIsDayClosingModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs flex items-center gap-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">দিনের ক্লোজিং স্টেটমেন্ট</span>
              <span className="text-[11px] text-slate-500">প্রিন্ট ও হোয়াটসঅ্যাপ রিপোর্ট</span>
            </div>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs flex items-center gap-3 text-left transition-all col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">+ নতুন দোকান খরচ</span>
              <span className="text-[11px] text-amber-800">চা, ভাড়া বা বিদ্যুৎ বিল</span>
            </div>
          </button>
        </div>
      )}

      {/* 4. Unified Interactive Transaction Feed Hub */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Feed Header with Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-sm text-slate-900">
                সারাদিনের লেনদেন ও হিস্ট্রি ফিড
              </h4>
              <span className="text-xs font-bold text-slate-400">
                ({toBanglaDigits(displayFeed.length)} টি রেকর্ড)
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইনভয়েস, কোম্পানি বা খরচ খুঁজুন..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setActivityTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activityTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সব লেনদেন ({toBanglaDigits(activityFeed.length)})
            </button>

            <button
              onClick={() => setActivityTab('SALES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activityTab === 'SALES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>বিক্রি ({toBanglaDigits(filteredSales.length)})</span>
            </button>

            <button
              onClick={() => setActivityTab('CHALAN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activityTab === 'CHALAN'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>কোম্পানির চালান ({toBanglaDigits(filteredChalans.length)})</span>
            </button>

            <button
              onClick={() => setActivityTab('COLLECTIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activityTab === 'COLLECTIONS'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>বাকি আদায় ({toBanglaDigits(filteredBakiCollections.length)})</span>
            </button>

            <button
              onClick={() => setActivityTab('EXPENSES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activityTab === 'EXPENSES'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>দোকান খরচ ({toBanglaDigits(filteredExpenses.length)})</span>
            </button>
          </div>
        </div>

        {/* Feed List Items */}
        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {displayFeed.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
                <Receipt className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-600">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত তারিখে কোনো লেনদেন হয়নি বা সার্চের সাথে মিলছে না।
              </p>
            </div>
          ) : (
            displayFeed.map((item) => {
              const badgeColors: Record<string, string> = {
                green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                red: 'bg-rose-100 text-rose-800 border-rose-200',
                amber: 'bg-amber-100 text-amber-800 border-amber-200',
                teal: 'bg-teal-100 text-teal-800 border-teal-200',
                slate: 'bg-slate-100 text-slate-700 border-slate-200',
              };

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                        item.type === 'SALE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.type === 'CHALAN'
                          ? 'bg-slate-900 text-emerald-400'
                          : item.type === 'COLLECTION'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.type === 'SALE' && <ShoppingBag className="w-5 h-5" />}
                      {item.type === 'CHALAN' && <Truck className="w-5 h-5" />}
                      {item.type === 'COLLECTION' && <HandCoins className="w-5 h-5" />}
                      {item.type === 'EXPENSE' && <Receipt className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-sm text-slate-900 truncate">{item.title}</h5>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            badgeColors[item.badgeVariant] || badgeColors.slate
                          }`}
                        >
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {formatBengaliDate(item.date)}
                      </p>
                    </div>
                  </div>

                  {/* Financial Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-base font-black ${
                        item.isInflow ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {item.isInflow ? '+' : '-'}
                      {formatBengaliCurrency(item.amount)}
                    </p>
                    {item.paidAmount !== undefined && item.dueAmount !== undefined && item.dueAmount > 0 && (
                      <p className="text-[11px] font-bold text-rose-600">
                        বাকি: {formatBengaliCurrency(item.dueAmount)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Feed Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500 font-semibold">
          <span>মোট লেনদেন রেকর্ড: {toBanglaDigits(displayFeed.length)} টি</span>
          <span>সব আয় ও ব্যয়ের তথ্য স্বয়ংক্রিয়ভাবে অডিটেড ও ক্যাশবাক্সে সমন্বিত</span>
        </div>
      </div>

      {/* Modals */}
      <ExpenseLoggerModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseAdded={loadData}
      />

      <CashCountModal
        isOpen={isCashCountModalOpen}
        onClose={() => setIsCashCountModalOpen(false)}
        expectedCash={totalCashCollected}
<<<<<<< HEAD
=======
        openingFloat={openingFloat}
        businessDate={selectedDate}
        onCounted={(amount) => {
          setCountedCashToday(amount);
          loadData();
        }}
>>>>>>> c18622f (Bug Fix)
      />

      <DayClosingModal
        isOpen={isDayClosingModalOpen}
        onClose={() => setIsDayClosingModalOpen(false)}
        metrics={metrics}
        selectedDate={selectedDate}
<<<<<<< HEAD
=======
        openingFloat={openingFloat}
        countedCash={countedCashToday}
        onClosed={loadData}
>>>>>>> c18622f (Bug Fix)
      />
    </div>
  );
};
