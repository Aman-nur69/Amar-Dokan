// ==============================================================================
// MudiDokan (আমার দোকান) - Web Database Seeder View
// Accessible directly via /SeedDatabase.php
// ==============================================================================

import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { Sparkles, CheckCircle2, ArrowLeft, RefreshCw, Database } from 'lucide-react';

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashSecret(phone: string, secret: string): Promise<string> {
  return await sha256(`mudidokan:${phone.replace(/\D/g, '')}:${secret}`);
}

const MAIN_STORE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const STORE_2_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';
const STORE_3_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';

export const SeedDatabaseView: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'ডাটাবেজ সিড করতে নিচের বাটনে ক্লিক করুন...',
  ]);
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setStatus('RUNNING');
    setLogs([`[${new Date().toLocaleTimeString()}] ডাটাবেজ সিডিং প্রসেস শুরু হয়েছে...`]);

    try {
      if (!isSupabaseConfigured()) {
        addLog('❌ Supabase credentials are not configured in environment.');
        setStatus('FAILED');
        setIsSeeding(false);
        return;
      }

      const now = new Date().toISOString();

      // 1. Stores
      addLog('[1/7] Seeding Retail Stores...');
      await supabase.from('stores').upsert(
        [
          {
            id: MAIN_STORE_ID,
            name: 'মা বাবার দোয়া স্টোর',
            proprietor: 'হাজী মোঃ রফিকুল ইসলাম',
            phone: '01711998877',
            address: 'দোকান নং ৪, গুলশান-২ ডিসিসি মার্কেট, ঢাকা',
            trade_licence_no: 'TRAD/DNCC/2026/049182',
            tin_number: '584930219481',
            verification_status: 'approved',
            verification_notes: 'ট্রেড লাইসেন্স ও দোকান যাচাই সম্পন্ন',
            bkash_number: '01711998877',
            nagad_number: '01711998877',
            currency_symbol: '৳',
            is_active: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: STORE_2_ID,
            name: 'মদিনা জেনারেল স্টোর',
            proprietor: 'মাওলানা আব্দুল হাই',
            phone: '01811223344',
            address: 'মেইন রোড, মিরপুর-১০ গোলচত্বর, ঢাকা',
            trade_licence_no: 'TRAD/DNCC/2026/102948',
            tin_number: '492019482019',
            verification_status: 'approved',
            verification_notes: 'অনুমোদিত খুচরা রিটেইল শপ',
            bkash_number: '01811223344',
            currency_symbol: '৳',
            is_active: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: STORE_3_ID,
            name: 'ভাই ভাই সুপার শপ',
            proprietor: 'কামরুল হাসান',
            phone: '01911223344',
            address: 'সেক্টর ৭, উত্তরা মডেল টাউন, ঢাকা',
            trade_licence_no: 'TRAD/DNCC/2026/948201',
            tin_number: '918274019284',
            verification_status: 'pending',
            verification_notes: 'কাগজপত্র যাচাইাধীন',
            currency_symbol: '৳',
            is_active: false,
            created_at: now,
            updated_at: now,
          },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 3 Stores successfully created.');

      // 2. Profiles
      addLog('[2/7] Seeding User Profiles & Roles...');
      const adminHash = await hashSecret('01700000000', 'admin123');
      const ownerHash = await hashSecret('01711998877', 'pass1234');
      const mgrHash = await hashSecret('01811223344', 'pass1234');
      const cashHash = await hashSecret('01911223344', 'pass1234');

      await supabase.from('profiles').upsert(
        [
          {
            id: 'f0000000-0000-0000-0000-000000000001',
            store_id: MAIN_STORE_ID,
            full_name: 'সুপার অ্যাডমিন (Super Admin)',
            phone: '01700000000',
            role: 'super_admin',
            password_hash: adminHash,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: 'f0000000-0000-0000-0000-000000000002',
            store_id: MAIN_STORE_ID,
            full_name: 'হাজী মোঃ রফিকুল ইসলাম (মালিক)',
            phone: '01711998877',
            role: 'owner',
            password_hash: ownerHash,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: 'f0000000-0000-0000-0000-000000000003',
            store_id: MAIN_STORE_ID,
            full_name: 'মোহাম্মদ তানভীর (ম্যানেজার)',
            phone: '01811223344',
            role: 'manager',
            password_hash: mgrHash,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: 'f0000000-0000-0000-0000-000000000004',
            store_id: MAIN_STORE_ID,
            full_name: 'সাকিব আল হাসান (ক্যাশিয়ার)',
            phone: '01911223344',
            role: 'cashier',
            password_hash: cashHash,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 4 Profiles created (Super Admin, Owner, Manager, Cashier).');

      // 3. Categories
      addLog('[3/7] Seeding Categories...');
      const cat1 = 'c0000000-0000-0000-0000-000000000001';
      const cat2 = 'c0000000-0000-0000-0000-000000000002';
      const cat3 = 'c0000000-0000-0000-0000-000000000003';
      const cat4 = 'c0000000-0000-0000-0000-000000000004';
      const cat5 = 'c0000000-0000-0000-0000-000000000005';

      await supabase.from('categories').upsert(
        [
          { id: cat1, store_id: MAIN_STORE_ID, name_bn: 'চাল, ডাল ও তেল', name_en: 'Grains & Oil', icon: 'wheat', created_at: now },
          { id: cat2, store_id: MAIN_STORE_ID, name_bn: 'মসলা ও নিত্যপ্রয়োজনীয়', name_en: 'Spices & Essentials', icon: 'sparkles', created_at: now },
          { id: cat3, store_id: MAIN_STORE_ID, name_bn: 'বিস্কুট ও স্ন্যাকস', name_en: 'Snacks & Biscuits', icon: 'cookie', created_at: now },
          { id: cat4, store_id: MAIN_STORE_ID, name_bn: 'চা, চিনি ও দুগ্ধজাত', name_en: 'Tea, Sugar & Dairy', icon: 'coffee', created_at: now },
          { id: cat5, store_id: MAIN_STORE_ID, name_bn: 'টয়লেট্রিজ ও সাবান', name_en: 'Toiletries', icon: 'shield-check', created_at: now },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 5 Product Categories created.');

      // 4. Products
      addLog('[4/7] Seeding Products with Real Stock...');
      await supabase.from('products').upsert(
        [
          { id: 'p0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010001', name_bn: 'নাজিরশাইল চাল (মিনিকেট)', name_en: 'Nazirshail Rice', unit: 'kg', cost_price: 72.0, selling_price: 80.0, stock_quantity: 450.0, min_stock_alert: 50.0, is_quick_item: true, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010002', name_bn: 'দেশি মসুর ডাল', name_en: 'Red Lentils', unit: 'kg', cost_price: 125.0, selling_price: 140.0, stock_quantity: 85.0, min_stock_alert: 20.0, is_quick_item: true, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000003', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010003', name_bn: 'রূপচাঁদা সয়াবিন তেল ১ লিটার', name_en: 'Rupchanda Soybean Oil 1L', unit: 'litre', cost_price: 175.0, selling_price: 188.0, stock_quantity: 120.0, min_stock_alert: 15.0, is_quick_item: true, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000004', store_id: MAIN_STORE_ID, category_id: cat4, barcode: '894110010004', name_bn: 'তীর পরিশোধিত সাদা চিনি ১ কেজি', name_en: 'Teer Refined Sugar 1kg', unit: 'kg', cost_price: 130.0, selling_price: 140.0, stock_quantity: 110.0, min_stock_alert: 20.0, is_quick_item: true, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000005', store_id: MAIN_STORE_ID, category_id: cat4, barcode: '894110010005', name_bn: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম', name_en: 'Ispahani Mirzapore Tea 400g', unit: 'packet', cost_price: 215.0, selling_price: 240.0, stock_quantity: 40.0, min_stock_alert: 10.0, is_quick_item: true, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000006', store_id: MAIN_STORE_ID, category_id: cat2, barcode: '894110010006', name_bn: 'রাঁধুনী হলুদ গুঁড়া ২০০ গ্রাম', name_en: 'Radhuni Turmeric Powder 200g', unit: 'packet', cost_price: 82.0, selling_price: 95.0, stock_quantity: 65.0, min_stock_alert: 15.0, is_quick_item: false, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000007', store_id: MAIN_STORE_ID, category_id: cat5, barcode: '894110010007', name_bn: 'লাক্স বিউটি সোপ ১০০ গ্রাম', name_en: 'Lux Soap 100g', unit: 'piece', cost_price: 52.0, selling_price: 60.0, stock_quantity: 90.0, min_stock_alert: 20.0, is_quick_item: false, created_at: now, updated_at: now },
          { id: 'p0000000-0000-0000-0000-000000000008', store_id: MAIN_STORE_ID, category_id: cat3, barcode: '894110010008', name_bn: 'অলিম্পিক এনার্জি প্লাস বিস্কুট', name_en: 'Olympic Energy Plus Biscuit', unit: 'packet', cost_price: 28.0, selling_price: 35.0, stock_quantity: 150.0, min_stock_alert: 25.0, is_quick_item: true, created_at: now, updated_at: now },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 8 Grocery Products seeded.');

      // 5. Customers
      addLog('[5/7] Seeding Customer Credit Directory...');
      const cust1 = 'd0000000-0000-0000-0000-000000000001';
      const cust2 = 'd0000000-0000-0000-0000-000000000002';
      const cust3 = 'd0000000-0000-0000-0000-000000000003';

      await supabase.from('customers').upsert(
        [
          { id: cust1, store_id: MAIN_STORE_ID, name: 'হাজী মোঃ মোশাররফ হোসেন', phone: '01711001122', address: 'বাড়ি ১২, রোড ৪, গুলশান-২', current_balance: 1850.0, credit_limit: 10000.0, is_active: true, created_at: now, updated_at: now },
          { id: cust2, store_id: MAIN_STORE_ID, name: 'রফিকুল ইসলাম (মাস্টার সাব)', phone: '01812002233', address: 'ফ্ল্যাট ৩বি, গুলশান এভিনিউ', current_balance: 3400.0, credit_limit: 8000.0, is_active: true, created_at: now, updated_at: now },
          { id: cust3, store_id: MAIN_STORE_ID, name: 'আব্দুল করিম মিয়া', phone: '01913003344', address: 'কালাচাঁদপুর বাজার রোড', current_balance: 920.0, credit_limit: 5000.0, is_active: true, created_at: now, updated_at: now },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 3 Customers with opening balances seeded.');

      // 6. Ledger Dues
      addLog('[6/7] Seeding Credit Ledger Dues...');
      await supabase.from('baki_transactions').upsert(
        [
          { id: 'b0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, customer_id: cust1, type: 'DEBIT', amount: 1850.0, payment_method: 'CASH', note: 'পূর্বের খাতার প্রারম্ভিক বাকি', customer_name: 'হাজী মোঃ মোশাররফ হোসেন', customer_phone: '01711001122', created_at: now },
          { id: 'b0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, customer_id: cust2, type: 'DEBIT', amount: 3400.0, payment_method: 'CASH', note: 'চাল ও তেলের মাসিক বাকি', customer_name: 'রফিকুল ইসলাম (মাস্টার সাব)', customer_phone: '01812002233', created_at: now },
          { id: 'b0000000-0000-0000-0000-000000000003', store_id: MAIN_STORE_ID, customer_id: cust3, type: 'DEBIT', amount: 920.0, payment_method: 'CASH', note: 'মুদি মালামাল বাকি', customer_name: 'আব্দুল করিম মিয়া', customer_phone: '01913003344', created_at: now },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ 3 Ledger Transactions recorded.');

      // 7. Chalans & Expenses
      addLog('[7/7] Seeding Chalans & Daily Overheads...');
      await supabase.from('supplier_chalans').upsert(
        [
          {
            id: 'e0000000-0000-0000-0000-000000000001',
            store_id: MAIN_STORE_ID,
            chalan_no: 'CH-2026-0891',
            supplier_name: 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ (ফ্রেশ তেল ও চিনি)',
            supplier_phone: '01713000000',
            chalan_date: now.split('T')[0],
            total_amount: 48500.0,
            paid_amount: 40000.0,
            due_amount: 8500.0,
            payment_method: 'BANK',
            items_count: 2,
            notes: 'তেল ও চিনির মূল সরবরাহ চালান',
            created_at: now,
          },
        ],
        { onConflict: 'id' }
      );

      await supabase.from('expenses').upsert(
        [
          { id: 'x0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, category: 'দোকানের চা-নাস্তা', amount: 150.0, expense_date: now.split('T')[0], note: 'কাস্টমার আপ্যায়ন', created_at: now },
          { id: 'x0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, category: 'পরিবহন খরচ (ভ্যান/রিকশা)', amount: 350.0, expense_date: now.split('T')[0], note: 'কারওয়ান বাজার থেকে মাল আনা', created_at: now },
        ],
        { onConflict: 'id' }
      );
      addLog('✓ Supplier Chalan & Expenses recorded.');

      addLog('\n🎉 অভিনন্দন! Supabase ক্লাউড ডাটাবেজে সম্পূর্ণ ফ্রেশ স্যাম্পল ডাটা সফলভাবে সেটআপ হয়েছে।');
      addLog('লগইন তথ্য:');
      addLog('👑 Super Admin: 01700000000 (পাসওয়ার্ড: admin123)');
      addLog('🏪 Shop Owner: 01711998877 (পাসওয়ার্ড: pass1234)');
      setStatus('SUCCESS');
    } catch (err: unknown) {
      const e = err as Error;
      addLog(`\n❌ Seeding Error: ${e.message}`);
      setStatus('FAILED');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-3xl w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            ডাটাবেজ সিডার ও স্যাম্পল ডাটা সেটআপ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            সুপার অ্যাডমিন, অনুমোদিত দোকান, কর্মী প্রোফাইল, ক্যাটাগরি, প্রোডাক্ট, কাস্টমার খাতা ও চালান দিয়ে ডাটাবেজ পূর্ণ করুন
          </p>
        </div>

        {/* Credentials Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 bg-slate-950/70 border border-slate-700/70 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
              👑 সুপার অ্যাডমিন অ্যাকাউন্ট (Super Admin)
            </span>
            <p className="text-xs text-slate-300 font-mono">মোবাইল: <strong className="text-white">01700000000</strong></p>
            <p className="text-xs text-slate-300 font-mono">পাসওয়ার্ড: <strong className="text-emerald-400">admin123</strong></p>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-700/70 rounded-2xl">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              🏪 দোকান মালিক অ্যাকাউন্ট (Shop Owner)
            </span>
            <p className="text-xs text-slate-300 font-mono">মোবাইল: <strong className="text-white">01711998877</strong></p>
            <p className="text-xs text-slate-300 font-mono">পাসওয়ার্ড: <strong className="text-emerald-400">pass1234</strong></p>
          </div>
        </div>

        {/* Connection Badge */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-700/60 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Supabase Project:</span>
            <span className="text-emerald-400 font-bold">sfhsrrmwckwefjtxjoij</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Database className="w-3.5 h-3.5" />
            <span>Direct REST Client</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6 space-y-3">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>ডাটাবেজ সিড হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>সম্পূর্ণ ডাটাবেজ সিড করুন (Seed All Sample Data)</span>
              </>
            )}
          </button>
          <div className="flex gap-2">
            <a
              href="/CleanDatabasewithtablesandreuploadschema.php"
              className="flex-1 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-center text-xs font-semibold transition-all"
            >
              ডাটাবেজ ক্লিন করুন (Wipe DB)
            </a>
            <a
              href="/"
              className="flex-1 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-emerald-400 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মূল অ্যাপ খুলুন</span>
            </a>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>SEEDING_PROGRESS_CONSOLE:</span>
            <span
              className={
                status === 'RUNNING'
                  ? 'text-amber-400 font-bold animate-pulse'
                  : status === 'SUCCESS'
                  ? 'text-emerald-400 font-bold flex items-center gap-1'
                  : status === 'FAILED'
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-500'
              }
            >
              {status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status}
            </span>
          </div>
          <pre className="text-[11px] sm:text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
            {logs.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
};
