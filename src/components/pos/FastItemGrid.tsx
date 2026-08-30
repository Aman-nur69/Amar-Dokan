// ==============================================================================
// MudiDokan (মুদিদোকান) Fast Item POS Grid
// 1-Tap Additions for High-Frequency Unbarcoded Bulk Goods with Visual Affordance
// ==============================================================================

import React, { useState } from 'react';
import { Product, ProductUnit } from '../../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';
import { Plus, Check, Scale } from 'lucide-react';

interface FastItemGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, unit?: ProductUnit) => void;
}

// Visual icons map for typical Bangladeshi grocery items
const PRODUCT_EMOJIS: Record<string, string> = {
  'খোলা সয়াবিন তেল': '🛢️',
  'দেশি সাদা চিনি': '🧂',
  'মসুর ডাল (চিকন)': '🥣',
  'ফার্মের লাল ডিম (১ হালি)': '🥚',
  'নতুন গোল আলু': '🥔',
  'দেশি পেঁয়াজ': '🧅',
  'মিনিকেট চাল (খোলা)': '🌾',
  'দেশি রসুন': '🧄',
  'রূপচাঁদা সয়াবিন তেল (২ লিটার)': '🧴',
  'ম্যাগি ২-মিনিট নুডুলস (৮ প্যাক)': '🍜',
  'লাইফবয় টোটাল সাবান (১০০ গ্রাম)': '🧼',
  'তীর আটা (২ কেজি প্যাকেট)': '🍞',
};

export const FastItemGrid: React.FC<FastItemGridProps> = ({ products, onAddToCart }) => {
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<Product | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product, 1, product.unit);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  const handleCustomQuantityAdd = (product: Product, quantity: number, unit: ProductUnit) => {
    onAddToCart(product, quantity, unit);
    setSelectedBulkProduct(null);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          জনপ্রিয় খোলা ও দ্রুত বিক্রির পণ্য (১-ট্যাপ যোগ)
        </h2>
        <span className="text-xs text-slate-500 font-medium">
          মোট {toBanglaDigits(products.length)}টি পণ্য
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((product) => {
          const emoji = PRODUCT_EMOJIS[product.name_bn] || '📦';
          const isOutOfStock = product.stock_quantity <= 0;
          const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_alert;
          const isRecentlyAdded = justAddedId === product.id;

          // Unit display label
          const unitLabels: Record<string, string> = {
            kg: 'কেজি',
            gm: 'গ্রাম',
            litre: 'লিটার',
            packet: 'প্যাকেট',
            piece: 'পিস',
            hali: 'হালি',
          };
          const unitBn = unitLabels[product.unit] || product.unit;

          return (
            <div
              key={product.id}
              className={`
                relative flex flex-col justify-between p-3.5 rounded-2xl border-2 transition-all duration-150
                ${
                  isOutOfStock
                    ? 'bg-rose-50/50 border-rose-200 opacity-60'
                    : isRecentlyAdded
                    ? 'bg-emerald-100 border-emerald-500 scale-95'
                    : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-95'
                }
              `}
            >
              {/* Top Stock Status Badge */}
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-3xl select-none" role="img" aria-label={product.name_bn}>
                  {emoji}
                </span>

                <div className="flex flex-col items-end">
                  {isOutOfStock ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                      স্টক শেষ
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold animate-pulse">
                      কম ({toBanglaDigits(product.stock_quantity)} {unitBn})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      মজুদ: {toBanglaDigits(product.stock_quantity)} {unitBn}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Title & Price */}
              <div className="mb-3">
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                  {product.name_bn}
                </h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-emerald-700 font-extrabold text-base">
                    {formatBengaliCurrency(product.selling_price)}
                  </span>
                  <span className="text-xs text-slate-500">/{unitBn}</span>
                </div>
              </div>

              {/* Action Buttons: 1-Tap Add & Weight Adjustment */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
                {product.unit === 'kg' ? (
                  <>
                    <button
                      disabled={isOutOfStock}
                      onClick={() => setSelectedBulkProduct(product)}
                      className="col-span-1 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold transition-colors"
                      title="নির্দিষ্ট ওজন নির্বাচন করুন"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleQuickAdd(product)}
                      className="col-span-3 h-11 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all"
                    >
                      {isRecentlyAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>যোগ হলো</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>১ কেজি</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    disabled={isOutOfStock}
                    onClick={() => handleQuickAdd(product)}
                    className="col-span-4 h-11 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    {isRecentlyAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>যোগ হলো</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>+১ যোগ করুন</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Weight Selector Modal for Loose/Bulk Goods (e.g. চিনি, ডাল, তেল) */}
      {selectedBulkProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedBulkProduct.name_bn}</h3>
                <p className="text-xs text-slate-500">
                  মূল্য: {formatBengaliCurrency(selectedBulkProduct.selling_price)} / কেজি
                </p>
              </div>
              <button
                onClick={() => setSelectedBulkProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              দ্রুত ওজন বেছে নিন (গ্রাম / কেজি):
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                onClick={() => handleCustomQuantityAdd(selectedBulkProduct, 250, 'gm')}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 border-2 border-slate-200 font-bold text-slate-800 flex flex-col items-center justify-center transition-all"
              >
                <span className="text-base">২৫০ গ্রাম</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {formatBengaliCurrency(selectedBulkProduct.selling_price * 0.25)}
                </span>
              </button>

              <button
                onClick={() => handleCustomQuantityAdd(selectedBulkProduct, 500, 'gm')}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 border-2 border-slate-200 font-bold text-slate-800 flex flex-col items-center justify-center transition-all"
              >
                <span className="text-base">৫০০ গ্রাম (আধ কেজি)</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {formatBengaliCurrency(selectedBulkProduct.selling_price * 0.5)}
                </span>
              </button>

              <button
                onClick={() => handleCustomQuantityAdd(selectedBulkProduct, 1, 'kg')}
                className="h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-500 font-bold text-emerald-900 flex flex-col items-center justify-center transition-all shadow-sm"
              >
                <span className="text-base">১ কেজি</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {formatBengaliCurrency(selectedBulkProduct.selling_price)}
                </span>
              </button>

              <button
                onClick={() => handleCustomQuantityAdd(selectedBulkProduct, 2, 'kg')}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 border-2 border-slate-200 font-bold text-slate-800 flex flex-col items-center justify-center transition-all"
              >
                <span className="text-base">২ কেজি</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {formatBengaliCurrency(selectedBulkProduct.selling_price * 2)}
                </span>
              </button>

              <button
                onClick={() => handleCustomQuantityAdd(selectedBulkProduct, 5, 'kg')}
                className="col-span-2 h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 border-2 border-slate-200 font-bold text-slate-800 flex flex-col items-center justify-center transition-all"
              >
                <span className="text-base">৫ কেজি (পাইকারি ব্যাগ)</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {formatBengaliCurrency(selectedBulkProduct.selling_price * 5)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
