// ==============================================================================
// MudiDokan (মুদিদোকান) Product Search & Hardware Barcode Scanner Listener
// Bilingual Search (Bangla & English Phonetic) + Hardware HID Barcode Scanner
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Search, Barcode, X } from 'lucide-react';
import { Product } from '../../@types/database.types';

interface ProductSearchBarProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  products,
  onSelectProduct,
  searchQuery,
  onSearchChange,
}) => {
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const lastKeyTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hardware Barcode Scanner Listener (detects continuous high-speed keystrokes <= 40ms)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes if focused inside an active form input (unless it's the barcode scan)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (target !== inputRef.current) return;
      }

      const currentTime = Date.now();
      const interval = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault();
          // Find matching barcode
          const matchedProduct = products.find(
            (p) => p.barcode && p.barcode.trim() === barcodeBuffer.trim()
          );

          if (matchedProduct) {
            onSelectProduct(matchedProduct);
            onSearchChange('');
          } else {
            console.warn('[Barcode Scanner] Product not found for code:', barcodeBuffer);
          }
          setBarcodeBuffer('');
        }
        return;
      }

      // Normal printable characters
      if (e.key.length === 1) {
        if (interval < 50) {
          // Fast keystroke -> typical of hardware scanner
          setBarcodeBuffer((prev) => prev + e.key);
        } else {
          // Slower manual keystroke -> reset buffer
          setBarcodeBuffer(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeBuffer, products, onSelectProduct, onSearchChange]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="পণ্য খুঁজুন (নাম, যেমন: চিনি, তেল, ডাল বা বারকোড)..."
          className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-base font-medium placeholder:text-slate-400 transition-all outline-none shadow-sm"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="মুছে ফেলুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200"
            title="হার্ডওয়্যার বারকোড স্ক্যানার সক্রিয়"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">স্ক্যানার</span>
          </div>
        </div>
      </div>
    </div>
  );
};
