// ==============================================================================
// MudiDokan (মুদিদোকান) Transaction History Details Modal
// Comprehensive itemized breakdown for Sales, Chalans, Collections, and Expenses
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { db } from '../../db/offlineDb';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import {
  Sale,
  Expense,
  BakiTransaction,
  SupplierChalan,
  ChalanItem,
  SaleItem,
} from '../../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
} from '../../lib/banglaNumberFormatter';
import {
  X,
  ShoppingBag,
  Truck,
  HandCoins,
  Receipt,
  Printer,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { useModalDismiss } from '../../hooks/useModalDismiss';

export interface FeedTransactionItem {
  id: string;
  type: 'SALE' | 'CHALAN' | 'COLLECTION' | 'EXPENSE';
  title: string;
  subtitle: string;
  amount: number;
  badge: string;
  badgeColor: string;
  date: string;
  raw: Sale | SupplierChalan | BakiTransaction | Expense;
}

interface TransactionDetailModalProps {
  transaction: FeedTransactionItem | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [chalanItems, setChalanItems] = useState<ChalanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dialogRef = useModalDismiss<HTMLDivElement>(Boolean(transaction), onClose);

  useEffect(() => {
    if (!transaction) return;

    let isMounted = true;
    async function loadDetails() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          try {
            if (transaction?.type === 'SALE') {
              const sale = transaction.raw as Sale;
              const { data: cloudItems } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id);
              if (cloudItems && cloudItems.length > 0) {
                if (isMounted) setSaleItems(cloudItems);
                setIsLoading(false);
                return;
              }
            } else if (transaction?.type === 'CHALAN') {
              const chalan = transaction.raw as SupplierChalan;
              const { data: cloudItems } = await supabase.from('chalan_items').select('*').eq('chalan_id', chalan.id);
              if (cloudItems && cloudItems.length > 0) {
                if (isMounted) setChalanItems(cloudItems);
                setIsLoading(false);
                return;
              }
            }
          } catch (sbErr) {
            console.warn('[TransactionDetail] Live item fetch note:', sbErr);
          }
        }

        if (transaction?.type === 'SALE') {
          const sale = transaction.raw as Sale;
          const items = await db.sale_items.where('sale_id').equals(sale.id).toArray();
          if (isMounted) setSaleItems(items);
        } else if (transaction?.type === 'CHALAN') {
          const chalan = transaction.raw as SupplierChalan;
          const items = await db.chalan_items.where('chalan_id').equals(chalan.id).toArray();
          if (isMounted) setChalanItems(items);
        }
      } catch (err) {
        console.error('Error loading transaction details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [transaction]);

  if (!transaction) return null;

  const sale = transaction.type === 'SALE' ? (transaction.raw as Sale) : null;
  const chalan = transaction.type === 'CHALAN' ? (transaction.raw as SupplierChalan) : null;
  const bakiTx = transaction.type === 'COLLECTION' ? (transaction.raw as BakiTransaction) : null;
  const expense = transaction.type === 'EXPENSE' ? (transaction.raw as Expense) : null;

  const triggerThermalPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="লেনদেনের বিস্তারিত বিবরণ"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                transaction.type === 'SALE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : transaction.type === 'CHALAN'
                  ? 'bg-blue-100 text-blue-700'
                  : transaction.type === 'COLLECTION'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {transaction.type === 'SALE' && <ShoppingBag className="w-5 h-5" />}
              {transaction.type === 'CHALAN' && <Truck className="w-5 h-5" />}
              {transaction.type === 'COLLECTION' && <HandCoins className="w-5 h-5" />}
              {transaction.type === 'EXPENSE' && <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{transaction.title}</h3>
              <p className="text-xs text-slate-500">{transaction.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              বিস্তারিত লোড হচ্ছে...
            </div>
          ) : (
            <>
              {/* 1. SALE DETAILS */}
              {transaction.type === 'SALE' && sale && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>ইনভয়েস: {sale.invoice_no}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatBengaliDate(sale.created_at)}</span>
                    </div>
                  </div>

                  {/* Customer Info (if any) */}
                  {sale.customer_name && (
                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-900">{sale.customer_name}</p>
                          <p className="text-[11px] text-slate-500">বাকির খাতা গ্রাহক</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        কাস্টমার লিংকড
                      </span>
                    </div>
                  )}

                  {/* Sale Items List */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 flex justify-between border-b border-slate-200">
                      <span>পণ্য ও পরিমাণ</span>
                      <span>মোট মূল্য</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {saleItems.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">আইটেম বিস্তারিত পাওয়া যায়নি</div>
                      ) : (
                        saleItems.map((item, idx) => (
                          <div key={item.id || idx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                            <div>
                              <p className="font-bold text-slate-900">{item.product_name_bn || 'পণ্য'}</p>
                              <p className="text-[11px] text-slate-500">
                                {toBanglaDigits(item.quantity)} {item.unit || ''} × {formatBengaliCurrency(item.unit_selling_price)}
                              </p>
                            </div>
                            <span className="font-black text-slate-900">
                              {formatBengaliCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>মোট পণ্যের মূল্য</span>
                      <span>{formatBengaliCurrency(sale.total_amount + (sale.discount_amount || 0))}</span>
                    </div>
                    {sale.discount_amount > 0 && (
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>বিশেষ ছাড়</span>
                        <span>- {formatBengaliCurrency(sale.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                      <span>সর্বমোট বিল</span>
                      <span>{formatBengaliCurrency(sale.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700 pt-1">
                      <span>নগদ গ্রহণ (ক্যাশ ড্রয়ার)</span>
                      <span>{formatBengaliCurrency(sale.cash_amount || sale.paid_amount || 0)}</span>
                    </div>
                    {sale.due_amount > 0 && (
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>বাকি রাখা হয়েছে</span>
                        <span>{formatBengaliCurrency(sale.due_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. CHALAN DETAILS */}
              {transaction.type === 'CHALAN' && chalan && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 uppercase">চালান নম্বর</span>
                      <h4 className="font-black text-slate-900 text-base">{chalan.chalan_no}</h4>
                      <p className="text-xs text-slate-600 font-bold mt-0.5">কোম্পানি: {chalan.supplier_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-black text-xs">
                      {chalan.items_count || chalanItems.length} টি আইটেম
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold px-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>চালানের তারিখ: {formatBengaliDate(chalan.chalan_date || chalan.created_at)}</span>
                  </div>

                  {/* Chalan Items List */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 flex justify-between border-b border-slate-200">
                      <span>চালানের মালামাল</span>
                      <span>ক্রয় মূল্য</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {chalanItems.length === 0 ? (
                        <div className="p-3 text-slate-400 text-center">চালানের আইটেম বিস্তারিত নেই</div>
                      ) : (
                        chalanItems.map((item, idx) => (
                          <div key={item.id || idx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                            <div>
                              <p className="font-bold text-slate-900">{item.product_name_bn}</p>
                              <p className="text-[11px] text-slate-500">
                                {toBanglaDigits(item.quantity)} {item.unit} × {formatBengaliCurrency(item.unit_cost_price)}
                              </p>
                            </div>
                            <span className="font-black text-slate-900">
                              {formatBengaliCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chalan Payment Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-black text-sm text-slate-900">
                      <span>চালানের মোট মূল্য</span>
                      <span>{formatBengaliCurrency(chalan.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>নগদ পরিশোধ</span>
                      <span>{formatBengaliCurrency(chalan.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>মহাজনের বকেয়া বাকি (দেনা)</span>
                      <span>{formatBengaliCurrency(chalan.due_amount)}</span>
                    </div>
                    {chalan.notes && (
                      <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                        <strong>নোট:</strong> {chalan.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. BAKI COLLECTION DETAILS */}
              {transaction.type === 'COLLECTION' && bakiTx && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-center">
                    <span className="text-xs font-bold text-teal-800 uppercase block mb-1">কাস্টমার বাকি আদায়কৃত টাকা</span>
                    <h2 className="text-3xl font-black text-teal-900">{formatBengaliCurrency(bakiTx.amount)}</h2>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-950 font-bold text-xs">
                      {bakiTx.payment_method === 'CASH' ? 'ক্যাশবাক্স নগদ জমা' : bakiTx.payment_method === 'BKASH' ? 'বিকাশ গ্রহণ' : 'নগদ জমা'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">গ্রাহকের নাম:</span>
                      <span className="font-black text-slate-900">{bakiTx.customer_name || 'সম্মানিত কাস্টমার'}</span>
                    </div>
                    {bakiTx.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">মোবাইল:</span>
                        <span className="font-bold text-slate-800">{bakiTx.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">আদায়ের তারিখ:</span>
                      <span className="font-semibold text-slate-700">{formatBengaliDate(bakiTx.created_at)}</span>
                    </div>
                    {bakiTx.note && (
                      <div className="pt-2 border-t border-slate-200 text-slate-700">
                        <span className="font-bold block mb-0.5">বিবরণ / নোট:</span>
                        <span>{bakiTx.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. EXPENSE DETAILS */}
              {transaction.type === 'EXPENSE' && expense && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <span className="text-xs font-bold text-amber-800 uppercase block mb-1">দোকান খরচের পরিমাণ</span>
                    <h2 className="text-3xl font-black text-amber-950">{formatBengaliCurrency(expense.amount)}</h2>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-xs">
                      ক্যাটাগরি: {expense.category}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">খরচের তারিখ:</span>
                      <span className="font-semibold text-slate-800">{formatBengaliDate(expense.expense_date || expense.created_at)}</span>
                    </div>
                    {expense.note && (
                      <div className="pt-2 border-t border-slate-200 text-slate-700">
                        <span className="font-bold block mb-0.5">খরচের বিবরণ:</span>
                        <span>{expense.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          {transaction.type === 'SALE' && (
            <button
              onClick={() => triggerThermalPrint()}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>রসিদ প্রিন্ট</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
