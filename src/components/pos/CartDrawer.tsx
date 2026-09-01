// ==============================================================================
// MudiDokan (মুদিদোকান) POS Cart Drawer / Sidebar Component
// High-Contrast Touch Controls (>= 56px), Unit Switching, & Instant Checkouts
// ==============================================================================

import React, { useState } from 'react';
import { useCartStore } from '../../hooks/useCartStore';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { Trash2, Plus, Minus, Tag, User, ShoppingBag, ArrowRight } from 'lucide-react';
import { BigButton } from '../common/BigButton';
import { Customer } from '../../@types/database.types';

interface CartDrawerProps {
  customers: Customer[];
  onCashCheckout: () => void;
  onBakiCheckout: () => void;
  onOpenSplitModal: () => void;
  onOpenCustomerModal: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  customers,
  onCashCheckout,
  onBakiCheckout,
  onOpenSplitModal,
  onOpenCustomerModal,
}) => {
  const {
    items,
    incrementQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotalDiscount,
    getTotalAmount,
    selectedCustomer,
    setSelectedCustomer,
    cartDiscount,
    setCartDiscount,
  } = useCartStore();

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const grandTotal = getTotalAmount();

  const unitLabels: Record<string, string> = {
    kg: 'কেজি',
    gm: 'গ্রাম',
    litre: 'লিটার',
    packet: 'প্যাক',
    piece: 'পিস',
    hali: 'হালি',
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* 1. Header & Customer Bar */}
      <div className="p-4 bg-slate-900 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">বিক্রির ঝুড়ি (কার্ট)</h2>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-950 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              খালি করুন
            </button>
          )}
        </div>

        {/* Selected Customer Selector */}
        <div className="bg-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between border border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              {selectedCustomer ? (
                <>
                  <p className="text-sm font-bold truncate text-emerald-300">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    পূর্বের বাকি:{' '}
                    <span className="font-bold text-rose-400">
                      {formatBengaliCurrency(selectedCustomer.current_balance)}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-300">সাধারণ কাস্টমার (নগদ)</p>
                  <p className="text-[11px] text-slate-400">বাকি দিতে খাতা বাছুন</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 flex-shrink-0">
            {selectedCustomer ? (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200"
              >
                বাদ
              </button>
            ) : (
              <button
                onClick={onOpenCustomerModal}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm flex items-center gap-1"
              >
                <span>খাতা নির্বাচন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-700 text-base mb-1">ঝুড়ি খালি রয়েছে</h3>
            <p className="text-xs text-slate-400 max-w-[200px]">
              বামের গ্রিড থেকে বা উপরে পণ্য খুঁজে ট্যাপ করে কার্টে যোগ করুন।
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.product.name_bn}</h4>
                  <p className="text-xs text-slate-500">
                    দর: {formatBengaliCurrency(item.unitPrice)}/{unitLabels[item.selectedUnit] || item.selectedUnit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-base">
                    {formatBengaliCurrency(item.subtotal)}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper (56px touch target friendly) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => incrementQuantity(item.id, -1)}
                    aria-label="পরিমাণ কমান"
                    className="w-11 h-11 rounded-xl bg-white hover:bg-slate-200 active:bg-rose-100 active:text-rose-600 flex items-center justify-center font-bold text-slate-700 shadow-sm transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="min-w-[56px] text-center font-black text-base text-slate-900">
                    {toBanglaDigits(item.quantity)} {unitLabels[item.selectedUnit] || item.selectedUnit}
                    {item.selectedUnit === 'gm' && (
                      <span className="block text-[10px] font-semibold text-slate-400">
                        ± ৫০ গ্রাম
                      </span>
                    )}
                  </span>

                  <button
                    onClick={() => incrementQuantity(item.id, 1)}
                    aria-label="পরিমাণ বাড়ান"
                    className="w-11 h-11 rounded-xl bg-white hover:bg-slate-200 active:bg-emerald-100 active:text-emerald-700 flex items-center justify-center font-bold text-slate-700 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="আইটেম মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Financial Summary & Instant Actions */}
      {items.length > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 space-y-3">
          {/* Subtotal, Discount & Total */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>মোট উপ-টোটাল:</span>
              <span className="font-semibold">{formatBengaliCurrency(subtotal)}</span>
            </div>

            {/* Discount input toggle */}
            <div className="flex justify-between items-center text-slate-600">
              <button
                onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                className="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{cartDiscount > 0 ? 'ছাড় পরিবর্তন' : '+ স্পেশাল ছাড় যোগ'}</span>
              </button>
              {cartDiscount > 0 && (
                <span className="font-semibold text-rose-600">
                  -{formatBengaliCurrency(totalDiscount)}
                </span>
              )}
            </div>

            {isDiscountOpen && (
              <div className="flex gap-2 pt-1 animate-in fade-in">
                <input
                  type="number"
                  value={cartDiscount || ''}
                  onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="ছাড়ের টাকা (৳)"
                  className="h-10 px-3 flex-1 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => setIsDiscountOpen(false)}
                  className="px-3 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  ঠিক আছে
                </button>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-extrabold text-slate-900 text-lg">সর্বমোট দেয়:</span>
              <span className="font-black text-2xl text-emerald-800 tracking-tight">
                {formatBengaliCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout Triggers (>= 56px minimum hitboxes with clear Bengali semantics) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <BigButton
              variant="cash"
              onClick={onCashCheckout}
              subLabel="নগদ টাকায় পরিশোধ"
              className="col-span-1"
            >
              ক্যাশ বিক্রি
            </BigButton>

            <BigButton
              variant="baki"
              onClick={onBakiCheckout}
              subLabel={selectedCustomer ? 'খাতায় যোগ হবে' : 'গ্রাহক সিলেক্ট করুন'}
              className="col-span-1"
            >
              বাকিতে বিক্রি
            </BigButton>

            <BigButton
              variant="secondary"
              onClick={onOpenSplitModal}
              subLabel="বিকাশ / আংশিক জমা"
              className="col-span-2"
            >
              আংশিক ও ডিজিটাল পেমেন্ট (স্প্লিট)
            </BigButton>
          </div>
        </div>
      )}
    </div>
  );
};
