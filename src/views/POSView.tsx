// ==============================================================================
// MudiDokan (মুদিদোকান) POS Master View
// Simple, Lightning-Fast Cash Selling & Seamless Existing/New Baki Customer Selection
// ==============================================================================

import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useBakiKhata } from '../hooks/useBakiKhata';
import { useCartStore } from '../hooks/useCartStore';
import { useSalesEngine } from '../hooks/useSalesEngine';
import { ProductSearchBar } from '../components/pos/ProductSearchBar';
import { FastItemGrid } from '../components/pos/FastItemGrid';
import { CartDrawer } from '../components/pos/CartDrawer';
import { PaymentActionSheet } from '../components/pos/PaymentActionSheet';
import { PrintableThermalReceipt } from '../components/pos/PrintableThermalReceipt';
import { SelectBakiCustomerModal } from '../components/pos/SelectBakiCustomerModal';
import { NewCustomerModal } from '../components/baki/NewCustomerModal';
import { Product, Customer } from '../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits } from '../lib/banglaNumberFormatter';
<<<<<<< HEAD
import { ShoppingBag, ArrowRight, Check, Zap, Layers, Boxes } from 'lucide-react';

export const POSView: React.FC = () => {
  const { allProducts, searchQuery, setSearchQuery } = useInventory();
  const { allCustomers, addCustomer } = useBakiKhata();
=======
import { matchesProduct } from '../lib/phoneticSearch';
import { useAuthStore } from '../hooks/useAuthStore';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { ShoppingBag, Zap, Boxes, AlertTriangle } from 'lucide-react';

export const POSView: React.FC = () => {
  const { allProducts, searchQuery, setSearchQuery, refreshInventory } = useInventory();
  const { allCustomers, addCustomer, refreshData: refreshKhata } = useBakiKhata();
  const { isManagerOrAbove } = useAuthStore();
>>>>>>> c18622f (Bug Fix)
  const {
    items,
    addItem,
    selectedCustomer,
    setSelectedCustomer,
    isCartDrawerOpen,
    setCartDrawerOpen,
    isPaymentSheetOpen,
    setPaymentSheetOpen,
    getTotalAmount,
    getItemCount,
  } = useCartStore();

<<<<<<< HEAD
  const { completeCheckout, lastReceipt, setLastReceipt } = useSalesEngine();
=======
  const { completeCheckout, lastReceipt, setLastReceipt, isProcessing, blockedBy, clearBlock } =
    useSalesEngine();
  const overrideDialogRef = useModalDismiss<HTMLDivElement>(Boolean(blockedBy), clearBlock);
>>>>>>> c18622f (Bug Fix)

  // Customer Selection & Creation Modal States
  const [isSelectCustomerModalOpen, setIsSelectCustomerModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Mobile View Mode: 'ITEMS' (Product Picker) or 'CART' (Bill & Checkout)
  const [mobileTab, setMobileTab] = useState<'ITEMS' | 'CART'>('ITEMS');

  // Fast unbarcoded items for POS quick grid
  const quickItems = allProducts.filter((p) => p.is_quick_item);

  // Filtered search list if search query entered
<<<<<<< HEAD
  const searchResults = searchQuery
    ? allProducts.filter(
        (p) =>
          p.name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.name_en && p.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.barcode && p.barcode.includes(searchQuery))
      )
=======
  // Matches Bengali, English, barcode AND English phonetics ("chini", "tel"),
  // which the product promised but never implemented.
  const searchResults = searchQuery
    ? allProducts.filter((p) => matchesProduct(p, searchQuery))
>>>>>>> c18622f (Bug Fix)
    : [];

  const handleProductSelect = (product: Product) => {
    addItem(product, 1, product.unit);
  };

<<<<<<< HEAD
  const handleCashCheckout = async () => {
    if (items.length === 0) return;
    await completeCheckout('CASH');
=======
  // Stock badges and khata balances are separate hook instances, so they went
  // stale the moment a sale committed. Refresh both after every checkout.
  const afterCheckout = async () => {
    await Promise.all([refreshInventory(), refreshKhata()]);
  };

  const handleCashCheckout = async () => {
    if (items.length === 0) return;
    const receipt = await completeCheckout('CASH');
    if (receipt) await afterCheckout();
>>>>>>> c18622f (Bug Fix)
  };

  const handleBakiCheckout = async () => {
    if (items.length === 0) return;
    if (!selectedCustomer) {
      // First show existing customers with search + option to add new
      setIsSelectCustomerModalOpen(true);
      return;
    }
<<<<<<< HEAD
    await completeCheckout('BAKI');
=======
    const receipt = await completeCheckout('BAKI');
    if (receipt) await afterCheckout();
>>>>>>> c18622f (Bug Fix)
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSelectCustomerModalOpen(false);
  };

  const handleNewCustomerCreated = (newCust: Customer) => {
    setSelectedCustomer(newCust);
    setIsNewCustomerModalOpen(false);
  };

  const handleSplitConfirm = async (method: 'CASH' | 'BAKI' | 'SPLIT') => {
<<<<<<< HEAD
    await completeCheckout(method);
=======
    const receipt = await completeCheckout(method);
    if (receipt) await afterCheckout();
  };

  // Credit limit is a real gate now; an owner or manager may still override it.
  const handleOverrideCreditLimit = async () => {
    clearBlock();
    const receipt = await completeCheckout(undefined, { allowOverLimit: true });
    if (receipt) await afterCheckout();
>>>>>>> c18622f (Bug Fix)
  };

  const totalAmount = getTotalAmount();
  const itemCount = getItemCount();

  return (
    <div className="relative pb-24 lg:pb-8">
      {/* Mobile Tab Switcher: Quick Items vs Cart & Bill */}
      <div className="lg:hidden mb-4 flex bg-slate-200/80 p-1.5 rounded-2xl shadow-inner">
        <button
          onClick={() => setMobileTab('ITEMS')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none ${
            mobileTab === 'ITEMS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>মালামাল নির্বাচন</span>
        </button>

        <button
          onClick={() => setMobileTab('CART')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all select-none ${
            mobileTab === 'CART'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            ঝুড়ি ও বিল ({toBanglaDigits(itemCount)})
            {totalAmount > 0 && ` • ${formatBengaliCurrency(totalAmount)}`}
          </span>
        </button>
      </div>

      {/* 2-Column POS Layout on Desktop/Tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search Bar & Fast Item Grid */}
        <div
          className={`lg:col-span-7 xl:col-span-8 space-y-4 ${
            mobileTab === 'CART' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Barcode & Bilingual Search */}
          <ProductSearchBar
            products={allProducts}
            onSelectProduct={handleProductSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* If search query is active, show search results */}
          {searchQuery ? (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-800">
                  খোঁজার ফলাফল ({toBanglaDigits(searchResults.length)} টি)
                </h3>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  ফলাফল মুছুন
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  "{searchQuery}" নামে কোনো পণ্য পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer flex justify-between items-center transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{product.name_bn}</h4>
                        <p className="text-xs text-slate-500">
                          মজুদ: {toBanglaDigits(product.stock_quantity)} {product.unit}
                        </p>
                      </div>
                      <span className="font-black text-sm text-emerald-700">
                        {formatBengaliCurrency(product.selling_price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fast Items Grid for high-frequency unbarcoded commodities */
            <FastItemGrid products={quickItems} onAddToCart={addItem} />
          )}
        </div>

        {/* Right Column: Cart Drawer / Billing Station */}
        <div
          className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[130px] lg:h-[calc(100vh-150px)] ${
            mobileTab === 'ITEMS' ? 'hidden lg:block' : 'block'
          }`}
        >
          <CartDrawer
            customers={allCustomers}
            onCashCheckout={handleCashCheckout}
            onBakiCheckout={handleBakiCheckout}
            onOpenSplitModal={() => setPaymentSheetOpen(true)}
            onOpenCustomerModal={() => setIsSelectCustomerModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Sticky Quick Action Bar (Visible when in ITEMS tab and cart has items) */}
      {itemCount > 0 && mobileTab === 'ITEMS' && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 z-30 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto flex gap-2">
            {/* Direct 1-Tap Cash Sale Button on Mobile */}
            <button
              onClick={handleCashCheckout}
<<<<<<< HEAD
              className="flex-1 h-14 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm flex items-center justify-between shadow-xl border border-emerald-500 animate-in slide-in-from-bottom-2"
=======
              disabled={isProcessing}
              className="flex-1 h-14 px-4 rounded-2xl disabled:opacity-60 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm flex items-center justify-between shadow-xl border border-emerald-500 animate-in slide-in-from-bottom-2"
>>>>>>> c18622f (Bug Fix)
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-white" />
                <span className="text-left">
                  <span className="block text-xs text-emerald-200 uppercase font-bold">নগদ বিক্রি</span>
                  <span>{formatBengaliCurrency(totalAmount)}</span>
                </span>
              </div>
              <span className="text-xs bg-emerald-700 px-2 py-1 rounded-lg">১-ট্যাপ ক্যাশ ✓</span>
            </button>

            {/* View Full Cart Button */}
            <button
              onClick={() => setMobileTab('CART')}
              className="h-14 px-4 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xl border border-slate-700 flex-shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>কার্ট ({toBanglaDigits(itemCount)})</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Dedicated Existing Baki Customer Selector Modal (Search existing + Add new button) */}
      <SelectBakiCustomerModal
        isOpen={isSelectCustomerModalOpen}
        onClose={() => setIsSelectCustomerModalOpen(false)}
        customers={allCustomers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={handleCustomerSelected}
        onOpenNewCustomerModal={() => {
          setIsSelectCustomerModalOpen(false);
          setIsNewCustomerModalOpen(true);
        }}
      />

      {/* 2. New Customer Creation Modal (Opens when customer not found in existing list) */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={addCustomer}
        onCustomerCreated={handleNewCustomerCreated}
      />

      {/* 3. Split Payment Action Sheet */}
      <PaymentActionSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        customers={allCustomers}
        onConfirm={handleSplitConfirm}
        onAddNewCustomer={() => {
          setPaymentSheetOpen(false);
          setIsNewCustomerModalOpen(true);
        }}
      />

      {/* 4. Thermal Receipt Print / Share Modal */}
      <PrintableThermalReceipt
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />
<<<<<<< HEAD
=======

      {/* 5. Credit limit gate */}
      {blockedBy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div
            ref={overrideDialogRef}
            role="alertdialog"
            aria-modal="true"
            tabIndex={-1}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-amber-300 overflow-hidden"
          >
            <div className="p-5 bg-amber-500 text-slate-950 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-black text-base">বাকির সীমা ছাড়িয়ে যাচ্ছে</h3>
                <p className="text-xs font-semibold opacity-80">{blockedBy.customerName}</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-semibold">নির্ধারিত সীমা</span>
                <span className="font-black text-slate-900">
                  {formatBengaliCurrency(blockedBy.limit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-semibold">এই বিক্রির পর মোট বাকি</span>
                <span className="font-black text-rose-600">
                  {formatBengaliCurrency(blockedBy.projectedBalance)}
                </span>
              </div>

              <p className="text-xs text-slate-500 pt-1">
                {isManagerOrAbove()
                  ? 'আপনি চাইলে সীমা অগ্রাহ্য করে বিক্রিটি সম্পন্ন করতে পারেন।'
                  : 'সীমা অগ্রাহ্য করতে দোকান মালিক বা ম্যানেজারের অনুমোদন প্রয়োজন।'}
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearBlock}
                  className="flex-1 h-12 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleOverrideCreditLimit}
                  disabled={!isManagerOrAbove() || isProcessing}
                  className="flex-1 h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm disabled:opacity-40 hover:bg-slate-800"
                >
                  সীমা অগ্রাহ্য করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
>>>>>>> c18622f (Bug Fix)
    </div>
  );
};
