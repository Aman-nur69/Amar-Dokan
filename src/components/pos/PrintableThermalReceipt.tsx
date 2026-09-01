// ==============================================================================
// MudiDokan (মুদিদোকান) Printable Thermal Receipt Component
// Tailored for 58mm / 80mm ESC/POS Rolls with Pure CSS Print Media Formatting
// ==============================================================================

<<<<<<< HEAD
import React, { useState } from 'react';
=======
import React, { useEffect, useState } from 'react';
>>>>>>> c18622f (Bug Fix)
import { ThermalReceiptData } from '../../@types/pos.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
  formatBengaliDate,
  formatBengaliPhone,
} from '../../lib/banglaNumberFormatter';
import { triggerThermalPrint, generateWhatsAppReminderUrl, generateSmsReminderUrl } from '../../lib/printService';
import { Printer, Share2, MessageSquare, X, CheckCircle } from 'lucide-react';
import { BigButton } from '../common/BigButton';
<<<<<<< HEAD
=======
import { toast } from '../../hooks/useToastStore';
import { useModalDismiss } from '../../hooks/useModalDismiss';
>>>>>>> c18622f (Bug Fix)

interface PrintableThermalReceiptProps {
  receipt: ThermalReceiptData | null;
  onClose: () => void;
}

export const PrintableThermalReceipt: React.FC<PrintableThermalReceiptProps> = ({
  receipt,
  onClose,
}) => {
<<<<<<< HEAD
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
=======
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => {
    try {
      return (localStorage.getItem('amar_dokan_paper_width') as '58mm' | '80mm') || '80mm';
    } catch {
      return '80mm';
    }
  });
  const dialogRef = useModalDismiss<HTMLDivElement>(Boolean(receipt), onClose);

  // The print stylesheet reads this variable, so the 58/80 toggle now actually
  // changes the printed roll width instead of only the on-screen preview.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--thermal-print-width',
      paperWidth === '58mm' ? '54mm' : '76mm'
    );
    try {
      localStorage.setItem('amar_dokan_paper_width', paperWidth);
    } catch {
      // ignore
    }
  }, [paperWidth]);
>>>>>>> c18622f (Bug Fix)

  if (!receipt) return null;

  const handlePrint = () => {
    triggerThermalPrint();
  };

  const handleWhatsApp = () => {
    if (!receipt.customerPhone) {
<<<<<<< HEAD
      alert('গ্রাহকের মোবাইল নম্বর যুক্ত নেই!');
=======
      toast.warning('গ্রাহকের মোবাইল নম্বর যুক্ত নেই!');
>>>>>>> c18622f (Bug Fix)
      return;
    }
    const url = generateWhatsAppReminderUrl({
      customerName: receipt.customerName || 'সম্মানিত গ্রাহক',
      customerPhone: receipt.customerPhone,
      storeName: receipt.storeName,
      storePhone: receipt.storePhone,
      dueAmount: receipt.customerTotalDue || receipt.dueAmount,
      bkashNumber: receipt.bkashNumber,
<<<<<<< HEAD
=======
      nagadNumber: receipt.nagadNumber,
>>>>>>> c18622f (Bug Fix)
    });
    window.open(url, '_blank');
  };

  const handleSms = () => {
    if (!receipt.customerPhone) {
<<<<<<< HEAD
      alert('গ্রাহকের মোবাইল নম্বর যুক্ত নেই!');
=======
      toast.warning('গ্রাহকের মোবাইল নম্বর যুক্ত নেই!');
>>>>>>> c18622f (Bug Fix)
      return;
    }
    const url = generateSmsReminderUrl({
      customerName: receipt.customerName || 'সম্মানিত গ্রাহক',
      customerPhone: receipt.customerPhone,
      storeName: receipt.storeName,
      storePhone: receipt.storePhone,
      dueAmount: receipt.customerTotalDue || receipt.dueAmount,
      bkashNumber: receipt.bkashNumber,
<<<<<<< HEAD
=======
      nagadNumber: receipt.nagadNumber,
>>>>>>> c18622f (Bug Fix)
    });
    window.open(url, '_blank');
  };

  const is58mm = paperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
<<<<<<< HEAD
      <div className="bg-slate-900 rounded-3xl p-5 w-full max-w-lg shadow-2xl border border-slate-700 my-auto text-white flex flex-col">
=======
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="বিক্রির রসিদ"
        tabIndex={-1}
        className="bg-slate-900 rounded-3xl p-5 w-full max-w-lg shadow-2xl border border-slate-700 my-auto text-white flex flex-col"
      >
