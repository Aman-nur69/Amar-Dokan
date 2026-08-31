// ==============================================================================
// MudiDokan (মুদিদোকান) Store Expense Logger Modal
// Daily Overheads: Rent, Electric Bill, Staff Meals, Labor, and Transport
// ==============================================================================

import React, { useState } from 'react';
import { db } from '../../db/offlineDb';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Expense } from '../../@types/database.types';
import { toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { X, Receipt, Check } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface ExpenseLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

const EXPENSE_CATEGORIES = [
  'দোকানের চা-নাস্তা',
  'পরিবহন খরচ (ভ্যান/রিকশা)',
  'বিদ্যুৎ বিল',
  'দোকান ভাড়া',
  'স্টাফ বেতন/মজুরি',
  'প্যাকেট ও পলিথিন',
  'মেরামত ও রক্ষণাবেক্ষণ',
  'অন্যান্য খরচ',
];

export const ExpenseLoggerModal: React.FC<ExpenseLoggerModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
}) => {
  const { activeStoreId } = useAuthStore();
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('দয়া করে খরচের সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const targetStoreId = activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const expenseItem: Expense = {
        id: crypto.randomUUID(),
        store_id: targetStoreId,
        category,
        amount,
        note: note.trim() || undefined,
        expense_date: expenseDate,
        created_at: now,
      };

      await db.expenses.add(expenseItem);

      // Queue sync
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: 'expenses',
        action: 'INSERT',
        payload: expenseItem as unknown as Record<string, unknown>,
        created_at: now,
        retry_count: 0,
        status: 'PENDING',
      });

      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error('[ExpenseLogger] Error saving expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">দৈনিক খরচ এন্ট্রি</h3>
              <p className="text-xs text-slate-300">দোকানের দৈনন্দিন ব্যয় লিখে রাখুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              খরচের পরিমাণ (টাকা) *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                autoFocus
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="খরচের টাকা..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 text-2xl font-black text-slate-900 focus:border-amber-500 outline-none"
              />
              <div className="absolute left-4 top-3.5 text-xl font-black text-slate-400">৳</div>
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              খরচের খাত নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                    category === cat
                      ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Date & Notes */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">তারিখ</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">বিবরণ</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: কারওয়ান বাজার ভ্যান..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <BigButton
              variant="warning"
              type="submit"
              fullWidth
              disabled={isSubmitting || amount <= 0}
              icon={Check}
            >
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'খরচ সংরক্ষণ করুন'}
            </BigButton>
          </div>
        </form>
      </div>
    </div>
  );
};
