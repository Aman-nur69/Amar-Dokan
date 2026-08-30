// ==============================================================================
// Amar Dokan (আমার দোকান) Login & Authentication Screen
// Clean, Human-Friendly, Simple SaaS Design with Quick Demo Role Login
// ==============================================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../hooks/useAuthStore';
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
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('01711998877');
  const [pin, setPin] = useState('1234');
  const { loginWithPhoneAndPin, quickLoginDemoRole, isLoading, loginError, clearError } =
    useAuthStore();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) return;
    await loginWithPhoneAndPin(phone, pin);
  };

  const handleQuickRole = async (role: UserRole) => {
    clearError();
    await quickLoginDemoRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            আমার দোকান <span className="text-emerald-600 text-lg sm:text-xl font-bold">(Amar Dokan)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            খুচরা ও সুপার শপের জন্য স্মার্ট ক্যাশ, বাকি ও ইনভেন্টরি সফটওয়্যার
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>সফটওয়্যারে প্রবেশ করুন</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SaaS v২.০
            </span>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

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
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ৪-সংখ্যার গোপন পিন (PIN)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent tracking-widest text-center font-bold text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

          {/* Quick Demo Role Picker Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ১-ক্লিকে ডেমো টেস্ট লগইন
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">৪টি ভূমিকা</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickRole('super_admin')}
                className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-900">সুপার অ্যাডমিন</span>
                </div>
                <p className="text-[11px] text-purple-700/80 leading-tight">
                  সম্পূর্ণ সফটওয়্যার ও সব রোল কন্ট্রোল
                </p>
              </button>

              {/* 2. Shop Owner */}
              <button
                type="button"
                onClick={() => handleQuickRole('owner')}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">দোকান মালিক</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 leading-tight">
                  দৈনিক লাভ, খরচ, চালান ও স্টাফ
                </p>
              </button>

              {/* 3. Manager */}
              <button
                type="button"
                onClick={() => handleQuickRole('manager')}
                className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">ম্যানেজার</span>
                </div>
                <p className="text-[11px] text-blue-700/80 leading-tight">
                  স্টক, সরবরাহ চালান ও বাকি খাতা
                </p>
              </button>

              {/* 4. Cashier */}
              <button
                type="button"
                onClick={() => handleQuickRole('cashier')}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900">ক্যাশিয়ার</span>
                </div>
                <p className="text-[11px] text-amber-700/80 leading-tight">
                  ক্যাশ বিক্রি ও দ্রুত বিলিং
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>আমার দোকান (Amar Dokan) • ১০০% অফলাইন ও অনলাইন ক্লাউড সিঙ্ক রেডি</p>
        </div>
      </div>
    </div>
  );
};
