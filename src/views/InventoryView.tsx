// ==============================================================================
// MudiDokan (মুদিদোকান) Stock Management & Product Catalog Master View
// Category-Wise Product Presentation, Stock Status Badges, & Valuation Engine
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Product, ProductUnit, Category } from '../@types/database.types';
import {
  formatBengaliCurrency,
  toBanglaDigits,
} from '../lib/banglaNumberFormatter';
import {
  Search,
  PackagePlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Boxes,
  Plus,
  Minus,
  Barcode,
  X,
  Truck,
  Layers,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BigButton } from '../components/common/BigButton';
import { SupplierChalanSection } from '../components/inventory/SupplierChalanSection';
import { useAuthStore } from '../hooks/useAuthStore';

const getCategoryEmoji = (name?: string) => {
  if (!name) return '📦';
  const n = name.toLowerCase();
  if (name.includes('তেল') || name.includes('ঘি') || n.includes('oil')) return '🍶';
  if (name.includes('চাল') || name.includes('ডাল') || n.includes('rice') || n.includes('pulse')) return '🌾';
  if (name.includes('মশলা') || name.includes('মসলা') || name.includes('রসুন') || n.includes('spice')) return '🌶️';
  if (name.includes('বিস্কুট') || name.includes('স্ন্যাকস') || n.includes('snack') || n.includes('cookie')) return '🍪';
  if (name.includes('সাবান') || name.includes('টয়লেট্রিজ') || n.includes('toilet') || n.includes('soap')) return '🧼';
  if (name.includes('নিত্যপ্রয়োজনীয়') || name.includes('চিনি') || name.includes('লবণ')) return '🧂';
  return '📦';
};

