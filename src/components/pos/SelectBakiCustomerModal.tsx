// ==============================================================================
// MudiDokan (মুদিদোকান) POS Customer Selector Modal for Baki (Credit) Sales
// 1. Search & Select from Existing Customers (নাম বা মোবাইল নম্বর দিয়ে সার্চ)
// 2. Or Click "+ নতুন বাকির খাতা খুলুন" to register a new customer on the fly
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { Customer } from '../../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import {
  Search,
  UserPlus,
  User,
  Phone,
  MapPin,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SelectBakiCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onOpenNewCustomerModal: () => void;
}

export const SelectBakiCustomerModal: React.FC<SelectBakiCustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onOpenNewCustomerModal,
}) => {
  const [search, setSearch] = useState('');

  // Sort: Customers with due first, then alphabetically
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      // Due customers first
      if (b.current_balance > 0 && a.current_balance <= 0) return 1;
      if (a.current_balance > 0 && b.current_balance <= 0) return -1;
      return b.current_balance - a.current_balance;
    });
  }, [customers, search]);

  const dialogRef = useModalDismiss<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleAddNew = () => {
    onClose();
    onOpenNewCustomerModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="বাকির খাতা নির্বাচন"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black">বাকির খাতা নির্বাচন করুন</h3>
              <p className="text-xs text-slate-300">
                আগের খাতা থেকে খুঁজুন অথবা নতুন গ্রাহক যোগ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search & New Customer Action Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3 flex-shrink-0">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border-2 border-slate-200 text-sm font-semibold text-slate-900 focus:border-emerald-500 outline-none shadow-xs"
            />
            <div className="absolute left-3.5 top-3.5 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* "+ নতুন গ্রাহক / খাতা খুলুন" Button */}
          <button
            onClick={handleAddNew}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন বাকির খাতা খুলুন (তালিকার বাইরে থাকলে)</span>
          </button>
        </div>

        {/* Existing Customers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
          <div className="px-2 py-1 flex justify-between items-center text-xs font-bold text-slate-500">
            <span>বিদ্যমান গ্রাহক তালিকা ({toBanglaDigits(filteredCustomers.length)} জন)</span>
            <span>১-ট্যাপে নির্বাচন করুন</span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <User className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">
                  "{search}" নামে কোনো খাতা পাওয়া যায়নি
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  নতুন গ্রাহক হলে উপরের সবুজ বাটনে চাপ দিয়ে খাতা খুলুন।
                </p>
              </div>
              <button
                onClick={handleAddNew}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
              >
                + নতুন গ্রাহক হিসেবে যুক্ত করুন
              </button>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;
              const hasDue = customer.current_balance > 0;

              return (
                <div
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={`p-3 sm:p-3.5 rounded-2xl my-1 transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'hover:bg-slate-50 border-slate-200/80 bg-white'
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs ${
                        hasDue
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {customer.name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2 truncate">
                        <span>{customer.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                            নির্বাচিত
                          </span>
                        )}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {formatBengaliPhone(customer.phone)}
                        </span>
                        {customer.address && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[140px] text-[11px] text-slate-500">
                              {customer.address}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Amount & Select Button */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      বর্তমান বাকি
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black ${
                        hasDue ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {hasDue
                        ? formatBengaliCurrency(customer.current_balance)
                        : '০.০০ (পরিশোধিত)'}
                    </span>
                    <span className="block mt-1 text-[11px] font-bold text-emerald-700 group-hover:underline">
                      {isSelected ? '✓ সিলেক্টেড' : 'ট্যাপ করুন →'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center font-semibold flex-shrink-0">
          <span>গ্রাহক নির্বাচন করলে এই বিক্রির টাকা তার খাতায় যোগ হবে</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
          >
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
};
