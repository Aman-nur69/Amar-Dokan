// ==============================================================================
// Amar Dokan (আমার দোকান) Staff & Role Management View
// Accessible to Shop Owner and Super Admin to manage access & PIN codes
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { db, INITIAL_PROFILES } from '../db/offlineDb';
import { Profile, UserRole } from '../@types/database.types';
import { useAuthStore, getRoleInfo } from '../hooks/useAuthStore';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  Phone,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertCircle,
  X,
  Info,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { currentUser, isOwnerOrAbove } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [staffPassword, setStaffPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      const list = await db.profiles.toArray();
      if (list.length === 0) {
        setProfiles(INITIAL_PROFILES);
      } else {
        setProfiles(list);
      }
    } catch (e) {
      console.error('Error loading profiles:', e);
      setProfiles(INITIAL_PROFILES);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !staffPassword) return;

    if (staffPassword.length < 6) {
      setStatusMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    try {
      const newProfile: Profile = {
        id: `p-${Date.now()}`,
        store_id: currentUser?.store_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        full_name: fullName,
        phone: phone,
        role: role,
        password: staffPassword,
        pin_code: staffPassword.slice(0, 4),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.profiles.put(newProfile);
      setStatusMessage(`কর্মী "${fullName}" সফলভাবে যুক্ত হয়েছে!`);
      setIsAddModalOpen(false);
      setFullName('');
      setPhone('');
      setStaffPassword('');
      setRole('cashier');
      fetchProfiles();

      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to add staff:', err);
      setStatusMessage('স্টাফ যুক্ত করতে ত্রুটি হয়েছে।');
    }
  };

  if (!isOwnerOrAbove()) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">অনুমতি নেই</h2>
        <p className="text-sm text-slate-500">
          শুধুমাত্র দোকান মালিক এবং সুপার অ্যাডমিন স্টাফ ও রোল পরিচালনা করতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900">স্টাফ ও ভূমিকা ব্যবস্থাপনা</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ম্যানেজার এবং ক্যাশিয়ারদের অ্যাক্সেস ও লগইন পিন পরিচালনা করুন
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন স্টাফ যুক্ত করুন</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Role Hierarchy Quick Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="font-bold text-sm text-purple-900">সুপার অ্যাডমিন</span>
          </div>
          <p className="text-xs text-purple-700/90">
            সর্বোচ্চ ক্ষমতা। সব স্টোর, সেটিংস ও আর্থিক রিপোর্ট নিয়ন্ত্রণ।
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-sm text-emerald-900">দোকান মালিক</span>
          </div>
          <p className="text-xs text-emerald-700/90">
            দোকানের সমস্ত ফিচার, নিট প্রফিট, স্টাফ পিন ও দিন সমাপনী অডিট।
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-bold text-sm text-blue-900">ম্যানেজার</span>
          </div>
          <p className="text-xs text-blue-700/90">
            স্টক ও চালান এন্ট্রি, কাস্টমার বাকি আদায় ও পণ্য তালিকা আপডেট।
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-bold text-sm text-amber-900">ক্যাশিয়ার</span>
          </div>
          <p className="text-xs text-amber-700/90">
            দ্রুত ক্যাশ ও বাকি বিলিং, মেমো প্রিন্ট। গোপন রিপোর্ট ও চালান বন্ধ।
          </p>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">সকল সক্রিয় স্টাফ ({profiles.length} জন)</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {profiles.map((p) => {
            const roleInfo = getRoleInfo(p.role);
            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                    {p.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.full_name}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeColor}`}
                      >
                        {roleInfo.labelBn}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {p.phone}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Key className="w-3 h-3 text-slate-400" />
                        পাসওয়ার্ড: <span className="font-mono font-bold tracking-wider">{p.password || p.pin_code || '••••••'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    সক্রিয়
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন স্টাফ যোগ করুন</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কর্মীর পুরো নাম
                </label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ আব্দুল করিম"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর (লগইন ইউজারনেম)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ভূমিকা (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  <option value="cashier">ক্যাশিয়ার (শুধু ক্যাশ বিক্রি ও বিলিং)</option>
                  <option value="manager">ম্যানেজার (স্টক, চালান ও বাকি খাতা)</option>
                  {currentUser?.role === 'super_admin' && (
                    <>
                      <option value="owner">দোকান মালিক (ফুল এক্সেস ও প্রফিট)</option>
                      <option value="super_admin">সুপার অ্যাডমিন</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পাসওয়ার্ড (লগইনের জন্য, কমপক্ষে ৬ অক্ষর)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="পাসওয়ার্ড দিন"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
