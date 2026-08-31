// ==============================================================================
// Amar Dokan (আমার দোকান) Super Admin Multi-Store Control Center
// Platform-wide shop approvals, compliance review (Trade Licence/TIN), and live oversight
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { db } from '../db/offlineDb';
import { Store, ShopVerificationStatus, Sale } from '../@types/database.types';
import { useAuthStore } from '../hooks/useAuthStore';
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
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  onNavigateToShop?: () => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ onNavigateToShop }) => {
  const { enterStoreInspection } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ShopVerificationStatus>('ALL');
  const [selectedDocStore, setSelectedDocStore] = useState<Store | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

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
      await db.stores.update(storeId, {
        verification_status: newStatus,
        is_active: newStatus === 'approved',
        verification_notes: notes || (newStatus === 'approved' ? 'যাচাই শেষে অনুমোদিত' : 'স্থগিত'),
        updated_at: new Date().toISOString(),
      });

      const updated = stores.map((s) =>
        s.id === storeId
          ? {
              ...s,
              verification_status: newStatus,
              is_active: newStatus === 'approved',
              verification_notes: notes || s.verification_notes,
            }
          : s
      );
      setStores(updated);
      setActionSuccessMessage(
        newStatus === 'approved'
          ? 'দোকানটি সফলভাবে অনুমোদন দেওয়া হয়েছে!'
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

  // Platform Metrics
  const totalShops = stores.length;
  const approvedShops = stores.filter((s) => s.verification_status === 'approved').length;
  const pendingShops = stores.filter((s) => s.verification_status === 'pending').length;
  const totalPlatformSales = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.trade_licence_no && s.trade_licence_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.verification_status === statusFilter;
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

        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[11px] font-bold uppercase text-slate-400 sm:hidden">
            প্ল্যাটফর্ম স্থিতি:
          </span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            লাইভ ক্লাউড সিঙ্ক
          </span>
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
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">মোট নথিভুক্ত দোকান</span>
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{toBanglaDigits(totalShops)} <span className="text-xs sm:text-sm font-bold text-slate-400">টি</span></p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">প্ল্যাটফর্ম শপ তালিকা</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-amber-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">অনুমোদন অপেক্ষমাণ</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{toBanglaDigits(pendingShops)} <span className="text-xs sm:text-sm font-bold text-amber-500">টি</span></p>
            <p className="text-[10px] sm:text-xs text-amber-600/80 mt-0.5">ট্রেড লাইসেন্স ও টিআইএন যাচাই</p>
          </div>
        </div>

        {/* Approved Active */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-emerald-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">অনুমোদিত ও সক্রিয়</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{toBanglaDigits(approvedShops)} <span className="text-xs sm:text-sm font-bold text-emerald-500">টি</span></p>
            <p className="text-[10px] sm:text-xs text-emerald-600/80 mt-0.5">সক্রিয় চালুকৃত দোকান</p>
          </div>
        </div>
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
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সব ({toBanglaDigits(totalShops)})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              অপেক্ষমাণ ({toBanglaDigits(pendingShops)})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              অনুমোদিত ({toBanglaDigits(approvedShops)})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              বাতিলকৃত
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
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
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
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
