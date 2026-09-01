// ==============================================================================
// MudiDokan (মুদিদোকান) Daily Day-Closing Statement Slip & Printable Modal
// High-fidelity thermal receipt closing summary and 1-tap WhatsApp export
// ==============================================================================

import React, { useState } from 'react';
import { DailyMetrics } from './DailyProfitWidget';
import { db, buildSyncItem } from '../../db/offlineDb';
import { useActiveStore } from '../../hooks/useActiveStore';
import { useAuthStore } from '../../hooks/useAuthStore';
import { toast } from '../../hooks/useToastStore';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { DayClosing } from '../../@types/database.types';
import { round2 } from '../../lib/units';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
} from '../../lib/banglaNumberFormatter';
import { X, Printer, Share2, FileCheck, CheckCircle2 } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface DayClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DailyMetrics;
  selectedDate: string;
  /** Cash carried in from the previous closing. */
  openingFloat?: number;
  /** Most recent physical count for this date, if the drawer was counted. */
  countedCash?: number;
  onClosed?: () => void;
}

export const DayClosingModal: React.FC<DayClosingModalProps> = ({
  isOpen,
  onClose,
  metrics,
  selectedDate,
  openingFloat = 0,
  countedCash,
  onClosed,
}) => {
  const store = useActiveStore();
  const { currentUser, activeStoreId } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useModalDismiss<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Persists the closing. Without this the whole reconciliation vanished when
   * the dialog closed, and tomorrow had no opening float to start from.
   */
  const handleSaveClosing = async () => {
    if (!activeStoreId) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const existing = await db.day_closings
        .where('store_id')
        .equals(activeStoreId)
        .and((c) => c.business_date === selectedDate)
        .first();

      const record: DayClosing = {
        id: existing?.id || crypto.randomUUID(),
        store_id: activeStoreId,
        business_date: selectedDate,
        opening_float: round2(openingFloat),
        total_sales: round2(metrics.totalSales),
        cash_collected: round2(metrics.totalCashCollected),
        due_collected: round2(metrics.totalDueCollected),
        new_due: round2(metrics.totalNewDue),
        total_expenses: round2(metrics.totalExpenses),
        supplier_paid: round2(metrics.totalChalanCashPaid + (metrics.totalSupplierDuePaid || 0)),
        net_profit: round2(metrics.netProfit),
        counted_cash: countedCash !== undefined ? round2(countedCash) : undefined,
        variance:
          countedCash !== undefined
            ? round2(countedCash - (openingFloat + metrics.totalCashCollected))
            : undefined,
        closed_by: currentUser?.id,
        created_at: now,
      };

      await db.transaction('rw', [db.day_closings, db.sync_queue], async () => {
        await db.day_closings.put(record);
        await db.sync_queue.add(
          buildSyncItem('day_closings', 'INSERT', record as unknown as Record<string, unknown>)
        );
      });

      toast.success('দিনের ক্লোজিং সংরক্ষিত হয়েছে');
      onClosed?.();
      onClose();
    } catch (err) {
      console.error('[DayClosing] Save error:', err);
      toast.error('ক্লোজিং সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `📊 *${store.name} — দৈনিক হিসাব ক্লোজিং রিপোর্ট*
📅 তারিখ: ${toBanglaDigits(new Date(selectedDate).toLocaleDateString('bn-BD'))}

🔹 *আজকের মোট বিক্রি:* ${formatBengaliCurrency(metrics.totalSales)} (মোট ${toBanglaDigits(metrics.saleCount)} টি ইনভয়েস)
💵 *নগদ বিক্রি:* ${formatBengaliCurrency(metrics.totalSales - metrics.totalNewDue)}
🔴 *নতুন বাকি প্রদান:* ${formatBengaliCurrency(metrics.totalNewDue)}
🟢 *কাস্টমার বাকি আদায়:* ${formatBengaliCurrency(metrics.totalDueCollected)}
🚚 *আজকের চালানে মাল ক্রয়:* ${formatBengaliCurrency(metrics.totalChalanPurchases)}
💸 *কোম্পানিকে নগদ পরিশোধ:* ${formatBengaliCurrency(metrics.totalChalanCashPaid)}${
      metrics.totalSupplierDuePaid ? `\n💸 *চালানের বকেয়া পরিশোধ:* ${formatBengaliCurrency(metrics.totalSupplierDuePaid)}` : ''
    }
🧾 *দোকানের অন্যান্য খরচ:* ${formatBengaliCurrency(metrics.totalExpenses)}

--------------------------------
💰 *ক্যাশবাক্সে বর্তমান নগদ টাকা:* ${formatBengaliCurrency(metrics.totalCashCollected)}
📈 *আজকের আনুমানিক নিট লাভ:* ${formatBengaliCurrency(metrics.netProfit)}
--------------------------------
মুদিদোকান সফটওয়্যার দ্বারা প্রস্তুতকৃত।`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">দিনের হিসাব ক্লোজিং রসিদ</h3>
              <p className="text-xs text-slate-300">
                {toBanglaDigits(new Date(selectedDate).toLocaleDateString('bn-BD'))}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Slip Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100 flex justify-center">
          <div className="printable-sheet bg-white w-full max-w-[340px] p-5 rounded-2xl shadow-md border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h4 className="font-black text-base tracking-wide font-sans">{store.name}</h4>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">{store.address}</p>
              <p className="text-[11px] text-slate-500 font-sans">প্রোপাইটর: {store.proprietor}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                ★ দৈনিক ক্লোজিং স্টেটমেন্ট ★
              </div>
            </div>

            {/* Time & Invoices */}
            <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-200 pb-2">
              <span>তারিখ: {toBanglaDigits(new Date(selectedDate).toLocaleDateString('bn-BD'))}</span>
              <span>বিক্রি সংখ্যা: {toBanglaDigits(metrics.saleCount)} টি</span>
            </div>

            {/* Inflow & Sales Breakdown */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>আজকের মোট বিক্রি:</span>
                <span>{formatBengaliCurrency(metrics.totalSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2">
                <span>• নগদ বিক্রি:</span>
                <span>{formatBengaliCurrency(metrics.totalSales - metrics.totalNewDue)}</span>
              </div>
              <div className="flex justify-between text-rose-600 pl-2">
                <span>• নতুন বাকি:</span>
                <span>+{formatBengaliCurrency(metrics.totalNewDue)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>আজকের বাকি আদায়:</span>
                <span>+{formatBengaliCurrency(metrics.totalDueCollected)}</span>
              </div>
            </div>

            {/* Outflow Breakdown */}
            <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5">
              <div className="flex justify-between text-amber-800">
                <span>দোকান খরচ:</span>
                <span>-{formatBengaliCurrency(metrics.totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>আজকের চালান ক্রয়:</span>
                <span>{formatBengaliCurrency(metrics.totalChalanPurchases)}</span>
              </div>
              <div className="flex justify-between text-rose-700 pl-2">
                <span>• চালান নগদ পরিশোধ:</span>
                <span>-{formatBengaliCurrency(metrics.totalChalanCashPaid)}</span>
              </div>
              {metrics.totalSupplierDuePaid !== undefined && metrics.totalSupplierDuePaid > 0 && (
                <div className="flex justify-between text-rose-700 pl-2 font-bold">
                  <span>• চালান বকেয়া পরিশোধ:</span>
                  <span>-{formatBengaliCurrency(metrics.totalSupplierDuePaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 pl-2">
                <span>• চালান অবশিষ্ট বাকি:</span>
                <span>{formatBengaliCurrency(metrics.totalChalanDue)}</span>
              </div>
            </div>

            {/* Bottom Net Totals */}
            <div className="border-t-2 border-slate-900 pt-3 space-y-2 font-sans">
              <div className="flex justify-between text-xs text-slate-600">
                <span>দিন শুরুর জের (ওপেনিং):</span>
                <span>{formatBengaliCurrency(openingFloat)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900">
                <span>ড্রয়ারে ক্যাশ জমা:</span>
                <span className="text-emerald-700">
                  {formatBengaliCurrency(metrics.totalCashCollected)}
                </span>
              </div>
              {countedCash !== undefined && (
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>গোনা নগদ / পার্থক্য:</span>
                  <span>
                    {formatBengaliCurrency(countedCash)} (
                    {formatBengaliCurrency(countedCash - (openingFloat + metrics.totalCashCollected))})
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>আনুমানিক নিট লাভ:</span>
                <span className="text-emerald-600">
                  {formatBengaliCurrency(metrics.netProfit)}
                </span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-sans">
              মুদিদোকান (MudiDokan) ডিজিটাল হিসাব ক্যাশ ড্রয়ার অডিট
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <BigButton
            variant="cash"
            onClick={handleShareWhatsApp}
            icon={Share2}
            className="flex-1"
          >
            হোয়াটসঅ্যাপে পাঠান
          </BigButton>
          <BigButton
            variant="secondary"
            onClick={handlePrint}
            icon={Printer}
            className="flex-1"
          >
            স্লিপ প্রিন্ট করুন
          </BigButton>
          <BigButton
            variant="primary"
            onClick={handleSaveClosing}
            icon={CheckCircle2}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'দিন ক্লোজ করুন'}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
