// ==============================================================================
// Amar Dokan (আমার দোকান) Login & Shop Registration Screen
// Clean, Human-Friendly, Simple SaaS Design with Password Security & Quick Demo Logins
// ==============================================================================

import React, { useState } from 'react';
import { useAuthStore, DEMO_LOGINS_ENABLED } from '../../hooks/useAuthStore';
import { toast } from '../../hooks/useToastStore';
import { UserRole } from '../../@types/database.types';
import {
  Store,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Calculator,
  AlertCircle,
  FileText,
  CheckCircle2,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form states
  const [phone, setPhone] = useState(DEMO_LOGINS_ENABLED ? '01711998877' : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form states
  const [regShopName, setRegShopName] = useState('');
  const [regProprietor, setRegProprietor] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAddress, setRegAddress] = useState('');
  const [regTradeLicence, setRegTradeLicence] = useState('');
  const [regTin, setRegTin] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const {
    loginWithPhoneAndPassword,
    quickLoginDemoRole,
    registerNewShop,
    isLoading,
    loginError,
    clearError,
  } = useAuthStore();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    await loginWithPhoneAndPassword(phone, password);
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regShopName || !regProprietor || !regPhone || !regPassword || !regTradeLicence) return;

    if (regPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    const res = await registerNewShop({
      shopName: regShopName,
      proprietor: regProprietor,
      phone: regPhone,
      password: regPassword,
      address: regAddress || 'ঢাকা, বাংলাদেশ',
      tradeLicenceNo: regTradeLicence,
      tinNumber: regTin || 'N/A',
      tradeLicenceDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
    });

    if (res.success) {
      setRegSuccessMessage(res.message);
      // Reset
      setRegShopName('');
      setRegProprietor('');
      setRegPhone('');
      setRegPassword('');
      setRegAddress('');
      setRegTradeLicence('');
      setRegTin('');
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    clearError();
    await quickLoginDemoRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-8 text-slate-800">
      <div className="w-full max-w-lg">
        {/* Brand Header with Clean Spacing */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            আমার দোকান <span className="text-emerald-700 text-lg sm:text-xl font-bold">(Amar Dokan)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            খুচরা ও সুপার শপের জন্য পূর্ণাঙ্গ রিটেইল অপারেটিং সিস্টেম ও বাকির খাতা
          </p>
        </div>

        {/* Auth Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
          {/* Tabs Switcher: Login vs Shop Register */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                clearError();
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              লগইন করুন
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                clearError();
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              নতুন দোকান রেজিস্টার
            </button>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          {regSuccessMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>আবেদন গৃহীত হয়েছে</span>
              </div>
              <p>{regSuccessMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setRegSuccessMessage(null);
                  setActiveTab('LOGIN');
                }}
                className="mt-2 text-xs font-bold text-emerald-700 underline"
              >
                লগইন পাতায় ফিরে যান
              </button>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'LOGIN' ? (
            <div>
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    মোবাইল নম্বর
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    পাসওয়ার্ড (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="আপনার পাসওয়ার্ড দিন"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium text-slate-800 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>যাচাই করা হচ্ছে...</span>
                  ) : (
                    <>
                      <span>লগইন করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Role Picker - development builds only. */}
              {DEMO_LOGINS_ENABLED && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ১-ক্লিকে ডেমো টেস্ট লগইন
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">৪টি ভূমিকা</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Super Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickRole('super_admin')}
                    className="p-3 rounded-xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-100/70 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-900">সুপার অ্যাডমিন</span>
                    </div>
                    <p className="text-[11px] text-purple-700/80 leading-tight">
                      সকল শপ অনুমোদন ও পর্যবেক্ষণ (admin123)
                    </p>
                  </button>

                  {/* 2. Shop Owner */}
                  <button
                    type="button"
                    onClick={() => handleQuickRole('owner')}
                    className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-100/70 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">দোকান মালিক</span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 leading-tight">
                      লাভ, চালান, খরচ ও স্টাফ (dokan123)
                    </p>
                  </button>

                  {/* 3. Manager */}
                  <button
                    type="button"
                    onClick={() => handleQuickRole('manager')}
                    className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-100/70 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Briefcase className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold text-blue-900">ম্যানেজার</span>
                    </div>
                    <p className="text-[11px] text-blue-700/80 leading-tight">
                      স্টক, চালান ও বাকি খাতা (dokan123)
                    </p>
                  </button>

                  {/* 4. Cashier */}
                  <button
                    type="button"
                    onClick={() => handleQuickRole('cashier')}
                    className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/70 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calculator className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-900">ক্যাশিয়ার</span>
                    </div>
                    <p className="text-[11px] text-amber-700/80 leading-tight">
                      ক্যাশ বিক্রি ও ফেরত হিসাব (dokan123)
                    </p>
                  </button>
                </div>
              </div>
              )}
            </div>
          ) : (
            /* TAB 2: SHOP REGISTRATION */
            <form onSubmit={handleRegisterShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  দোকানের পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ সততা সুপার মার্কেট"
                  value={regShopName}
                  onChange={(e) => setRegShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    স্বত্বাধিকারীর নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="মালিকের নাম"
                    value={regProprietor}
                    onChange={(e) => setRegProprietor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (লগইন) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="পাসওয়ার্ড দিন"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টিআইএন (TIN Number)
                  </label>
                  <input
                    type="text"
                    placeholder="১২-সংখ্যার ই-টিআইএন"
                    value={regTin}
                    onChange={(e) => setRegTin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  দোকানের ঠিকানা (বাজার, এলাকা ও থানা)
                </label>
                <input
                  type="text"
                  placeholder="উদাঃ দোকান নং ৪, গুলশান-২ ডিসিসি মার্কেট"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              {/* Trade Licence Security Fields */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  ব্যবসার নিরাপত্তা ও ভেরিফিকেশন (Trade Licence)
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ট্রেড লাইসেন্স নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TRAD/DNCC/2026/XXXXXX"
                    value={regTradeLicence}
                    onChange={(e) => setRegTradeLicence(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ট্রেড লাইসেন্স স্ক্যান কপি বা ছবি
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center bg-white hover:bg-slate-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-500 font-medium block">
                      ক্লিক করে লাইসেন্সের ছবি বা পিডিএফ সিলেক্ট করুন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (অনুমোদনের জন্য সুপার অ্যাডমিন কর্তৃক যাচাই করা হবে)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>প্রক্রিয়াধীন...</span>
                ) : (
                  <>
                    <span>আবেদন জমা দিন</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>আমার দোকান (Amar Dokan) • নিরাপদ ক্লাউড ও অফলাইন পিওএস প্ল্যাটফর্ম</p>
        </div>
      </div>
    </div>
  );
};
