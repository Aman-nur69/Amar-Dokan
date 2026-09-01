// ==============================================================================
// MudiDokan (মুদিদোকান) Customer Ledger Directory Table
// High-Contrast Red/Green Balances, 1-Tap Collection, and Direct WhatsApp Reminders
// ==============================================================================

import React from 'react';
import { Customer } from '../../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import { Search, UserPlus, HandCoins, Eye, MessageCircle, Phone } from 'lucide-react';
import { generateWhatsAppReminderUrl } from '../../lib/printService';
<<<<<<< HEAD
import { DEFAULT_STORE } from '../../db/offlineDb';
=======
import { useActiveStore } from '../../hooks/useActiveStore';
>>>>>>> c18622f (Bug Fix)

interface CustomerLedgerTableProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: 'ALL' | 'DUE_ONLY' | 'CLEARED';
  onFilterChange: (f: 'ALL' | 'DUE_ONLY' | 'CLEARED') => void;
  onCollectDue: (customer: Customer) => void;
  onViewStatement: (customer: Customer) => void;
  onAddNewCustomer: () => void;
}

export const CustomerLedgerTable: React.FC<CustomerLedgerTableProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  onCollectDue,
  onViewStatement,
  onAddNewCustomer,
}) => {
<<<<<<< HEAD
=======
  // Reminders must go out under THIS shop's name and mobile-money numbers.
  // They previously always used the bundled demo shop.
  const store = useActiveStore();

>>>>>>> c18622f (Bug Fix)
  const handleQuickWhatsApp = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateWhatsAppReminderUrl({
      customerName: customer.name,
      customerPhone: customer.phone,
<<<<<<< HEAD
      storeName: DEFAULT_STORE.name,
      storePhone: DEFAULT_STORE.phone,
      dueAmount: customer.current_balance,
      bkashNumber: DEFAULT_STORE.bkash_number,
      nagadNumber: DEFAULT_STORE.nagad_number,
=======
      storeName: store.name,
      storePhone: store.phone,
      dueAmount: customer.current_balance,
      bkashNumber: store.bkash_number,
      nagadNumber: store.nagad_number,
>>>>>>> c18622f (Bug Fix)
    });
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Search & Actions Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন (১১ ডিজিট)..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:border-emerald-500 outline-none shadow-sm"
          />
          <div className="absolute left-3.5 top-3.5 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
        </div>

        {/* Filters and Add New */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            <button
              onClick={() => onFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল খাতা
            </button>
            <button
              onClick={() => onFilterChange('DUE_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'DUE_ONLY'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              বাকি আছে
            </button>
            <button
              onClick={() => onFilterChange('CLEARED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'CLEARED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              পরিশোধিত
            </button>
          </div>

          <button
            onClick={onAddNewCustomer}
            className="h-12 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন খাতা</span>
          </button>
        </div>
      </div>

      {/* Customer Directory List */}
      <div className="divide-y divide-slate-100 overflow-x-auto">
        {customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-bold text-slate-600 mb-1">কোনো গ্রাহকের খাতা মেলেনি</p>
            <p className="text-xs">উপরে নতুন খাতা বাটনে চাপ দিয়ে নতুন গ্রাহক যুক্ত করুন।</p>
          </div>
        ) : (
          customers.map((customer) => {
            const hasDue = customer.current_balance > 0;
            const isAdvance = customer.current_balance < 0;

            return (
              <div
                key={customer.id}
                onClick={() => onViewStatement(customer)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Customer Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm ${
                      hasDue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {customer.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <span>{customer.name}</span>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {formatBengaliPhone(customer.phone)}
                      </span>
                      {customer.address && (
                        <span className="truncate max-w-[200px]">{customer.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Balance Indicator & 1-Tap Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right pr-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                      {hasDue ? 'মোট বাকি' : isAdvance ? 'অগ্রিম জমা' : 'পরিশোধিত'}
                    </span>
                    <span
                      className={`text-xl font-black ${
                        hasDue
                          ? 'text-rose-600'
                          : isAdvance
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatBengaliCurrency(Math.abs(customer.current_balance))}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {hasDue && (
                      <>
                        <button
                          onClick={() => onCollectDue(customer)}
                          className="h-11 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <HandCoins className="w-4 h-4" />
                          <span>বাকি আদায়</span>
                        </button>

                        <button
                          onClick={(e) => handleQuickWhatsApp(customer, e)}
                          className="h-11 w-11 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shadow-sm transition-all"
                          title="হোয়াটসঅ্যাপে তাগাদা পাঠান"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onViewStatement(customer)}
                      className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">খাতা</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Directory Footer with Bengali Counts */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between font-semibold">
        <span>মোট গ্রাহক: {toBanglaDigits(customers.length)} জন</span>
        <span>সততাই ব্যবসায় বরকত এনে দেয়</span>
      </div>
    </div>
  );
};
