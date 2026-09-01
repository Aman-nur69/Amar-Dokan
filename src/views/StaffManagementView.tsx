// ==============================================================================
// Amar Dokan (আমার দোকান) Staff & Role Management View
<<<<<<< HEAD
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
=======
// Accessible to the Shop Owner to manage access, roles and register PINs.
//
// Secrets are never displayed here. The list used to render every profile in
// every store together with its plaintext password.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { db, buildSyncItem } from '../db/offlineDb';
import { Profile, UserRole } from '../@types/database.types';
import { useAuthStore, getRoleInfo } from '../hooks/useAuthStore';
import { hashSecret } from '../lib/secureHash';
import { toast } from '../hooks/useToastStore';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { formatBengaliPhone } from '../lib/banglaNumberFormatter';
import {
  Users,
  UserPlus,
>>>>>>> c18622f (Bug Fix)
  Key,
  Phone,
  CheckCircle2,
  Lock,
<<<<<<< HEAD
  UserCheck,
  AlertCircle,
  X,
  Info,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { currentUser, isOwnerOrAbove } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
=======
  X,
  ShieldCheck,
  UserX,
  UserCheck,
} from 'lucide-react';

const BD_PHONE = /^01[3-9]\d{8}$/;

export const StaffManagementView: React.FC = () => {
  const { currentUser, activeStoreId, isOwnerOrAbove } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
>>>>>>> c18622f (Bug Fix)

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [staffPassword, setStaffPassword] = useState('');
<<<<<<< HEAD
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

=======
  const [staffPin, setStaffPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Password reset dialog. window.prompt() blocks the till and echoes the new
  // password in clear text on screen.
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [resetValue, setResetValue] = useState('');

  const dialogRef = useModalDismiss<HTMLDivElement>(isAddModalOpen, () => setIsAddModalOpen(false));
  const resetDialogRef = useModalDismiss<HTMLDivElement>(Boolean(resetTarget), () => {
    setResetTarget(null);
    setResetValue('');
  });

  /** Only this shop's staff. The unscoped query leaked every tenant's roster. */
  const fetchProfiles = useCallback(async () => {
    if (!activeStoreId) {
      setProfiles([]);
      return;
    }
    try {
      const list = await db.profiles.where('store_id').equals(activeStoreId).toArray();
      list.sort((a, b) => a.full_name.localeCompare(b.full_name, 'bn'));
      setProfiles(list);
    } catch (e) {
      console.error('Error loading profiles:', e);
      setProfiles([]);
    }
  }, [activeStoreId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setStaffPassword('');
    setStaffPin('');
    setRole('cashier');
    setFormError(null);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!BD_PHONE.test(cleanPhone)) {
      setFormError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711998877)।');
      return;
    }
    if (staffPassword.length < 6) {
      setFormError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (staffPin && !/^\d{4}$/.test(staffPin)) {
      setFormError('রেজিস্টার লকের পিন ঠিক ৪ ডিজিটের হতে হবে।');
      return;
    }

    // A phone number is the login id, so it has to be unique platform-wide.
    const duplicate = await db.profiles.where('phone').equals(cleanPhone).first();
    if (duplicate) {
      setFormError('এই মোবাইল নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        store_id: activeStoreId,
        full_name: fullName.trim(),
        phone: cleanPhone,
        role,
        // Digest only — the secret itself is never stored or shown.
        password_hash: await hashSecret(cleanPhone, staffPassword),
        pin_hash: await hashSecret(cleanPhone, staffPin || staffPassword.slice(0, 4)),
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      await db.transaction('rw', [db.profiles, db.sync_queue], async () => {
        await db.profiles.put(newProfile);
        await db.sync_queue.add(
          buildSyncItem('profiles', 'INSERT', {
            id: newProfile.id,
            store_id: newProfile.store_id,
            full_name: newProfile.full_name,
            phone: newProfile.phone,
            role: newProfile.role,
            is_active: true,
            created_at: now,
            updated_at: now,
          })
        );
      });

      toast.success(`কর্মী "${newProfile.full_name}" যুক্ত হয়েছে।`);
      setIsAddModalOpen(false);
      resetForm();
      fetchProfiles();
    } catch (err) {
      console.error('Failed to add staff:', err);
      setFormError('স্টাফ যুক্ত করতে ত্রুটি হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    if (profile.id === currentUser?.id) {
      toast.warning('নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।');
      return;
    }

    const nextActive = profile.is_active === false;
    const now = new Date().toISOString();
    await db.transaction('rw', [db.profiles, db.sync_queue], async () => {
      await db.profiles.update(profile.id, { is_active: nextActive, updated_at: now });
      await db.sync_queue.add(
        buildSyncItem('profiles', 'UPDATE', { id: profile.id, is_active: nextActive, updated_at: now })
      );
    });

    toast.success(
      nextActive
        ? `${profile.full_name} আবার সক্রিয় করা হয়েছে।`
        : `${profile.full_name} নিষ্ক্রিয় করা হয়েছে — আর লগইন করতে পারবেন না।`
    );
    fetchProfiles();
  };

  const handleResetSecret = async () => {
    if (!resetTarget) return;
    if (resetValue.trim().length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    const { password: _legacyPassword, ...rest } = resetTarget;
    await db.profiles.put({
      ...rest,
      password_hash: await hashSecret(resetTarget.phone || '', resetValue.trim()),
      updated_at: new Date().toISOString(),
    });
    toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে। কর্মীকে নতুন পাসওয়ার্ডটি জানিয়ে দিন।');
    setResetTarget(null);
    setResetValue('');
    fetchProfiles();
  };

>>>>>>> c18622f (Bug Fix)
  if (!isOwnerOrAbove()) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">অনুমতি নেই</h2>
        <p className="text-sm text-slate-500">
<<<<<<< HEAD
          শুধুমাত্র দোকান মালিক এবং সুপার অ্যাডমিন স্টাফ ও রোল পরিচালনা করতে পারবেন।
=======
          শুধুমাত্র দোকান মালিক স্টাফ ও রোল পরিচালনা করতে পারবেন।
>>>>>>> c18622f (Bug Fix)
        </p>
      </div>
    );
  }

<<<<<<< HEAD
=======
  const activeCount = profiles.filter((p) => p.is_active !== false).length;

>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
            ম্যানেজার এবং ক্যাশিয়ারদের অ্যাক্সেস ও লগইন পিন পরিচালনা করুন
=======
            ম্যানেজার ও ক্যাশিয়ারদের অ্যাক্সেস, রেজিস্টার পিন এবং লগইন নিয়ন্ত্রণ করুন
>>>>>>> c18622f (Bug Fix)
          </p>
        </div>

        <button
<<<<<<< HEAD
          onClick={() => setIsAddModalOpen(true)}
=======
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
>>>>>>> c18622f (Bug Fix)
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন স্টাফ যুক্ত করুন</span>
        </button>
      </div>

<<<<<<< HEAD
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
=======
      {/* Security notice — the previous screen printed every password here. */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <span>
          নিরাপত্তার জন্য কারও পাসওয়ার্ড বা পিন এখানে দেখানো হয় না — এমনকি মালিককেও নয়। কেউ পাসওয়ার্ড
          ভুলে গেলে "পাসওয়ার্ড রিসেট" চেপে নতুন পাসওয়ার্ড দিন।
        </span>
      </div>
>>>>>>> c18622f (Bug Fix)

      {/* Role Hierarchy Quick Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="font-bold text-sm text-purple-900">সুপার অ্যাডমিন</span>
          </div>
          <p className="text-xs text-purple-700/90">
<<<<<<< HEAD
            সর্বোচ্চ ক্ষমতা। সব স্টোর, সেটিংস ও আর্থিক রিপোর্ট নিয়ন্ত্রণ।
=======
            প্ল্যাটফর্ম পর্যায়ের অনুমোদন ও পর্যবেক্ষণ। দোকানের বিক্রি বা খাতায় হাত দিতে পারেন না।
>>>>>>> c18622f (Bug Fix)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-sm text-emerald-900">দোকান মালিক</span>
          </div>
          <p className="text-xs text-emerald-700/90">
<<<<<<< HEAD
            দোকানের সমস্ত ফিচার, নিট প্রফিট, স্টাফ পিন ও দিন সমাপনী অডিট।
=======
            দোকানের সব ফিচার, নিট লাভ, স্টাফ ব্যবস্থাপনা ও দিন সমাপনী।
>>>>>>> c18622f (Bug Fix)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-bold text-sm text-blue-900">ম্যানেজার</span>
          </div>
          <p className="text-xs text-blue-700/90">
<<<<<<< HEAD
            স্টক ও চালান এন্ট্রি, কাস্টমার বাকি আদায় ও পণ্য তালিকা আপডেট।
=======
            স্টক ও চালান এন্ট্রি, বাকি আদায়, রিপোর্ট — নিট লাভ ছাড়া।
>>>>>>> c18622f (Bug Fix)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-bold text-sm text-amber-900">ক্যাশিয়ার</span>
          </div>
          <p className="text-xs text-amber-700/90">
<<<<<<< HEAD
            দ্রুত ক্যাশ ও বাকি বিলিং, মেমো প্রিন্ট। গোপন রিপোর্ট ও চালান বন্ধ।
=======
            দ্রুত ক্যাশ ও বাকি বিলিং, মেমো প্রিন্ট। রিপোর্ট ও চালান বন্ধ।
>>>>>>> c18622f (Bug Fix)
          </p>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">
            এই দোকানের স্টাফ ({profiles.length} জন • সক্রিয় {activeCount} জন)
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {profiles.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-400">
              এখনো কোনো স্টাফ যুক্ত করা হয়নি।
            </div>
          )}

          {profiles.map((p) => {
            const roleInfo = getRoleInfo(p.role);
            const isActive = p.is_active !== false;
            const isSelf = p.id === currentUser?.id;

            return (
              <div
                key={p.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isActive ? 'hover:bg-slate-50' : 'bg-slate-50/60 opacity-75'
                }`}
>>>>>>> c18622f (Bug Fix)
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                    {p.full_name.charAt(0)}
                  </div>
                  <div>
<<<<<<< HEAD
                    <div className="flex items-center gap-2">
=======
                    <div className="flex items-center gap-2 flex-wrap">
>>>>>>> c18622f (Bug Fix)
                      <span className="font-bold text-slate-900 text-sm">{p.full_name}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeColor}`}
                      >
                        {roleInfo.labelBn}
                      </span>
<<<<<<< HEAD
=======
                      {isSelf && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-200 bg-slate-100 text-slate-600">
                          আপনি
                        </span>
                      )}
>>>>>>> c18622f (Bug Fix)
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
<<<<<<< HEAD
                        {p.phone}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Key className="w-3 h-3 text-slate-400" />
                        পাসওয়ার্ড: <span className="font-mono font-bold tracking-wider">{p.password || p.pin_code || '••••••'}</span>
=======
                        {formatBengaliPhone(p.phone)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Key className="w-3 h-3" />
                        পাসওয়ার্ড সুরক্ষিত
>>>>>>> c18622f (Bug Fix)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
<<<<<<< HEAD
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    সক্রিয়
                  </span>
=======
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-slate-500 bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    {isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>

                  <button
                    onClick={() => {
                      setResetTarget(p);
                      setResetValue('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    পাসওয়ার্ড রিসেট
                  </button>

                  <button
                    onClick={() => handleToggleActive(p)}
                    disabled={isSelf}
                    title={isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                    className={`p-2 rounded-lg border transition-colors disabled:opacity-30 ${
                      isActive
                        ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                        : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
>>>>>>> c18622f (Bug Fix)
                </div>
              </div>
            );
          })}
        </div>
      </div>

<<<<<<< HEAD
      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
=======
      {/* Password Reset Dialog */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            ref={resetDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="পাসওয়ার্ড রিসেট"
            tabIndex={-1}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200"
          >
            <h3 className="font-black text-slate-900 text-base mb-1">পাসওয়ার্ড রিসেট</h3>
            <p className="text-xs text-slate-500 mb-4">{resetTarget.full_name}</p>

            <input
              type="password"
              autoFocus
              minLength={6}
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড (৬+ অক্ষর)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetValue('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleResetSecret}
                disabled={resetValue.trim().length < 6}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="নতুন স্টাফ যোগ করুন"
            tabIndex={-1}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
>>>>>>> c18622f (Bug Fix)
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন স্টাফ যোগ করুন</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
<<<<<<< HEAD
=======
                aria-label="বন্ধ করুন"
>>>>>>> c18622f (Bug Fix)
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

<<<<<<< HEAD
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কর্মীর পুরো নাম
                </label>
=======
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কর্মীর পুরো নাম</label>
>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
                  মোবাইল নম্বর (লগইন ইউজারনেম)
=======
                  মোবাইল নম্বর (লগইন আইডি)
>>>>>>> c18622f (Bug Fix)
                </label>
                <input
                  type="tel"
                  required
<<<<<<< HEAD
=======
                  inputMode="numeric"
>>>>>>> c18622f (Bug Fix)
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ভূমিকা (Role)
                </label>
=======
                <label className="block text-xs font-bold text-slate-700 mb-1">ভূমিকা (Role)</label>
>>>>>>> c18622f (Bug Fix)
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
<<<<<<< HEAD
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
=======
                  <option value="cashier">ক্যাশিয়ার (ক্যাশ ও বাকি বিলিং)</option>
                  <option value="manager">ম্যানেজার (স্টক, চালান ও রিপোর্ট)</option>
                  <option value="owner">দোকান মালিক (সব কিছু ও নিট লাভ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড (৬+ অক্ষর)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="পাসওয়ার্ড দিন"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    রেজিস্টার পিন (৪ ডিজিট)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="যেমন ১২৩৪"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                >
                  সংরক্ষণ করুন
=======
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
>>>>>>> c18622f (Bug Fix)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
