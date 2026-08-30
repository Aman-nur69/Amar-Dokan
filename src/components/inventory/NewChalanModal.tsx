// ==============================================================================
// MudiDokan (মুদিদোকান) New Supplier Chalan Entry Modal
// High-Affordance Line Items Builder with Automatic Stock Replenishment & 1-Tap Payments
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Product, ProductUnit } from '../../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { X, Plus, Trash2, Check, Truck, Sparkles, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface ChalanLineItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitCostPrice: number;
  unitSellingPrice: number;
  subtotal: number;
}

interface NewChalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
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
}

const COMMON_SUPPLIERS = [
  'মেঘনা গ্রুপ (ফ্রেশ ডিলার)',
  'সিটি গ্রুপ (তীর ডিস্ট্রিবিউটর)',
  'স্কয়ার কনজিউমার (রাঁধুনী/রুচি)',
  'প্রাণ ফুডস (PRAN)',
  'ইউনিলিভার বাংলাদেশ',
  'আকিজ এসেনশিয়ালস',
  'বসুন্ধরা ফুড',
  'কারওয়ান বাজার পাইকারি আড়ত',
];

export const NewChalanModal: React.FC<NewChalanModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveChalan,
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [chalanNo, setChalanNo] = useState('');
  const [chalanDate, setChalanDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<ChalanLineItemInput[]>([]);

  // Automatically initialize modal fields when opened
  useEffect(() => {
    if (isOpen) {
      setChalanNo(`CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setChalanDate(new Date().toISOString().split('T')[0]);

      if (products.length > 0) {
        const first = products[0];
        const defaultQty = 10;
        const defaultCost = Number(first.cost_price || 0);
        const sub = defaultQty * defaultCost;

        setLineItems([
          {
            productId: first.id,
            productName: first.name_bn,
            quantity: defaultQty,
            unit: first.unit,
            unitCostPrice: defaultCost,
            unitSellingPrice: Number(first.selling_price || 0),
            subtotal: sub,
          },
        ]);
        setPaidAmount(sub); // Default to full payment so money flow is accurate
      }
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  // Calculate totals
  const totalChalanAmount = lineItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const dueAmount = Math.max(0, totalChalanAmount - (Number(paidAmount) || 0));

  const handleAddLineItem = () => {
    const defaultProd = products.find((p) => !lineItems.some((it) => it.productId === p.id)) || products[0];
    if (!defaultProd) return;

    const defaultQty = 10;
    const defaultCost = Number(defaultProd.cost_price || 0);
    const sub = defaultQty * defaultCost;

    setLineItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productName: defaultProd.name_bn,
        quantity: defaultQty,
        unit: defaultProd.unit,
        unitCostPrice: defaultCost,
        unitSellingPrice: Number(defaultProd.selling_price || 0),
        subtotal: sub,
      },
    ]);

    // Update paid amount if it was matching previous total
    setPaidAmount((prev) => (prev === totalChalanAmount ? prev + sub : prev));
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return; // Keep at least one item
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const matched = products.find((p) => p.id === prodId);
    if (!matched) return;

    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      item.productId = matched.id;
      item.productName = matched.name_bn;
      item.unit = matched.unit;
      item.unitCostPrice = Number(matched.cost_price || 0);
      item.unitSellingPrice = Number(matched.selling_price || 0);
      item.subtotal = Number(item.quantity) * Number(matched.cost_price || 0);
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const cleanQty = Math.max(0, qty);
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      item.quantity = cleanQty;
      item.subtotal = cleanQty * Number(item.unitCostPrice || 0);
      return updated;
    });
  };

  const handleCostPriceChange = (index: number, cost: number) => {
    const cleanCost = Math.max(0, cost);
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      item.unitCostPrice = cleanCost;
      item.subtotal = Number(item.quantity || 0) * cleanCost;
      return updated;
    });
  };

  const handleSellingPriceChange = (index: number, price: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].unitSellingPrice = Math.max(0, price);
      return updated;
    });
  };

  const handleFullCashPayment = () => {
    setPaidAmount(totalChalanAmount);
    setPaymentMethod('CASH');
  };

  const handleFullDuePayment = () => {
    setPaidAmount(0);
    setPaymentMethod('DUE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('দয়া করে কোম্পানি বা ডিলারের নাম লিখুন।');
      return;
    }

    if (lineItems.length === 0 || totalChalanAmount <= 0) {
      alert('চালানে অন্তত একটি পণ্যের সঠিক পরিমাণ ও ক্রয় দর থাকতে হবে।');
      return;
    }

    setIsSubmitting(true);

    const formattedItems = lineItems.map((it) => {
      const matched = products.find((p) => p.id === it.productId) || products[0];
      return {
        product_id: it.productId || matched.id,
        product_name_bn: it.productName || matched.name_bn,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || matched.unit,
        unit_cost_price: Number(it.unitCostPrice) || Number(matched.cost_price),
        unit_selling_price: Number(it.unitSellingPrice) || Number(matched.selling_price),
        subtotal: Number(it.subtotal) || Number(it.quantity) * Number(it.unitCostPrice),
      };
    });

    const res = await onSaveChalan(
      {
        chalan_no: chalanNo,
        supplier_name: supplierName,
        supplier_phone: supplierPhone,
        chalan_date: chalanDate,
        total_amount: Number(totalChalanAmount),
        paid_amount: Number(paidAmount) || 0,
        due_amount: Number(dueAmount) || 0,
        payment_method: paymentMethod,
        notes: notes,
      },
      formattedItems
    );

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      alert(res.error || 'চালান এন্ট্রি করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">কোম্পানি / মহাজনের চালান এন্ট্রি</h3>
              <p className="text-xs text-slate-300">
                নতুন মাল রিসিভ করুন — সব পণ্যের স্টক ও দৈনিক ক্যাশ হিসাব স্বয়ংক্রিয়ভাবে আপডেট হবে
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Supplier / Company Information */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                কোম্পানি / ডিলার / মহাজনের নাম *
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">
                জনপ্রিয় সাপ্লায়ার প্রিসেট (১-ট্যাপ)
              </span>
            </div>

            {/* Quick Supplier Chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SUPPLIERS.map((sup) => (
                <button
                  key={sup}
                  type="button"
                  onClick={() => setSupplierName(sup)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    supplierName === sup
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sup}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="কোম্পানি বা ডিলারের নাম লিখুন..."
                className="h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="ডিলারের মোবাইল নম্বর (ঐচ্ছিক)..."
                className="h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">চালান নম্বর</label>
                <input
                  type="text"
                  required
                  value={chalanNo}
                  onChange={(e) => setChalanNo(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">চালানের তারিখ</label>
                <input
                  type="date"
                  required
                  value={chalanDate}
                  onChange={(e) => setChalanDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-white focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Received Goods (Line Items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>চালানের মালামাল তালিকা</span>
                <span className="text-xs font-normal text-slate-500">
                  ({toBanglaDigits(lineItems.length)} টি আইটেম)
                </span>
              </h4>

              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ আরও পণ্য যোগ</span>
              </button>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                      {toBanglaDigits(idx + 1)}
                    </span>

                    {/* Product Selector */}
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 outline-none focus:border-emerald-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_bn} ({p.unit}) — বর্তমান স্টক: {toBanglaDigits(p.stock_quantity)}
                        </option>
                      ))}
                    </select>

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="বাদ দিন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quantity, Cost Price, Selling Price, and Subtotal */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        মালের পরিমাণ ({item.unit})
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                        placeholder="১০"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        ক্রয়মূল্য / দর (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitCostPrice || ''}
                        onChange={(e) => handleCostPriceChange(idx, parseFloat(e.target.value) || 0)}
                        placeholder="১০০"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                        নতুন বিক্রি দর (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitSellingPrice || ''}
                        onChange={(e) =>
                          handleSellingPriceChange(idx, parseFloat(e.target.value) || 0)
                        }
                        placeholder="১২০"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col justify-center text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">সাব-টোটাল</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatBengaliCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Financial Settlement (Paid vs Due) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-slate-800">মোট চালান মূল্য:</span>
              <span className="text-2xl font-black text-emerald-800">
                {formatBengaliCurrency(totalChalanAmount)}
              </span>
            </div>

            {/* Quick 1-Tap Payment Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFullCashPayment}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>সম্পূর্ণ নগদ পরিশোধ (ক্যাশ আউট)</span>
              </button>
              <button
                type="button"
                onClick={handleFullDuePayment}
                className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1 hover:bg-rose-200 transition-colors"
              >
                <CircleDollarSign className="w-3.5 h-3.5" />
                <span>সম্পূর্ণ বাকি</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  নগদ পরিশোধ (ক্যাশবাক্স থেকে) ৳
                </label>
                <input
                  type="number"
                  value={paidAmount !== undefined ? paidAmount : ''}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="কত টাকা ডেলিভারিতে দিলেন..."
                  className="w-full h-12 px-3 rounded-xl border-2 border-emerald-400 text-base font-black text-slate-900 bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  পরিশোধের মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-bold outline-none bg-white"
                >
                  <option value="CASH">নগদ ক্যাশ (ড্রয়ার থেকে)</option>
                  <option value="BKASH">বিকাশ / নগদ (ডিজিটাল)</option>
                  <option value="BANK">ব্যাংক / চেক</option>
                  <option value="DUE">সম্পূর্ণ বাকি</option>
                </select>
              </div>

              <div className="bg-white p-3 rounded-xl border border-rose-200 flex flex-col justify-center text-right">
                <span className="text-[11px] font-bold text-slate-500">কোম্পানির পাওনা বাকি:</span>
                <span
                  className={`text-lg font-black ${
                    dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {dueAmount > 0 ? formatBengaliCurrency(dueAmount) : '৳ ০.০০ (সম্পূর্ণ শোধ)'}
                </span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="নোট বা চালান সংক্রান্ত মন্তব্য (ঐচ্ছিক, যেমন: SR রফিক সাহেব মাল দিয়ে গেছেন)..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-medium outline-none bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Automatic Inventory Sync Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-teal-600" />
            <span>
              চালান নিশ্চিত করলে সব পণ্যের মজুদ (Stock) সাথে সাথে বৃদ্ধি পাবে এবং দৈনিক ক্যাশবাক্স হিসাব সমন্বয় হবে।
            </span>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              বাতিল
            </button>
            <BigButton
              variant="cash"
              type="submit"
              disabled={isSubmitting || totalChalanAmount <= 0}
              className="w-2/3"
              icon={Check}
            >
              {isSubmitting ? 'চালান সংরক্ষণ হচ্ছে...' : 'চালান সংরক্ষণ ও স্টক আপডেট করুন'}
            </BigButton>
          </div>
        </form>
      </div>
    </div>
  );
};
