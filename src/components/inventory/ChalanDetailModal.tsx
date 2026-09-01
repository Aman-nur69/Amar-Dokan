// ==============================================================================
// MudiDokan (মুদিদোকান) Supplier Chalan Detail & Printable Breakdown Modal
// ==============================================================================

import React from 'react';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { SupplierChalan, ChalanItem } from '../../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import { X, Printer, Phone, Truck, CheckCircle2, AlertCircle, HandCoins } from 'lucide-react';
import { BigButton } from '../common/BigButton';

interface ChalanDetailModalProps {
  chalan: SupplierChalan | null;
  items: ChalanItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenPayModal?: (chalan: SupplierChalan) => void;
}

export const ChalanDetailModal: React.FC<ChalanDetailModalProps> = ({
  chalan,
  items,
  isOpen,
  onClose,
  onOpenPayModal,
}) => {
  const dialogRef = useModalDismiss<HTMLDivElement>(isOpen, onClose);

  if (!isOpen || !chalan) return null;

  const chalanItems = items.filter((it) => it.chalan_id === chalan.id);
  const isFullyPaid = chalan.due_amount <= 0;

  const handlePrint = () => {
    window.print();
  };

  const handlePayDue = () => {
    onClose();
    if (onOpenPayModal) {
      onOpenPayModal(chalan);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="চালানের বিস্তারিত"
        tabIndex={-1}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">{chalan.supplier_name}</h3>
              <p className="text-xs text-slate-300">
                চালান নং: <span className="font-mono font-bold text-emerald-300">{chalan.chalan_no}</span> •{' '}
                {formatBengaliDate(chalan.chalan_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Supplier Status & Phone */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">
                চালানের পেমেন্ট স্ট্যাটাস
              </span>
              <div className="flex items-center gap-2">
                {isFullyPaid ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    পরিশোধ সম্পন্ন (কোনো বকেয়া নেই)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    কোম্পানির বাকি: {formatBengaliCurrency(chalan.due_amount)}
                  </span>
                )}
              </div>
            </div>

            {chalan.supplier_phone && (
              <a
                href={`tel:${chalan.supplier_phone}`}
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>ডিলারকে কল করুন ({formatBengaliPhone(chalan.supplier_phone)})</span>
              </a>
            )}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 flex justify-between">
              <span>চালানের মালের তালিকা</span>
              <span>{toBanglaDigits(chalanItems.length)} টি পণ্য</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">পণ্য</th>
                    <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">ক্রয়মূল্য / দর</th>
                    <th className="py-2.5 px-4 text-right">মোট টাকা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chalanItems.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{it.product_name_bn}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {toBanglaDigits(it.quantity)} {it.unit}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {formatBengaliCurrency(it.unit_cost_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatBengaliCurrency(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {chalan.notes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <strong className="font-bold">মন্তব্য:</strong> {chalan.notes}
            </div>
          )}

          {/* Summary Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>মোট চালান মূল্য:</span>
              <span className="font-bold text-slate-900">
                {formatBengaliCurrency(chalan.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>নগদ পরিশোধ (জমা):</span>
              <span className="font-bold">{formatBengaliCurrency(chalan.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-rose-600 pt-2 border-t border-slate-200 text-base font-black">
              <span>কোম্পানির অবশিষ্ট বাকি:</span>
              <span>{formatBengaliCurrency(chalan.due_amount)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Responsive for Mobile/Tablet) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          {!isFullyPaid && onOpenPayModal && (
            <BigButton
              variant="cash"
              onClick={handlePayDue}
              icon={HandCoins}
              className="flex-1"
            >
              বাকি পরিশোধ করুন
            </BigButton>
          )}
          <BigButton
            variant="secondary"
            onClick={handlePrint}
            icon={Printer}
            className="flex-1"
          >
            চালান প্রিন্ট
          </BigButton>
          <button
            onClick={onClose}
            className="px-5 h-14 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
};