>>>>>>> c18622f (Bug Fix)
        {/* Top Header & Paper Size Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-black text-lg text-emerald-400">বিক্রি সফল হয়েছে!</h3>
              <p className="text-xs text-slate-400">রসিদ প্রিন্ট অথবা মেসেজ পাঠান</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl flex gap-1 text-xs">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  is58mm ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ৫৮ মিমি
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  !is58mm ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ৮০ মিমি
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==============================================================================
            Printable Thermal Paper Simulation Preview
            ============================================================================== */}
        <div className="flex justify-center p-3 bg-slate-950 rounded-2xl overflow-x-auto mb-4 border border-slate-800">
          <div
            id="thermal-receipt"
            className={`
              bg-white text-black p-4 font-mono shadow-md text-xs leading-relaxed select-text
              ${is58mm ? 'w-[230px] text-[11px]' : 'w-[310px] text-[12px]'}
            `}
          >
            {/* Shop Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h1 className="text-base font-black uppercase tracking-wider">{receipt.storeName}</h1>
              <p className="text-[11px] font-semibold">{receipt.storeProprietor}</p>
              <p className="text-[10px]">{receipt.storeAddress}</p>
              <p className="text-[11px] font-bold">মোবাইল: {toBanglaDigits(receipt.storePhone)}</p>
              {receipt.bkashNumber && (
                <p className="text-[10px]">বিকাশ: {toBanglaDigits(receipt.bkashNumber)}</p>
              )}
            </div>

            {/* Invoice & Date Info */}
            <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>ইনভয়েস:</span>
                <span className="font-bold">{receipt.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>তারিখ:</span>
                <span>{formatBengaliDate(receipt.date)}</span>
              </div>
              {receipt.customerName && (
                <div className="flex justify-between font-bold">
                  <span>গ্রাহক:</span>
                  <span>{receipt.customerName}</span>
                </div>
              )}
              {receipt.customerPhone && (
                <div className="flex justify-between">
                  <span>মোবাইল:</span>
                  <span>{formatBengaliPhone(receipt.customerPhone)}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-black">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black text-[10px]">
                    <th className="py-0.5">বিবরণ</th>
                    <th className="text-center py-0.5">পরিমাণ</th>
                    <th className="text-right py-0.5">দর</th>
                    <th className="text-right py-0.5">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-300">
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1 pr-1 font-semibold max-w-[110px] truncate">
                        {item.name}
                      </td>
                      <td className="text-center py-1">
                        {toBanglaDigits(item.quantity)} {item.unit}
                      </td>
                      <td className="text-right py-1">
                        {toBanglaDigits(item.unitPrice)}
                      </td>
                      <td className="text-right py-1 font-bold">
                        {toBanglaDigits(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Calculations */}
            <div className="py-2 border-b border-dashed border-black text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>উপ-টোটাল:</span>
                <span>{formatBengaliCurrency(receipt.subtotal, false)}</span>
              </div>

              {receipt.discount > 0 && (
                <div className="flex justify-between text-rose-800">
                  <span>বিশেষ ছাড় (-):</span>
                  <span>-{formatBengaliCurrency(receipt.discount, false)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>সর্বমোট বিল:</span>
                <span>{formatBengaliCurrency(receipt.totalAmount, true)}</span>
              </div>

              <div className="flex justify-between text-emerald-900 font-bold">
                <span>পরিশোধ/জমা:</span>
                <span>{formatBengaliCurrency(receipt.paidAmount, true)}</span>
              </div>

              {receipt.dueAmount > 0 && (
                <div className="flex justify-between text-rose-900 font-black">
                  <span>আজকের বাকি:</span>
                  <span>{formatBengaliCurrency(receipt.dueAmount, true)}</span>
                </div>
              )}

              {/* Customer Cumulative Due */}
              {receipt.customerTotalDue !== undefined && receipt.customerTotalDue > 0 && (
                <div className="pt-1 border-t border-dashed border-black text-[11px] font-bold text-rose-900 flex justify-between">
                  <span>বর্তমান মোট বকেয়া:</span>
                  <span>{formatBengaliCurrency(receipt.customerTotalDue, true)}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-2 text-[10px] space-y-0.5">
              <p className="font-bold">*** ধন্যবাদ, আবার আসবেন ***</p>
              <p>পণ্য পরিবর্তনযোগ্য (২৪ ঘণ্টার মধ্যে রসিদসহ)</p>
              <p className="text-[9px] text-slate-500">কারিগরি সহযোগিতায়: আমার দোকান (Amar Dokan SaaS)</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Native Thermal Print & Instant Message Reminders */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <BigButton
            variant="cash"
            onClick={handlePrint}
            icon={Printer}
            className="col-span-2 sm:col-span-1"
          >
            প্রিন্ট দিন
          </BigButton>

          <button
            onClick={handleWhatsApp}
            className="h-14 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপ রসিদ</span>
          </button>

          <button
            onClick={handleSms}
            className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>এসএমএস পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
