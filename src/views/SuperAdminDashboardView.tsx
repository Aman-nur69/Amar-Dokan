import React, { useState, useEffect } from 'react';
import { db } from '../db/offlineDb';
import { Store, ShopVerificationStatus, Sale } from '../@types/database.types';
import { useAuthStore } from '../hooks/useAuthStore';
import { useSuperAdminNavStore } from '../hooks/useSuperAdminNavStore';
import { formatBengaliCurrency, toBanglaDigits } from '../lib/banglaNumberFormatter';
import {
  ShieldCheck,
  Store as StoreIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  Building2,
  Phone,
  MapPin,
  TrendingUp,
  Plus,
  X,
  Upload,
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  onNavigateToShop?: () => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ onNavigateToShop }) => {
  const { enterStoreInspection, registerNewShop } = useAuthStore();
  const {
    adminTab,
    setAdminTab,
    isAddShopModalOpen,
    openAddShopModal,
    closeAddShopModal,
    setPlatformCounts,
  } = useSuperAdminNavStore();

  const [stores, setStores] = useState<Store[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocStore, setSelectedDocStore] = useState<Store | null>(null);
  const [selectedDetailStore, setSelectedDetailStore] = useState<Store | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');

  // New Shop Listing Modal States
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [proprietor, setProprietor] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopPin, setShopPin] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [tradeLicence, setTradeLicence] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [tradeLicenceUrl, setTradeLicenceUrl] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);

  const loadPlatformData = async () => {
    try {
      const allStores = await db.stores.toArray();
      const allSales = await db.sales.toArray();
      setStores(allStores);
      setSales(allSales);
    } catch (err) {
      console.error('Error loading platform data:', err);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const handleUpdateStatus = async (
    storeId: string,
    newStatus: ShopVerificationStatus,
    notes?: string
  ) => {
    try {
      const isApproved = newStatus === 'approved';
      await db.stores.update(storeId, {
        verification_status: newStatus,
        is_active: isApproved,
        verification_notes: notes || (isApproved ? 'যাচাই শেষে অনুমোদিত ও সক্রিয়' : 'স্থগিত'),
        updated_at: new Date().toISOString(),
      });

      // If approved, make sure owner profiles for this store are active
      if (isApproved) {
        const profiles = await db.profiles.where('store_id').equals(storeId).toArray();
        for (const p of profiles) {
          await db.profiles.update(p.id, { is_active: true });
        }

        // Seed basic starter categories for the newly approved store if none exist
        const existingCats = await db.categories.where('store_id').equals(storeId).count();
        if (existingCats === 0) {
          const starterCategories = [
            { id: crypto.randomUUID(), store_id: storeId, name_bn: 'চাল, ডাল ও তেল', name_en: 'Grains & Oil', icon: 'wheat', created_at: new Date().toISOString() },
            { id: crypto.randomUUID(), store_id: storeId, name_bn: 'মসলা ও নিত্যপ্রয়োজনীয়', name_en: 'Spices & Essentials', icon: 'sparkles', created_at: new Date().toISOString() },
            { id: crypto.randomUUID(), store_id: storeId, name_bn: 'বিস্কুট ও স্ন্যাকস', name_en: 'Snacks & Biscuits', icon: 'cookie', created_at: new Date().toISOString() },
            { id: crypto.randomUUID(), store_id: storeId, name_bn: 'টয়লেট্রিজ ও সাবান', name_en: 'Toiletries', icon: 'shield-check', created_at: new Date().toISOString() },
            { id: crypto.randomUUID(), store_id: storeId, name_bn: 'অন্যান্য পণ্য', name_en: 'General Items', icon: 'shopping-bag', created_at: new Date().toISOString() },
          ];
          await db.categories.bulkAdd(starterCategories);
        }
      }

      const updated = stores.map((s) =>
        s.id === storeId
          ? {
              ...s,
              verification_status: newStatus,
              is_active: isApproved,
              verification_notes: notes || s.verification_notes,
            }
          : s
      );
      setStores(updated);

      // Auto-close the detail review modal immediately upon approval or rejection
      setSelectedDetailStore(null);
      setRejectionNoteInput('');

      setActionSuccessMessage(
        isApproved
          ? 'দোকানটি সফলভাবে অনুমোদন দেওয়া হয়েছে এবং মালিকের অ্যাকাউন্ট সক্রিয় করা হয়েছে!'
          : 'দোকানটির আবেদন বাতিল/স্থগিত করা হয়েছে।'
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update store status:', err);
    }
  };

  const handleEnterShop = (store: Store) => {
    enterStoreInspection(store);
    if (onNavigateToShop) {
      onNavigateToShop();
    }
  };

  const handleCreateShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopError(null);

    if (!shopName.trim() || !proprietor.trim() || !shopPhone.trim() || !shopPin.trim()) {
      setShopError('দয়া করে দোকানের নাম, স্বত্বাধিকারী, মোবাইল নম্বর ও ৪ সংখ্যার পিন প্রদান করুন।');
      return;
    }

    if (shopPin.trim().length !== 4) {
      setShopError('পিন অবশ্যই ৪ সংখ্যার হতে হবে।');
      return;
    }

    setIsSubmittingShop(true);
    try {
      const storeId = `store-${Date.now()}`;
      const status: ShopVerificationStatus = autoApprove ? 'approved' : 'pending';
      const newStore: Store = {
        id: storeId,
        name: shopName.trim(),
        proprietor: proprietor.trim(),
        phone: shopPhone.trim(),
        address: shopAddress.trim() || 'নির্ধারিত ঠিকানা নেই',
        trade_licence_no: tradeLicence.trim() || 'TRAD/SAAS/' + Math.floor(100000 + Math.random() * 900000),
        trade_licence_doc_url: tradeLicenceUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
        tin_number: tinNumber.trim() || 'TIN-' + Math.floor(1000000000 + Math.random() * 9000000000),
        verification_status: status,
        verification_notes: autoApprove ? 'সুপার অ্যাডমিন কর্তৃক সরাসরি নথিভুক্ত ও অনুমোদিত' : 'ট্রেড লাইসেন্স ও টিআইএন যাচাই প্রক্রিয়াধীন',
        currency_symbol: '৳',
        is_active: autoApprove,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newProfile = {
        id: `p-${Date.now()}`,
        store_id: storeId,
        full_name: proprietor.trim(),
        phone: shopPhone.trim(),
        role: 'owner' as const,
        pin_code: shopPin.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.stores.put(newStore);
      await db.profiles.put(newProfile);

      await loadPlatformData();

      setActionSuccessMessage(`"${newStore.name}" সফলভাবে নতুন দোকান হিসেবে প্ল্যাটফর্মে নথিভুক্ত করা হয়েছে!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Reset form
      setShopName('');
      setProprietor('');
      setShopPhone('');
      setShopPin('');
      setShopAddress('');
      setTradeLicence('');
      setTinNumber('');
      setTradeLicenceUrl('');
      closeAddShopModal();
    } catch (err: any) {
      console.error('Error creating shop:', err);
      setShopError('দোকান তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingShop(false);
    }
  };

  // Sync platform counts with navigation store
  const totalShops = stores.length;
  const approvedShops = stores.filter((s) => s.verification_status === 'approved').length;
  const pendingShops = stores.filter((s) => s.verification_status === 'pending').length;
  const totalPlatformSales = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  useEffect(() => {
    setPlatformCounts({
      total: totalShops,
      pending: pendingShops,
      approved: approvedShops,
    });
  }, [totalShops, pendingShops, approvedShops, setPlatformCounts]);

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.trade_licence_no && s.trade_licence_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = adminTab === 'ALL' || s.verification_status === adminTab;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-20 md:pb-16 px-1 sm:px-0">
      {/* Header Banner with Clean SaaS Breathing Room */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              সুপার অ্যাডমিন প্ল্যাটফর্ম
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              সার্ভার সুরক্ষিত
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            সকল দোকান অনুমোদন ও লাইভ কার্যকলাপ পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 sm:hidden">
              প্ল্যাটফর্ম স্থিতি:
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              লাইভ ক্লাউড সিঙ্ক
            </span>
          </div>

          <button
            onClick={() => {
              setShopError(null);
              openAddShopModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন দোকান নথিভুক্ত করুন</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Platform Executive Metrics Cards: Focused purely on Shop List, Approvals & Rejections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Shops */}
        <button
          type="button"
          onClick={() => setAdminTab('ALL')}
          className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            adminTab === 'ALL'
              ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-600/20 shadow-xs'
              : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">মোট নথিভুক্ত দোকান</span>
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{toBanglaDigits(totalShops)} <span className="text-xs sm:text-sm font-bold text-slate-400">টি</span></p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">প্ল্যাটফর্ম শপ তালিকা</p>
          </div>
        </button>

        {/* Pending Approvals */}
        <button
          type="button"
          onClick={() => setAdminTab('pending')}
          className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            adminTab === 'pending'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-amber-200/90 shadow-xs hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">অনুমোদন অপেক্ষমাণ</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{toBanglaDigits(pendingShops)} <span className="text-xs sm:text-sm font-bold text-amber-500">টি</span></p>
            <p className="text-[10px] sm:text-xs text-amber-600/80 mt-0.5">ট্রেড লাইসেন্স ও টিআইএন যাচাই</p>
          </div>
        </button>

        {/* Approved Active */}
        <button
          type="button"
          onClick={() => setAdminTab('approved')}
          className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            adminTab === 'approved'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-emerald-200/90 shadow-xs hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">অনুমোদিত ও সক্রিয়</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{toBanglaDigits(approvedShops)} <span className="text-xs sm:text-sm font-bold text-emerald-500">টি</span></p>
            <p className="text-[10px] sm:text-xs text-emerald-600/80 mt-0.5">সক্রিয় চালুকৃত দোকান</p>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar: Mobile friendly */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="দোকান, মালিক বা ট্রেড লাইসেন্স দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Filter Pills with horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
            <button
              onClick={() => setAdminTab('ALL')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                adminTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সব ({toBanglaDigits(totalShops)})
            </button>
            <button
              onClick={() => setAdminTab('pending')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                adminTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              অপেক্ষমাণ ({toBanglaDigits(pendingShops)})
            </button>
            <button
              onClick={() => setAdminTab('approved')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                adminTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              অনুমোদিত ({toBanglaDigits(approvedShops)})
            </button>
          </div>
        </div>

        {/* Shops Verification List */}
        <div className="divide-y divide-slate-100">
          {filteredStores.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400">
              <StoreIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-bold text-slate-600">কোনো দোকান পাওয়া যায়নি</p>
            </div>
          ) : (
            filteredStores.map((store) => {
              const isPending = store.verification_status === 'pending';
              const isApproved = store.verification_status === 'approved';
              const isRejected = store.verification_status === 'rejected';

              return (
                <div
                  key={store.id}
                  className="py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 p-3 sm:p-4 rounded-xl transition-colors border border-transparent hover:border-slate-200/50"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <StoreIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                          {store.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved
                            ? 'অনুমোদিত'
                            : isPending
                            ? 'যাচাই অপেক্ষমাণ'
                            : 'বাতিল / স্থগিত'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>মালিক: <strong>{store.proprietor}</strong></span>
                        <span className="text-slate-300">•</span>
                        <a
                          href={`tel:${store.phone}`}
                          className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {store.phone}
                        </a>
                      </div>

                      <p className="text-xs text-slate-500 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{store.address}</span>
                      </p>

                      {/* Trade Licence & TIN Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {store.trade_licence_no ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDocStore(store)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            ট্রেড লাইসেন্স: {store.trade_licence_no}
                            <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            ট্রেড লাইসেন্স নেই
                          </span>
                        )}

                        {store.tin_number && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            TIN: {store.tin_number}
                          </span>
                        )}
                      </div>

                      {store.verification_notes && (
                        <p className="text-[11px] sm:text-xs text-slate-500 italic mt-0.5">
                          মন্তব্য: {store.verification_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons: Optimized for mobile touch with full-width flex row */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    {/* View Application Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetailStore(store);
                        setRejectionNoteInput('');
                      }}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="দোকানের নিবন্ধিত সমস্ত তথ্য ও সিকিউরিটি ডকুমেন্টস দেখুন"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-700" />
                      <span>আবেদনের বিস্তারিত</span>
                    </button>

                    {/* Approve / Reject Controls for Pending */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(store.id, 'approved')}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>অনুমোদন দিন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(store.id, 'rejected')}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          <span>বাতিল</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(store.id, 'suspended')}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                      >
                        স্থগিত
                      </button>
                    )}

                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(store.id, 'approved')}
                        className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold cursor-pointer"
                      >
                        পুনঃঅনুমোদন
                      </button>
                    )}

                    {/* Enter Shop as Superadmin */}
                    <button
                      type="button"
                      onClick={() => handleEnterShop(store)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 sm:bg-slate-100 sm:text-slate-800 sm:hover:bg-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="এই দোকানের হিসাব ও পিওএস পরিদর্শনে প্রবেশ করুন"
                    >
                      <span>দোকানে প্রবেশ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trade Licence Document Preview Modal */}
      {selectedDocStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">ট্রেড লাইসেন্স ও ট্যাক্স প্রত্যয়নপত্র</h3>
                <p className="text-xs text-slate-500">{selectedDocStore.name} ({selectedDocStore.proprietor})</p>
              </div>
              <button
                onClick={() => setSelectedDocStore(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">ট্রেড লাইসেন্স নম্বর</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{selectedDocStore.trade_licence_no}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">টিআইএন (TIN)</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{selectedDocStore.tin_number || 'জমা পড়েনি'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">স্ক্যান কপি প্রিভিউ</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 flex items-center justify-center">
                  <img
                    src={selectedDocStore.trade_licence_doc_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'}
                    alt="Trade Licence Document"
                    className="w-full object-cover max-h-72"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedDocStore(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Shop Application Review Modal */}
      {selectedDetailStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-6">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedDetailStore.name}</h3>
                  <p className="text-xs text-purple-200">দোকান রেজিস্ট্রেশন আবেদন ও ভেরিফিকেশন তথ্য</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailStore(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Badge Strip */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">বর্তমান অনুমোদন স্ট্যাটাস:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedDetailStore.verification_status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedDetailStore.verification_status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {selectedDetailStore.verification_status === 'approved'
                    ? 'অনুমোদিত ও সক্রিয়'
                    : selectedDetailStore.verification_status === 'pending'
                    ? 'যাচাই অপেক্ষমাণ'
                    : 'বাতিলকৃত / স্থগিত'}
                </span>
              </div>

              {/* Form Data Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">স্বত্বাধিকারী / মালিক</span>
                  <span className="font-bold text-slate-800 text-sm block">{selectedDetailStore.proprietor}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">লগইন মোবাইল নম্বর</span>
                  <span className="font-bold text-emerald-700 text-sm block font-mono">{selectedDetailStore.phone}</span>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">দোকানের ঠিকানা</span>
                  <span className="font-semibold text-slate-800 block">{selectedDetailStore.address || 'তথ্য প্রদান করা হয়নি'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">ট্রেড লাইসেন্স নম্বর</span>
                  <span className="font-bold text-slate-800 font-mono text-sm block">
                    {selectedDetailStore.trade_licence_no || 'জমাকৃত নয়'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium block">টিআইএন (TIN Number)</span>
                  <span className="font-bold text-slate-800 font-mono text-sm block">
                    {selectedDetailStore.tin_number || 'জমাকৃত নয়'}
                  </span>
                </div>
              </div>

              {/* Document Scanned Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-700" />
                  সংযুক্ত ট্রেড লাইসেন্স / পরিচয়পত্র স্ক্যান কপি
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56 flex items-center justify-center">
                  <img
                    src={selectedDetailStore.trade_licence_doc_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'}
                    alt="Document Scan"
                    className="w-full object-cover max-h-56"
                  />
                </div>
              </div>

              {/* Rejection Note / Remark input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যাডমিন মন্তব্য বা কারণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="উদাঃ ট্রেড লাইসেন্সের মেয়াদ উত্তীর্ণ অথবা সব কাগজপত্র সঠিক..."
                  value={rejectionNoteInput}
                  onChange={(e) => setRejectionNoteInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                />
              </div>

              {/* Quick Action Footer inside Modal */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailStore(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedDetailStore.id, 'rejected', rejectionNoteInput.trim() || undefined);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                  >
                    আবেদন বাতিল করুন
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedDetailStore.id, 'approved', rejectionNoteInput.trim() || undefined);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অনুমোদন দিন ও সক্রিয় করুন</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Shop Registration Modal (Super Admin Directly Lists a New Shop) */}
      {isAddShopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">নতুন দোকান নথিভুক্ত করুন</h3>
                  <p className="text-xs text-purple-200">সুপার অ্যাডমিন প্ল্যাটফর্মে নতুন শপ লিস্টিং</p>
                </div>
              </div>
              <button
                onClick={() => closeAddShopModal()}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShopSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {shopError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{shopError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    দোকানের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="উদাঃ রহমান ব্রাদার্স স্টোর"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    দোকান মালিকের নাম (স্বত্বাধিকারী) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="উদাঃ মোঃ আনিসুর রহমান"
                    value={proprietor}
                    onChange={(e) => setProprietor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লগইন মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মালিকের ৪-সংখ্যার পিন *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={shopPin}
                    onChange={(e) => setShopPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  দোকানের ঠিকানা (বাজার, এলাকা ও জেলা)
                </label>
                <input
                  type="text"
                  placeholder="উদাঃ দোকান নং ৪, কাওরান বাজার, ঢাকা"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                />
              </div>

              {/* Trade Licence & Tax verification */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-700" />
                  ব্যবসার নিরাপত্তা ও ভেরিফিকেশন (Trade Licence & TIN)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      ট্রেড লাইসেন্স নম্বর
                    </label>
                    <input
                      type="text"
                      placeholder="TRAD/DNCC/2026/XXXXXX"
                      value={tradeLicence}
                      onChange={(e) => setTradeLicence(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      টিআইএন (TIN Number)
                    </label>
                    <input
                      type="text"
                      placeholder="১২-সংখ্যার ই-টিআইএন"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ট্রেড লাইসেন্স স্ক্যান কপি লিংক বা ফটো URL (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={tradeLicenceUrl}
                    onChange={(e) => setTradeLicenceUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Status switch: Auto Approve or Keep Pending */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">তাত্ক্ষণিক অনুমোদন</span>
                  <span className="text-[11px] text-slate-500">
                    {autoApprove ? 'সরাসরি অনুমোদিত ও সক্রিয় হবে' : 'অপেক্ষমাণ তালিকায় সংরক্ষিত থাকবে'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => closeAddShopModal()}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingShop}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingShop ? 'সংরক্ষণ হচ্ছে...' : 'দোকান নথিভুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
