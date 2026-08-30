// ==============================================================================
// MudiDokan (মুদিদোকান) Customer Statement & Quick Actions Drawer
// WhatsApp/SMS Ledger Statement Share Engine, 1-Tap Collection & Manual Due
// ==============================================================================

import React, { useState } from 'react';
import { Customer, BakiTransaction } from '../../@types/database.types';
import { DEFAULT_STORE } from '../../db/offlineDb';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import {
  generateWhatsAppReminderUrl,
  generateSmsReminderUrl,
  generateCustomerBakiStatementText,
} from '../../lib/printService';
import {
  X,
  UserPlus,
  Share2,
  MessageSquare,
  Copy,
  Check,
  Phone,
  MapPin,
  PlusCircle,
  HandCoins,
} from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface QuickCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CREATE' | 'STATEMENT';
  selectedCustomer?: Customer | null;
  customerTransactions?: BakiTransaction[];
  onCustomerCreated?: (customer: Customer) => void;
  onCreateCustomerSubmit?: (
    name: string,
    phone: string,
    address?: string,
    creditLimit?: number,
    openingDue?: number
  ) => Promise<{ success: boolean; error?: string; customer?: Customer }>;
  onOpenPaymentCollect?: (customer: Customer) => void;
  onAddManualDue?: (
    customerId: string,
    amount: number,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const QuickCustomerDrawer: React.FC<QuickCustomerDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  selectedCustomer,
  customerTransactions = [],
  onCustomerCreated,
  onCreateCustomerSubmit,
  onOpenPaymentCollect,
  onAddManualDue,
}) => {
  // Create form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [openingDue, setOpeningDue] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual Due state inside statement
  const [isAddingDue, setIsAddingDue] = useState(false);
  const [manualDueAmount, setManualDueAmount] = useState<number>(0);
  const [manualDueNote, setManualDueNote] = useState<string>('');
  const [isSubmittingDue, setIsSubmittingDue] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateCustomerSubmit) return;

    setErrorMsg('');
    setIsSubmitting(true);

    const res = await onCreateCustomerSubmit(name, phone, address, creditLimit, openingDue);
    setIsSubmitting(false);

    if (res.success && res.customer) {
      if (onCustomerCreated) {
        onCustomerCreated(res.customer);
      }
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue(0);
      onClose();
    } else {
      setErrorMsg(res.error || 'খাতা তৈরিতে সমস্যা হয়েছে।');
    }
  };

  const handleAddDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !onAddManualDue) return;

    if (manualDueAmount <= 0) {
      alert('দয়া করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    setIsSubmittingDue(true);
    const res = await onAddManualDue(
      selectedCustomer.id,
      manualDueAmount,
      manualDueNote.trim() || 'হাতে নতুন বাকি প্রদান'
    );
    setIsSubmittingDue(false);

    if (res.success) {
      setIsAddingDue(false);
      setManualDueAmount(0);
      setManualDueNote('');
    } else {
      alert(res.error || 'বাকি যোগ করতে সমস্যা হয়েছে।');
    }
  };

  const handleCopyStatement = () => {
    if (!selectedCustomer) return;
    const text = generateCustomerBakiStatementText(
      selectedCustomer,
      customerTransactions,
      DEFAULT_STORE
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!selectedCustomer) return;
    const url = generateWhatsAppReminderUrl({
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      storeName: DEFAULT_STORE.name,
      storePhone: DEFAULT_STORE.phone,
      dueAmount: selectedCustomer.current_balance,
      bkashNumber: DEFAULT_STORE.bkash_number,
      nagadNumber: DEFAULT_STORE.nagad_number,
    });
    window.open(url, '_blank');
  };

  const handleSms = () => {
    if (!selectedCustomer) return;
    const url = generateSmsReminderUrl({
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      storeName: DEFAULT_STORE.name,
      storePhone: DEFAULT_STORE.phone,
      dueAmount: selectedCustomer.current_balance,
      bkashNumber: DEFAULT_STORE.bkash_number,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right">
        {/* Top Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-lg">
              {mode === 'CREATE' ? 'নতুন বাকির খাতা তৈরি' : 'গ্রাহকের লেজার ও বিবরণী'}
            </h3>
            <p className="text-xs text-slate-300">
              {mode === 'CREATE'
                ? 'গ্রাহকের তথ্য ও মোবাইল নম্বর সংরক্ষণ করুন'
                : selectedCustomer?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'CREATE' ? (
            /* ================= CREATE FORM ================= */
            <form onSubmit={handleCreate} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  গ্রাহকের পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: হাজী রফিকুল ইসলাম"
                  className="w-full h-13 px-4 rounded-2xl border-2 border-slate-200 text-base font-semibold text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  ১১ ডিজিটের মোবাইল নম্বর *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711998877"
                    className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-base font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  />
                  <div className="absolute left-4 top-3.5 text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  নম্বরটি দিয়ে হোয়াটসঅ্যাপে স্বয়ংক্রিয় তাগাদা ও রসিদ পাঠানো যাবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  পূর্বে কোনো বাকি আছে কি? (প্রারম্ভিক বকেয়া)
                </label>
                <input
                  type="number"
                  value={openingDue || ''}
                  onChange={(e) => setOpeningDue(parseFloat(e.target.value) || 0)}
                  placeholder="পূর্বের খাতার বাকি টাকা..."
                  className="w-full h-13 px-4 rounded-2xl border-2 border-slate-200 text-base font-bold text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  ঠিকানা বা পরিচয় (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="যেমন: বাড়ি নং ৪২, রোড ৭, মিরপুর ১০"
                    className="w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-sm font-medium text-slate-900 focus:border-emerald-500 outline-none"
                  />
                  <div className="absolute left-4 top-3.5 text-slate-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
              </div>

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
              </div>

              <div className="pt-4">
                <BigButton
                  variant="cash"
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  icon={UserPlus}
                >
                  {isSubmitting ? 'খাতা খোলা হচ্ছে...' : 'খাতা নিশ্চিত করুন'}
                </BigButton>
              </div>
            </form>
          ) : (
            /* ================= STATEMENT & SHARE VIEW ================= */
            selectedCustomer && (
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-black text-white">{selectedCustomer.name}</h4>
                      <p className="text-xs text-slate-300">
                        {formatBengaliPhone(selectedCustomer.phone)}
                      </p>
                      {selectedCustomer.address && (
                        <p className="text-xs text-slate-400 mt-0.5">{selectedCustomer.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">বর্তমান দেনা</span>
                      <span className="text-2xl font-black text-rose-400">
                        {formatBengaliCurrency(selectedCustomer.current_balance)}
                      </span>
                    </div>
                  </div>

                  {/* Actions on customer */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onOpenPaymentCollect && onOpenPaymentCollect(selectedCustomer)}
                      className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <HandCoins className="w-4 h-4" />
                      <span>বাকি আদায় করুন</span>
                    </button>

                    <button
                      onClick={() => setIsAddingDue(!isAddingDue)}
                      className="h-11 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ নতুন বাকি যোগ</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleCopyStatement}
                      className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>হিসাব কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>সম্পূর্ণ হিসাব স্টেটমেন্ট কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form to add manual due */}
                {isAddingDue && (
                  <form
                    onSubmit={handleAddDueSubmit}
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-rose-800 uppercase">
                        হাতে নতুন বাকি প্রদান এন্ট্রি
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingDue(false)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        ✕
                      </button>
                    </div>

                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={manualDueAmount || ''}
                      onChange={(e) => setManualDueAmount(parseFloat(e.target.value) || 0)}
                      placeholder="টাকার পরিমাণ লিখুন..."
                      className="w-full h-12 px-3 rounded-xl border border-rose-300 bg-white text-base font-black text-slate-900 outline-none focus:border-rose-500"
                      autoFocus
                    />

                    <input
                      type="text"
                      value={manualDueNote}
                      onChange={(e) => setManualDueNote(e.target.value)}
                      placeholder="বিবরণ (যেমন: চাল ও ডাল নেওয়া হলো / নগদ ঋণ)..."
                      className="w-full h-11 px-3 rounded-xl border border-rose-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-rose-500"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingDue || manualDueAmount <= 0}
                      className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs"
                    >
                      {isSubmittingDue ? 'সংরক্ষণ হচ্ছে...' : '✓ বাকি নিশ্চিত করুন'}
                    </button>
                  </form>
                )}

                {/* Direct WhatsApp & SMS Reminders */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-950 uppercase mb-2 flex items-center gap-1">
                    <span>১-ক্লিকে তাগাদা পাঠান:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleWhatsApp}
                      className="h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>হোয়াটসঅ্যাপ মেসেজ</span>
                    </button>
                    <button
                      onClick={handleSms}
                      className="h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>সরাসরি এসএমএস</span>
                    </button>
                  </div>
                </div>

                {/* Audit Trail Transactions List */}
                <div>
                  <h5 className="font-bold text-sm text-slate-800 mb-2 flex items-center justify-between">
                    <span>লেনদেনের ইতিহাস (হালখাতা)</span>
                    <span className="text-xs text-slate-500 font-normal">
                      {toBanglaDigits(customerTransactions.length)}টি এন্ট্রি
                    </span>
                  </h5>

                  {customerTransactions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {customerTransactions.map((tx) => {
                        const isDebit = tx.type === 'DEBIT';
                        return (
                          <div
                            key={tx.id}
                            className="p-3 rounded-2xl bg-white border border-slate-200 flex justify-between items-center shadow-sm"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isDebit ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                />
                                <span className="font-bold text-sm text-slate-900">
                                  {isDebit ? 'নতুন বাকি নেওয়া' : 'বাকি পরিশোধ (জমা)'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {formatBengaliDate(tx.created_at)}
                                {tx.note && ` • ${tx.note}`}
                              </p>
                            </div>

                            <span
                              className={`font-black text-base ${
                                isDebit ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {isDebit ? '+' : '-'}
                              {formatBengaliCurrency(tx.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
