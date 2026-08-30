// ==============================================================================
// MudiDokan (মুদিদোকান) Split Payment & Checkout Action Sheet
// Multi-modal checkouts: Cash, bKash, Nagad, and Split Due with Customer Ledger
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Customer } from '../../@types/database.types';
import { useCartStore } from '../../hooks/useCartStore';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { X, Check, DollarSign, Smartphone, BookOpen, AlertCircle } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface PaymentActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onConfirm: (method: 'CASH' | 'BAKI' | 'SPLIT') => void;
  onAddNewCustomer: () => void;
}

export const PaymentActionSheet: React.FC<PaymentActionSheetProps> = ({
  isOpen,
  onClose,
  customers,
  onConfirm,
  onAddNewCustomer,
}) => {
  const {
    getTotalAmount,
    selectedCustomer,
    setSelectedCustomer,
    paymentDetails,
    setPaymentDetails,
  } = useCartStore();

  const totalAmount = getTotalAmount();

  const [cashAmount, setCashAmount] = useState<number>(totalAmount);
  const [mfsAmount, setMfsAmount] = useState<number>(0);
  const [mfsProvider, setMfsProvider] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [mfsTxnId, setMfsTxnId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Auto calculate due amount
  const paidAmount = (cashAmount || 0) + (mfsAmount || 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  // Sync to store when amounts change
  useEffect(() => {
    setPaymentDetails({
      cashAmount,
      mfsAmount,
      mfsProvider,
      mfsTxnId,
      dueAmount,
      customer: selectedCustomer,
      paymentMethod: dueAmount > 0 ? (paidAmount > 0 ? 'SPLIT' : 'BAKI') : 'CASH',
    });
  }, [cashAmount, mfsAmount, mfsProvider, mfsTxnId, dueAmount, selectedCustomer, setPaymentDetails]);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const handleQuickAmount = (amount: number) => {
    setCashAmount(amount);
  };

  const handleComplete = () => {
    if (dueAmount > 0 && !selectedCustomer) {
      alert('বাকি থাকলে অবশ্যই একজন গ্রাহকের খাতা নির্বাচন করতে হবে!');
      return;
    }

    const method = dueAmount > 0 ? (paidAmount > 0 ? 'SPLIT' : 'BAKI') : 'CASH';
    onConfirm(method);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">পেমেন্ট ও হিসাব নিষ্পত্তি</h3>
            <p className="text-xs text-slate-300">নগদ, ডিজিটাল অথবা বাকির খাতা নির্ধারণ করুন</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Bill Summary Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">মোট বিল</p>
              <p className="text-lg font-black text-slate-900">{formatBengaliCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">জমা টাকা</p>
              <p className="text-lg font-black text-emerald-600">{formatBengaliCurrency(paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">অবশিষ্ট বাকি</p>
              <p className={`text-lg font-black ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {formatBengaliCurrency(dueAmount)}
              </p>
            </div>
          </div>

          {/* Quick Cash Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              নগদ টাকা (ক্যাশ):
            </label>
            <div className="relative mb-2">
              <input
                type="number"
                value={cashAmount || ''}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                placeholder="নগদ টাকার পরিমাণ..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-lg font-bold text-slate-900 focus:border-emerald-500 outline-none"
              />
              <div className="absolute left-4 top-4 text-slate-400 font-bold">৳</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAmount(totalAmount)}
                className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200"
              >
                ফুল ক্যাশ ({toBanglaDigits(totalAmount)})
              </button>
              <button
                onClick={() => handleQuickAmount(0)}
                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold border border-rose-200"
              >
                সম্পূর্ণ বাকি (০)
              </button>
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  +{toBanglaDigits(amt)}৳
                </button>
              ))}
            </div>
          </div>

          {/* Digital MFS (bKash / Nagad) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">মোবাইল ব্যাংকিং (বিকাশ / নগদ)</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMfsProvider('BKASH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    mfsProvider === 'BKASH'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  বিকাশ
                </button>
                <button
                  onClick={() => setMfsProvider('NAGAD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    mfsProvider === 'NAGAD'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  নগদ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={mfsAmount || ''}
                onChange={(e) => setMfsAmount(parseFloat(e.target.value) || 0)}
                placeholder="ডিজিটাল টাকার পরিমাণ..."
                className="h-11 px-3 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={mfsTxnId}
                onChange={(e) => setMfsTxnId(e.target.value)}
                placeholder="ট্রানজেকশন আইডি (ঐচ্ছিক)"
                className="h-11 px-3 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customer Selection if Due exists */}
          {dueAmount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">বাকি খাতা নির্বাচন আবশ্যক</span>
                </div>
                <button
                  onClick={onAddNewCustomer}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + নতুন খাতা খুলুন
                </button>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-300 shadow-sm">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{toBanglaDigits(selectedCustomer.phone)}</p>
                    <p className="text-xs text-rose-600 font-semibold mt-0.5">
                      পূর্বের বকেয়া: {formatBengaliCurrency(selectedCustomer.current_balance)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 bg-slate-100 rounded-lg"
                  >
                    বদলান
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                    className="w-full h-11 px-3 rounded-xl border border-rose-200 text-sm outline-none bg-white focus:border-rose-500"
                  />

                  <div className="max-h-36 overflow-y-auto divide-y divide-rose-100 bg-white rounded-xl border border-rose-200">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full p-2.5 text-left hover:bg-rose-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-900">{customer.name}</p>
                          <p className="text-xs text-slate-500">{toBanglaDigits(customer.phone)}</p>
                        </div>
                        <span className="text-xs font-bold text-rose-600">
                          {formatBengaliCurrency(customer.current_balance)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="w-1/3 h-14 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            বাতিল
          </button>
          <BigButton
            variant={dueAmount > 0 ? 'baki' : 'cash'}
            onClick={handleComplete}
            className="w-2/3"
            icon={Check}
          >
            {dueAmount > 0 ? 'হিসাব সংরক্ষণ ও বাকি নিশ্চিত' : 'পেমেন্ট সম্পন্ন করুন'}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