export const InventoryView: React.FC = () => {
  const { hasAccess } = useAuthStore();
  const canManageStock = hasAccess('INVENTORY_MANAGE');
  const canViewChalan = hasAccess('CHALAN');

  const [subSection, setSubSection] = useState<'PRODUCTS' | 'CHALAN'>('PRODUCTS');
  const [isGroupedView, setIsGroupedView] = useState<boolean>(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const {
    products,
    allProducts,
    categories,
    chalans,
    chalanItems,
    searchQuery,
    setSearchQuery,
    chalanSearchQuery,
    setChalanSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCategory,
    setSelectedCategory,
    lowStockCount,
    outOfStockCount,
    totalValuation,
    totalChalansCount,
    totalChalanValuation,
    totalSupplierPaid,
    totalSupplierDue,
    adjustStock,
    addProduct,
    saveSupplierChalan,
    paySupplierDue,
  } = useInventory();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustMode, setAdjustMode] = useState<'ADD' | 'SET'>('ADD');

  // New product form
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('piece');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [isQuickItem, setIsQuickItem] = useState<boolean>(false);

  const unitLabels: Record<string, string> = {
    kg: 'কেজি',
    gm: 'গ্রাম',
    litre: 'লিটার',
    packet: 'প্যাকেট',
    piece: 'পিস',
    hali: 'হালি',
  };

  const handleOpenAdjust = (product: Product) => {
    setAdjustProduct(product);
    setAdjustAmount(0);
    setAdjustMode('ADD');
  };

  const handleConfirmAdjust = async () => {
    if (!adjustProduct) return;
    const qty = Number(adjustAmount);
    if (isNaN(qty) || qty === 0) {
      alert('সঠিক পরিমাণ লিখুন');
      return;
    }

    const ok = await adjustStock(
      adjustProduct.id,
      qty,
      adjustMode === 'ADD' ? 'PURCHASE' : 'AUDIT_CORRECTION'
    );

    if (ok) {
      setAdjustProduct(null);
    } else {
      alert('মজুদ আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) return;

    const res = await addProduct({
      name_bn: nameBn,
      name_en: nameEn || undefined,
      barcode: barcode.trim() || undefined,
      category_id: categoryId || undefined,
      unit,
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_quantity: stockQuantity,
      min_stock_alert: minStockAlert,
      is_quick_item: isQuickItem,
    });

    if (res.success) {
      setIsAddModalOpen(false);
      setNameBn('');
      setNameEn('');
      setBarcode('');
      setCategoryId('');
      setCostPrice(0);
      setSellingPrice(0);
      setStockQuantity(10);
      setMinStockAlert(5);
      setIsQuickItem(false);
    } else {
      alert(res.error);
    }
  };

  const toggleCollapse = (catId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: {
      category: Category | null;
      products: Product[];
      totalValuation: number;
      hasLowStock: boolean;
      hasOutOfStock: boolean;
    }[] = [];

    const grouped = new Map<string, Product[]>();
    products.forEach((p) => {
      const catId = p.category_id || 'UNCATEGORIZED';
      if (!grouped.has(catId)) {
        grouped.set(catId, []);
      }
      grouped.get(catId)!.push(p);
    });

    // Add predefined categories in order
    categories.forEach((cat) => {
      if (grouped.has(cat.id)) {
        const prods = grouped.get(cat.id)!;
        const totalVal = prods.reduce(
          (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.cost_price || 0),
          0
        );
        const hasLowStock = prods.some(
          (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert
        );
        const hasOutOfStock = prods.some((p) => p.stock_quantity <= 0);

        groups.push({
          category: cat,
          products: prods,
          totalValuation: totalVal,
          hasLowStock,
          hasOutOfStock,
        });
      }
    });

    // Add uncategorized products if any exist
    if (grouped.has('UNCATEGORIZED')) {
      const prods = grouped.get('UNCATEGORIZED')!;
      const totalVal = prods.reduce(
        (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.cost_price || 0),
        0
      );
      const hasLowStock = prods.some(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert
      );
      const hasOutOfStock = prods.some((p) => p.stock_quantity <= 0);

      groups.push({
        category: null,
        products: prods,
        totalValuation: totalVal,
        hasLowStock,
        hasOutOfStock,
      });
    }

    return groups;
  }, [products, categories]);

  // Reusable Product Row Renderer
  const renderProductRow = (product: Product) => {
    const isOutOfStock = product.stock_quantity <= 0;
    const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_alert;
    const cat = categories.find((c) => c.id === product.category_id);

    return (
      <div
        key={product.id}
        className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        {/* Left: Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs ${
              isOutOfStock
                ? 'bg-rose-100 text-rose-700'
                : isLowStock
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isOutOfStock ? (
              <XCircle className="w-6 h-6" />
            ) : isLowStock ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="font-extrabold text-base text-slate-900 flex flex-wrap items-center gap-2">
              <span className="truncate">{product.name_bn}</span>
              {cat && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200 flex items-center gap-1">
                  <span>{getCategoryEmoji(cat.name_bn)}</span>
                  <span>{cat.name_bn}</span>
                </span>
              )}
              {product.is_quick_item && (
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  POS কুইক গ্রিড
                </span>
              )}
            </h4>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                বিক্রি দর:{' '}
                <strong className="text-emerald-700 font-bold">
                  {formatBengaliCurrency(product.selling_price)}
                </strong>
                /{unitLabels[product.unit] || product.unit}
              </span>
              <span>
                ক্রয় দর:{' '}
                <strong className="text-slate-600 font-medium">
                  {formatBengaliCurrency(product.cost_price)}
                </strong>
              </span>
              {product.barcode && (
                <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Barcode className="w-3.5 h-3.5" />
                  {product.barcode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Current Stock Badge & Adjust Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
              বর্তমান মজুদ
            </span>
            <span
              className={`text-lg sm:text-xl font-black ${
                isOutOfStock
                  ? 'text-rose-600'
                  : isLowStock
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {toBanglaDigits(product.stock_quantity)} {unitLabels[product.unit] || product.unit}
            </span>
          </div>

          {canManageStock && (
            <button
              onClick={() => handleOpenAdjust(product)}
              className="h-11 px-3.5 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>মজুদ সমন্বয়</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Sub-Section Navigation Switcher (Products vs Supplier Chalans) */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-3xl w-full max-w-lg mx-auto shadow-inner">
        <button
          onClick={() => setSubSection('PRODUCTS')}
          className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all select-none ${
            subSection === 'PRODUCTS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>পণ্য ও মজুদ ({toBanglaDigits(allProducts.length)})</span>
        </button>

        {canViewChalan && (
          <button
            onClick={() => setSubSection('CHALAN')}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all select-none relative ${
              subSection === 'CHALAN'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>কোম্পানির চালান ({toBanglaDigits(totalChalansCount)})</span>
            {totalSupplierDue > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute top-3 right-4" />
            )}
          </button>
        )}
      </div>

      {subSection === 'CHALAN' ? (
        <SupplierChalanSection
          chalans={chalans}
          chalanItems={chalanItems}
          products={allProducts}
          searchQuery={chalanSearchQuery}
          onSearchChange={setChalanSearchQuery}
          totalChalansCount={totalChalansCount}
          totalChalanValuation={totalChalanValuation}
          totalSupplierPaid={totalSupplierPaid}
          totalSupplierDue={totalSupplierDue}
          onSaveChalan={saveSupplierChalan}
          onPaySupplierDue={paySupplierDue}
        />
      ) : (
        <>
          {/* Top Stock KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Stock Valuation */}
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                  মোট মজুদ পণ্যের ক্রয়মূল্য
                </p>
                <h2 className="text-3xl font-black text-emerald-400">
                  {formatBengaliCurrency(totalValuation)}
                </h2>
                <p className="text-xs text-slate-400 mt-1">দোকানের মোট স্টক ইনভেস্টমেন্ট</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            {/* Low Stock Warning */}
            <div className="p-5 rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-amber-100 mb-1">
                  কম মজুদ সতর্কবার্তা
                </p>
                <h2 className="text-3xl font-black">{toBanglaDigits(lowStockCount)} টি পণ্য</h2>
                <p className="text-xs text-amber-100 mt-1">দ্রুত পাইকারি অর্ডার দিতে হবে</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Out of Stock Alert */}
            <div className="p-5 rounded-3xl bg-rose-600 text-white shadow-lg shadow-rose-600/20 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-rose-200 mb-1">
                  স্টক শেষ (০ মজুদ)
                </p>
                <h2 className="text-3xl font-black">{toBanglaDigits(outOfStockCount)} টি পণ্য</h2>
                <p className="text-xs text-rose-100 mt-1">কাস্টমারকে দেয়া যাচ্ছে না</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* 1. Touch-Optimized Category Bar (Mobile/Tablet Horizontal Scrolling) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🛍️ সব ক্যাটাগরি</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  selectedCategory === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {toBanglaDigits(allProducts.length)}
              </span>
            </button>

            {categories.map((cat) => {
              const count = allProducts.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{getCategoryEmoji(cat.name_bn)}</span>
                  <span>{cat.name_bn}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {toBanglaDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Stock Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Search, Status Badges, View Switcher & Add Button */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="পণ্যের নাম বা বারকোড দিয়ে খুঁজুন..."
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 focus:border-emerald-500 outline-none shadow-xs"
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              {/* Status Filters, View Toggle, and + New Product Button */}
              <div className="flex gap-2 items-center flex-wrap">
                {/* View Switcher: Category Grouped vs Flat List */}
                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex">
                  <button
                    onClick={() => setIsGroupedView(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isGroupedView ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ক্যাটাগরি ভিত্তিক গ্রুপ ভিউ"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ক্যাটাগরি গ্রুপ</span>
                  </button>
                  <button
                    onClick={() => setIsGroupedView(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      !isGroupedView ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="সাধারণ তালিকা ভিউ"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">একক তালিকা</span>
                  </button>
                </div>

                {/* Stock Level Status Filter Tabs */}
                <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-xs">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সকল
                  </button>
                  <button
                    onClick={() => setStatusFilter('IN_STOCK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === 'IN_STOCK'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    পর্যাপ্ত
                  </button>
                  <button
                    onClick={() => setStatusFilter('LOW_STOCK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === 'LOW_STOCK'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    কম স্টক
                  </button>
                  <button
                    onClick={() => setStatusFilter('OUT_OF_STOCK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === 'OUT_OF_STOCK'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    স্টক শেষ
                  </button>
                </div>

                {canManageStock && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-12 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all flex-shrink-0 cursor-pointer"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>+ নতুন পণ্য</span>
                  </button>
                )}
              </div>
            </div>

            {/* Product Items List: Category-Wise Grouped View OR Flat List */}
            <div className="overflow-x-auto">
              {products.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-base font-bold text-slate-600 mb-1">কোনো পণ্য পাওয়া যায়নি</p>
                  <p className="text-xs">নতুন পণ্য যুক্ত করতে উপরের বাটনে চাপ দিন।</p>
                </div>
              ) : isGroupedView && selectedCategory === 'ALL' ? (
                /* Category-Wise Grouped Sectioning */
                groupedProducts.map((group) => {
                  const catId = group.category ? group.category.id : 'uncategorized';
                  const isCollapsed = collapsedCategories.has(catId);

                  return (
                    <div key={catId} className="border-b border-slate-200 last:border-b-0">
                      {/* Category Header Banner */}
                      <div
                        onClick={() => toggleCollapse(catId)}
                        className="bg-slate-100/90 hover:bg-slate-200/70 px-4 sm:px-5 py-3 flex items-center justify-between cursor-pointer transition-colors select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl flex-shrink-0">
                            {getCategoryEmoji(group.category?.name_bn)}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2 truncate">
                              <span>
                                {group.category ? group.category.name_bn : 'সাধারণ পণ্য (অন্যান্য)'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                                {toBanglaDigits(group.products.length)} টি পণ্য
                              </span>
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                            মজুদ মূল্য:{' '}
                            <strong className="text-slate-900 font-black">
                              {formatBengaliCurrency(group.totalValuation)}
                            </strong>
                          </span>
                          {group.hasLowStock && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                              কম স্টক
                            </span>
                          )}
                          {group.hasOutOfStock && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200">
                              স্টক শেষ
                            </span>
                          )}
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Category Products */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {group.products.map(renderProductRow)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Flat List View (When Grouped is off or a specific category is filtered) */
                <div className="divide-y divide-slate-100">
                  {products.map(renderProductRow)}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 font-semibold">
              <span>মোট প্রদর্শিত পণ্য: {toBanglaDigits(products.length)} টি</span>
              <span>ক্যাটাগরি অনুযায়ী সাজানো থাকলে দোকানে মাল গোছাতে ও দ্রুত অর্ডার দিতে সুবিধা হয়</span>
            </div>
          </div>

          {/* Adjust Stock Modal */}
          {adjustProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{adjustProduct.name_bn}</h3>
                    <p className="text-xs text-slate-500">
                      বর্তমান মজুদ: {toBanglaDigits(adjustProduct.stock_quantity)}{' '}
                      {unitLabels[adjustProduct.unit] || adjustProduct.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => setAdjustProduct(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode switch: Add or Set exact */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
                  <button
                    onClick={() => setAdjustMode('ADD')}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      adjustMode === 'ADD' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    + নতুন মাল যোগ
                  </button>
                  <button
                    onClick={() => setAdjustMode('SET')}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      adjustMode === 'SET' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    সরাসরি স্টক সংখ্যা লিখুন
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    {adjustMode === 'ADD' ? 'কত পরিমাণ মাল যোগ হবে?' : 'নতুন মোট স্টক সংখ্যা'} (
                    {unitLabels[adjustProduct.unit] || adjustProduct.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={adjustAmount || ''}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    placeholder="০"
                    className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-2xl font-black text-center focus:border-emerald-500 outline-none"
                    autoFocus
                  />
                  {adjustMode === 'ADD' && adjustAmount !== 0 && (
                    <p className="text-xs text-emerald-800 font-bold text-center mt-2">
                      নতুন মোট মজুদ হবে:{' '}
                      {toBanglaDigits(adjustProduct.stock_quantity + adjustAmount)}{' '}
                      {unitLabels[adjustProduct.unit] || adjustProduct.unit}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustProduct(null)}
                    className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm"
                  >
                    বাতিল
                  </button>
                  <BigButton variant="cash" onClick={handleConfirmAdjust} className="flex-1">
                    নিশ্চিত করুন
                  </BigButton>
                </div>
              </div>
            </div>
          )}

          {/* Add Product Modal (With Category Selection Dropdown) */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 my-8 overflow-hidden">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-black">নতুন পণ্য যুক্ত করুন</h3>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      পণ্যের ক্যাটাগরি
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">ক্যাটাগরি নির্বাচন করুন (ঐচ্ছিক)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {getCategoryEmoji(c.name_bn)} {c.name_bn} ({c.name_en})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      পণ্যের নাম (বাংলায়) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameBn}
                      onChange={(e) => setNameBn(e.target.value)}
                      placeholder="যেমন: চিনিগুঁড়া পোলাও চাল"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        ইংরেজি নাম (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Polao Rice"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        বারকোড (যদি থাকে)
                      </label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="8941100..."
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        একক (Unit)
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as ProductUnit)}
                        className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="kg">কেজি (kg)</option>
                        <option value="litre">লিটার (litre)</option>
                        <option value="packet">প্যাকেট (packet)</option>
                        <option value="piece">পিস (piece)</option>
                        <option value="hali">হালি (hali)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        ক্রয় দর (৳)
                      </label>
                      <input
                        type="number"
                        value={costPrice || ''}
                        onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                        placeholder="১০০"
                        className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        বিক্রি দর (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        value={sellingPrice || ''}
                        onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                        placeholder="১২০"
                        className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-black text-emerald-700 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        প্রাথমিক মজুদ
                      </label>
                      <input
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        কম স্টক সতর্কতা মাত্রা
                      </label>
                      <input
                        type="number"
                        value={minStockAlert}
                        onChange={(e) => setMinStockAlert(parseFloat(e.target.value) || 0)}
                        className="w-full h-12 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="quickItem"
                      checked={isQuickItem}
                      onChange={(e) => setIsQuickItem(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 rounded"
                    />
                    <label htmlFor="quickItem" className="text-xs font-bold text-slate-800 cursor-pointer">
                      POS স্ক্রিনে দ্রুত বিক্রির গ্রিডে দেখান (১-ট্যাপ যোগের জন্য)
                    </label>
                  </div>

                  <div className="pt-2">
                    <BigButton variant="cash" type="submit" fullWidth>
                      পণ্য সংরক্ষণ করুন
                    </BigButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
