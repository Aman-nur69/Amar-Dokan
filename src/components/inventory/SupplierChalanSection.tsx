// ==============================================================================
// MudiDokan (মুদিদোকান) Supplier Delivery Chalan Section Component
// Inward Goods Reception, Due Settlement, and Mobile/Tablet Optimized UI
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { SupplierChalan, ChalanItem, Product, ProductUnit } from '../../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import {
  Truck,
  Plus,
  Search,
  FileText,
  Phone,
  Eye,
  CheckCircle2,
  AlertCircle,
  Wallet,
  HandCoins,
} from 'lucide-react';
import { NewChalanModal } from './NewChalanModal';
import { ChalanDetailModal } from './ChalanDetailModal';
import { SupplierDuePayModal } from './SupplierDuePayModal';

interface SupplierChalanSectionProps {
  chalans: SupplierChalan[];
  chalanItems: ChalanItem[];
  products: Product[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalChalansCount: number;
  totalChalanValuation: number;
  totalSupplierPaid: number;
  totalSupplierDue: number;
  onSaveChalan: (
    chalanData: {
      chalan_no: string;
      supplier_name: string;
      supplier_phone?: string;
      chalan_date: string;
      total_amount: number;
      paid_amount: number;
      due_amount: number;
      payment_method: string;
      notes?: string;
    },
    items: {
      product_id: string;
      product_name_bn: string;
      quantity: number;
      unit: ProductUnit;
      unit_cost_price: number;
      unit_selling_price?: number;
      subtotal: number;
    }[]
  ) => Promise<{ success: boolean; error?: string }>;
  onPaySupplierDue: (
    chalanId: string,
    amount: number,
    paymentMethod: 'CASH' | 'BKASH' | 'BANK',
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const SupplierChalanSection: React.FC<SupplierChalanSectionProps> = ({
  chalans,
  chalanItems,
  products,
  searchQuery,
  onSearchChange,
  totalChalansCount,
  totalChalanValuation,
  totalSupplierPaid,
  totalSupplierDue,
  onSaveChalan,
  onPaySupplierDue,
}) => {
  const [isNewChalanModalOpen, setIsNewChalanModalOpen] = useState(false);
  const [selectedChalan, setSelectedChalan] = useState<SupplierChalan | null>(null);
  const [payingChalan, setPayingChalan] = useState<SupplierChalan | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');

  const dueChalansCount = useMemo(() => chalans.filter((c) => c.due_amount > 0).length, [chalans]);
  const paidChalansCount = useMemo(() => chalans.filter((c) => c.due_amount <= 0).length, [chalans]);

  const displayedChalans = useMemo(() => {
    return chalans.filter((c) => {
      if (statusFilter === 'DUE' && c.due_amount <= 0) return false;
      if (statusFilter === 'PAID' && c.due_amount > 0) return false;
      return true;
    });
  }, [chalans, statusFilter]);

  return (
    <div className="space-y-5">
      {/* 1. Top KPI Summary Cards (Mobile 2-column, Tablet/Desktop 4-column) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Chalans Count */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-lg flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 mb-0.5 truncate">
              মোট চালান এন্ট্রি
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-emerald-400">
              {toBanglaDigits(totalChalansCount)} টি
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">গৃহীত চালানের সংখ্যা</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Inward Goods Valuation */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-500 mb-0.5 truncate">
              মোট চালানের মূল্য
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 truncate">
              {formatBengaliCurrency(totalChalanValuation)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">মোট মালের ক্রয়দর</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Supplier Paid Amount */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-emerald-800 mb-0.5 truncate">
              কোম্পানিকে পরিশোধ
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-emerald-700 truncate">
              {formatBengaliCurrency(totalSupplierPaid)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-800/70 mt-0.5 truncate">ক্যাশ/বিকাশে পরিশোধিত</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Supplier Due (Red Alert) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-rose-800 mb-0.5 truncate">
              কোম্পানির চালান বকেয়া
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-rose-600 truncate">
              {formatBengaliCurrency(totalSupplierDue)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-rose-800/70 mt-0.5 truncate">
              {toBanglaDigits(dueChalansCount)} টি চালানে বাকি আছে
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Action Bar & Filters (Touch-friendly for mobile/tablet) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="কোম্পানি / ডিলারের নাম বা চালান নম্বর খুঁজুন..."
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:border-emerald-500 outline-none shadow-xs"
              />
              <div className="absolute left-3.5 top-3.5 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {/* + New Chalan Button */}
            <button
              onClick={() => setIsNewChalanModalOpen(true)}
              className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন চালান এন্ট্রি</span>
            </button>
          </div>

          {/* Filter Tabs: All, Due Only, Paid Only */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সব চালান ({toBanglaDigits(chalans.length)})
            </button>

            <button
              onClick={() => setStatusFilter('DUE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'DUE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>বকেয়া চালান ({toBanglaDigits(dueChalansCount)})</span>
            </button>

            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>পরিশোধিত চালান ({toBanglaDigits(paidChalansCount)})</span>
            </button>
          </div>
        </div>

        {/* 3. Chalans List (Mobile Stacked & Tablet Row Layout) */}
        <div className="divide-y divide-slate-100">
          {displayedChalans.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Truck className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-600 mb-1">কোনো চালানের রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs">নতুন মালামাল দোকানে আসলে উপরের বাটনে চাপ দিয়ে চালান এন্ট্রি করুন।</p>
            </div>
          ) : (
            displayedChalans.map((chalan) => {
              const isDue = chalan.due_amount > 0;

              return (
                <div
                  key={chalan.id}
                  onClick={() => setSelectedChalan(chalan)}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 cursor-pointer"
                >
                  {/* Left: Supplier Info & Chalan No */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm ${
                        isDue ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-base text-slate-900 truncate">
                        {chalan.supplier_name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {chalan.chalan_no}
                        </span>
                        <span>{formatBengaliDate(chalan.chalan_date)}</span>
                        <span>•</span>
                        <span>{toBanglaDigits(chalan.items_count)} টি আইটেম</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts, Payment Status Badge, & Actions */}
                  <div
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Amount Block */}
                    <div className="text-left md:text-right pr-2">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                        চালান মূল্য
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {formatBengaliCurrency(chalan.total_amount)}
                      </span>
                      {isDue ? (
                        <p className="text-xs font-black text-rose-600">
                          বাকি: {formatBengaliCurrency(chalan.due_amount)}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-600 flex items-center md:justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          সম্পূর্ণ শোধ
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {/* Due Payment Trigger Button */}
                      {isDue && (
                        <button
                          onClick={() => setPayingChalan(chalan)}
                          className="h-11 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all flex-shrink-0"
                        >
                          <HandCoins className="w-4 h-4" />
                          <span>বাকি শোধ</span>
                        </button>
                      )}

                      {chalan.supplier_phone && (
                        <a
                          href={`tel:${chalan.supplier_phone}`}
                          className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center shadow-xs transition-all flex-shrink-0"
                          title="ডিলারকে কল করুন"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedChalan(chalan)}
                        className="h-11 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>বিবরণ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 font-semibold">
          <span>মোট চালান রেকর্ড: {toBanglaDigits(displayedChalans.length)} টি</span>
          <span>চালানের বকেয়া পরিশোধ করলে দৈনিক ক্যাশবাক্স থেকে স্বয়ংক্রিয়ভাবে বাদ যাবে</span>
        </div>
      </div>

      {/* New Chalan Modal */}
      <NewChalanModal
        isOpen={isNewChalanModalOpen}
        onClose={() => setIsNewChalanModalOpen(false)}
        products={products}
        onSaveChalan={onSaveChalan}
      />

      {/* Chalan Detail Breakdown Modal */}
      <ChalanDetailModal
        chalan={selectedChalan}
        items={chalanItems}
        isOpen={Boolean(selectedChalan)}
        onClose={() => setSelectedChalan(null)}
        onOpenPayModal={(c) => setPayingChalan(c)}
      />

      {/* Supplier Due Payment Modal */}
      <SupplierDuePayModal
        chalan={payingChalan}
        isOpen={Boolean(payingChalan)}
        onClose={() => setPayingChalan(null)}
        onPayDue={onPaySupplierDue}
      />
    </div>
  );
};
