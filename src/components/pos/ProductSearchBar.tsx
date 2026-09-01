// ==============================================================================
// MudiDokan (মুদিদোকান) Product Search & Hardware Barcode Scanner Listener
// Bilingual Search (Bangla & English Phonetic) + Hardware HID Barcode Scanner
// ==============================================================================

<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { Search, Barcode, X } from 'lucide-react';
import { Product } from '../../@types/database.types';
=======
import React, { useEffect, useRef } from 'react';
import { Search, Barcode, X } from 'lucide-react';
import { Product } from '../../@types/database.types';
import { isAnyModalOpen } from '../../hooks/useModalDismiss';

/** Scanners burst-type; humans do not. */
const SCAN_GAP_MS = 50;
const MIN_BARCODE_LENGTH = 8;
>>>>>>> c18622f (Bug Fix)

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
<<<<<<< HEAD
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
=======
  const inputRef = useRef<HTMLInputElement>(null);

  // The buffer lives in a ref, not state: as state it re-registered the window
  // listener on every keystroke, and stray typing anywhere on the page was
  // being collected into a phantom barcode.
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never listen while a dialog is open - Enter belongs to that form.
      if (isAnyModalOpen()) return;

      const target = e.target as HTMLElement | null;
      const typingElsewhere =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) &&
        target !== inputRef.current;
      if (typingElsewhere) return;

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        bufferRef.current = '';

        // Hardware scanners emit at least 8 digits and finish with Enter.
        if (code.length < MIN_BARCODE_LENGTH || !/^[0-9]+$/.test(code)) return;

        const matched = products.find((p) => (p.barcode || '').trim() === code);
        if (matched) {
          // Only swallow Enter once we know this was really a scan.
          e.preventDefault();
          onSelectProduct(matched);
          onSearchChange('');
        } else {
          console.warn('[Barcode Scanner] Product not found for code:', code);
          onSearchChange(code);
>>>>>>> c18622f (Bug Fix)
        }
        return;
      }

<<<<<<< HEAD
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
=======
      if (e.key.length !== 1) return;

      // A human types slower than SCAN_GAP_MS between characters.
      bufferRef.current = gap < SCAN_GAP_MS ? bufferRef.current + e.key : e.key;
>>>>>>> c18622f (Bug Fix)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
<<<<<<< HEAD
  }, [barcodeBuffer, products, onSelectProduct, onSearchChange]);
=======
  }, [products, onSelectProduct, onSearchChange]);
>>>>>>> c18622f (Bug Fix)

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
<<<<<<< HEAD
=======
              aria-label="খোঁজা মুছুন"
>>>>>>> c18622f (Bug Fix)
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
