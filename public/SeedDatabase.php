<?php
/**
 * ==============================================================================
 * MudiDokan (আমার দোকান) - Database Seeder & Mock Data Initializer
 * Dual-Mode Execution: Web Browser GUI & CLI / PHP Backend
 * URL: https://mudi-dokan-2-00.vercel.app/SeedDatabase.php
 * ==============================================================================
 */

$SUPABASE_URL = "https://sfhsrrmwckwefjtxjoij.supabase.co";
$SUPABASE_KEY = "sb_publishable_C9LiVCRDDwHEpwC7teg5LQ_3qw41Jue";

// Master Demo Store ID and Super Admin Credentials
$MAIN_STORE_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
$STORE_2_ID    = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22";
$STORE_3_ID    = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33";

?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amar Dokan - Seed Database with Real Data</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Hind Siliguri', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-4 sm:p-8 flex flex-col justify-center items-center">
    <div class="max-w-3xl w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white">
                ডাটাবেজ সিডার ও স্যাম্পল ডাটা সেটআপ
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
                সুপার অ্যাডমিন, অনুমোদিত দোকান, কর্মী প্রোফাইল, ক্যাটাগরি, প্রোডাক্ট, কাস্টমার খাতা ও চালান দিয়ে ডাটাবেজ পূর্ণ করুন
            </p>
        </div>

        <!-- Credentials Info Box -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div class="p-3.5 bg-slate-950/70 border border-slate-700/70 rounded-2xl">
                <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    👑 সুপার অ্যাডমিন অ্যাকাউন্ট (Super Admin)
                </span>
                <p class="text-xs text-slate-300 font-mono">মোবাইল: <strong class="text-white">01700000000</strong></p>
                <p class="text-xs text-slate-300 font-mono">পাসওয়ার্ড: <strong class="text-emerald-400">admin123</strong></p>
            </div>
            <div class="p-3.5 bg-slate-950/70 border border-slate-700/70 rounded-2xl">
                <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    🏪 দোকান মালিক অ্যাকাউন্ট (Shop Owner)
                </span>
                <p class="text-xs text-slate-300 font-mono">মোবাইল: <strong class="text-white">01711998877</strong></p>
                <p class="text-xs text-slate-300 font-mono">পাসওয়ার্ড: <strong class="text-emerald-400">pass1234</strong></p>
            </div>
        </div>

        <!-- Action Button -->
        <div class="mb-6 space-y-3">
            <button
                id="btn-seed-db"
                onclick="executeDatabaseSeed()"
                class="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>সম্পূর্ণ ডাটাবেজ সিড করুন (Seed All Sample Data)</span>
            </button>
            <div class="flex gap-2">
                <a
                    href="./CleanDatabasewithtablesandreuploadschema.php"
                    class="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-center text-xs font-semibold transition-all"
                >
                    ডাটাবেজ ক্লিন করুন (Wipe DB)
                </a>
                <a
                    href="/"
                    class="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-emerald-400 text-center text-xs font-bold transition-all"
                >
                    আমার দোকান অ্যাপ খুলুন (Launch App)
                </a>
            </div>
        </div>

        <!-- Terminal Output -->
        <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                <span>SEEDING_PROGRESS_CONSOLE:</span>
                <span id="status-badge" class="text-slate-500">IDLE</span>
            </div>
            <pre id="log-output" class="text-[11px] sm:text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">সিড প্রক্রিয়া শুরু করার জন্য উপরের বাটনে ক্লিক করুন...</pre>
        </div>
    </div>

    <script>
        const SUPABASE_URL = "<?= $SUPABASE_URL ?>";
        const SUPABASE_KEY = "<?= $SUPABASE_KEY ?>";
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // SHA-256 helper for client secrets
        async function sha256(str) {
            const buffer = new TextEncoder().encode(str);
            const hash = await crypto.subtle.digest('SHA-256', buffer);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function hashSecret(phone, secret) {
            return await sha256(`mudidokan:${phone.replace(/\D/g, '')}:${secret}`);
        }

        function log(msg) {
            const el = document.getElementById('log-output');
            el.textContent += "\n" + msg;
            el.scrollTop = el.scrollHeight;
        }

        const MAIN_STORE_ID = "<?= $MAIN_STORE_ID ?>";
        const STORE_2_ID    = "<?= $STORE_2_ID ?>";
        const STORE_3_ID    = "<?= $STORE_3_ID ?>";

        async function executeDatabaseSeed() {
            const btn = document.getElementById('btn-seed-db');
            const badge = document.getElementById('status-badge');
            const logEl = document.getElementById('log-output');

            btn.disabled = true;
            badge.textContent = "SEEDING...";
            badge.className = "text-amber-400 font-bold animate-pulse";
            logEl.textContent = `[${new Date().toLocaleTimeString()}] সিডিং প্রসেস শুরু হয়েছে...\n`;

            try {
                const now = new Date().toISOString();

                // 1. Seed Stores
                log(`[1/7] Seeding Retail Stores...`);
                const stores = [
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
                        updated_at: now
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
                        updated_at: now
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
                        updated_at: now
                    }
                ];

                await supabase.from('stores').upsert(stores, { onConflict: 'id' });
                log(`✓ 3 Stores successfully upserted.`);

                // 2. Seed Profiles
                log(`[2/7] Seeding User Profiles & Roles...`);
                const adminHash = await hashSecret('01700000000', 'admin123');
                const ownerHash = await hashSecret('01711998877', 'pass1234');
                const mgrHash   = await hashSecret('01811223344', 'pass1234');
                const cashHash  = await hashSecret('01911223344', 'pass1234');

                const profiles = [
                    {
                        id: 'f0000000-0000-0000-0000-000000000001',
                        store_id: MAIN_STORE_ID,
                        full_name: 'সুপার অ্যাডমিন (Super Admin)',
                        phone: '01700000000',
                        role: 'super_admin',
                        password_hash: adminHash,
                        is_active: true,
                        created_at: now,
                        updated_at: now
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
                        updated_at: now
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
                        updated_at: now
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
                        updated_at: now
                    }
                ];

                await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
                log(`✓ 4 Profiles successfully created (Super Admin, Owner, Manager, Cashier).`);

                // 3. Seed Categories
                log(`[3/7] Seeding Product Categories...`);
                const cat1 = 'c0000000-0000-0000-0000-000000000001';
                const cat2 = 'c0000000-0000-0000-0000-000000000002';
                const cat3 = 'c0000000-0000-0000-0000-000000000003';
                const cat4 = 'c0000000-0000-0000-0000-000000000004';
                const cat5 = 'c0000000-0000-0000-0000-000000000005';

                const categories = [
                    { id: cat1, store_id: MAIN_STORE_ID, name_bn: 'চাল, ডাল ও তেল', name_en: 'Grains & Oil', icon: 'wheat', created_at: now },
                    { id: cat2, store_id: MAIN_STORE_ID, name_bn: 'মসলা ও নিত্যপ্রয়োজনীয়', name_en: 'Spices & Essentials', icon: 'sparkles', created_at: now },
                    { id: cat3, store_id: MAIN_STORE_ID, name_bn: 'বিস্কুট ও স্ন্যাকস', name_en: 'Snacks & Biscuits', icon: 'cookie', created_at: now },
                    { id: cat4, store_id: MAIN_STORE_ID, name_bn: 'চা, চিনি ও দুগ্ধজাত', name_en: 'Tea, Sugar & Dairy', icon: 'coffee', created_at: now },
                    { id: cat5, store_id: MAIN_STORE_ID, name_bn: 'টয়লেট্রিজ ও সাবান', name_en: 'Toiletries', icon: 'shield-check', created_at: now },
                ];

                await supabase.from('categories').upsert(categories, { onConflict: 'id' });
                log(`✓ 5 Grocery Categories created.`);

                // 4. Seed Products
                log(`[4/7] Seeding Retail Products with Real Stock...`);
                const products = [
                    { id: 'p0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010001', name_bn: 'নাজিরশাইল চাল (মিনিকেট)', name_en: 'Nazirshail Rice', unit: 'kg', cost_price: 72.00, selling_price: 80.00, stock_quantity: 450.00, min_stock_alert: 50.00, is_quick_item: true, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010002', name_bn: 'দেশি মসুর ডাল', name_en: 'Red Lentils', unit: 'kg', cost_price: 125.00, selling_price: 140.00, stock_quantity: 85.00, min_stock_alert: 20.00, is_quick_item: true, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000003', store_id: MAIN_STORE_ID, category_id: cat1, barcode: '894110010003', name_bn: 'রূপচাঁদা সয়াবিন তেল ১ লিটার', name_en: 'Rupchanda Soybean Oil 1L', unit: 'litre', cost_price: 175.00, selling_price: 188.00, stock_quantity: 120.00, min_stock_alert: 15.00, is_quick_item: true, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000004', store_id: MAIN_STORE_ID, category_id: cat4, barcode: '894110010004', name_bn: 'তীর পরিশোধিত সাদা চিনি ১ কেজি', name_en: 'Teer Refined Sugar 1kg', unit: 'kg', cost_price: 130.00, selling_price: 140.00, stock_quantity: 110.00, min_stock_alert: 20.00, is_quick_item: true, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000005', store_id: MAIN_STORE_ID, category_id: cat4, barcode: '894110010005', name_bn: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম', name_en: 'Ispahani Mirzapore Tea 400g', unit: 'packet', cost_price: 215.00, selling_price: 240.00, stock_quantity: 40.00, min_stock_alert: 10.00, is_quick_item: true, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000006', store_id: MAIN_STORE_ID, category_id: cat2, barcode: '894110010006', name_bn: 'রাঁধুনী হলুদ গুঁড়া ২০০ গ্রাম', name_en: 'Radhuni Turmeric Powder 200g', unit: 'packet', cost_price: 82.00, selling_price: 95.00, stock_quantity: 65.00, min_stock_alert: 15.00, is_quick_item: false, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000007', store_id: MAIN_STORE_ID, category_id: cat5, barcode: '894110010007', name_bn: 'লাক্স বিউটি সোপ ১০০ গ্রাম', name_en: 'Lux Soap 100g', unit: 'piece', cost_price: 52.00, selling_price: 60.00, stock_quantity: 90.00, min_stock_alert: 20.00, is_quick_item: false, created_at: now, updated_at: now },
                    { id: 'p0000000-0000-0000-0000-000000000008', store_id: MAIN_STORE_ID, category_id: cat3, barcode: '894110010008', name_bn: 'অলিম্পিক এনার্জি প্লাস বিস্কুট', name_en: 'Olympic Energy Plus Biscuit', unit: 'packet', cost_price: 28.00, selling_price: 35.00, stock_quantity: 150.00, min_stock_alert: 25.00, is_quick_item: true, created_at: now, updated_at: now },
                ];

                await supabase.from('products').upsert(products, { onConflict: 'id' });
                log(`✓ 8 Standard Grocery Products seeded with barcodes & stock.`);

                // 5. Seed Customers
                log(`[5/7] Seeding Customer Credit Directory (বাকির খাতা)...`);
                const cust1 = 'd0000000-0000-0000-0000-000000000001';
                const cust2 = 'd0000000-0000-0000-0000-000000000002';
                const cust3 = 'd0000000-0000-0000-0000-000000000003';

                const customers = [
                    { id: cust1, store_id: MAIN_STORE_ID, name: 'হাজী মোঃ মোশাররফ হোসেন', phone: '01711001122', address: 'বাড়ি ১২, রোড ৪, গুলশান-২', current_balance: 1850.00, credit_limit: 10000.00, is_active: true, created_at: now, updated_at: now },
                    { id: cust2, store_id: MAIN_STORE_ID, name: 'রফিকুল ইসলাম (মাস্টার সাব)', phone: '01812002233', address: 'ফ্ল্যাট ৩বি, গুলশান এভিনিউ', current_balance: 3400.00, credit_limit: 8000.00, is_active: true, created_at: now, updated_at: now },
                    { id: cust3, store_id: MAIN_STORE_ID, name: 'আব্দুল করিম মিয়া', phone: '01913003344', address: 'কালাচাঁদপুর বাজার রোড', current_balance: 920.00, credit_limit: 5000.00, is_active: true, created_at: now, updated_at: now }
                ];

                await supabase.from('customers').upsert(customers, { onConflict: 'id' });
                log(`✓ 3 Customers with opening balances seeded.`);

                // 6. Seed Dues Ledger Transactions
                log(`[6/7] Seeding Credit Ledger Dues & Transactions...`);
                const bakiTxs = [
                    { id: 'b0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, customer_id: cust1, type: 'DEBIT', amount: 1850.00, payment_method: 'CASH', note: 'পূর্বের খাতার প্রারম্ভিক বাকি', customer_name: 'হাজী মোঃ মোশাররফ হোসেন', customer_phone: '01711001122', created_at: now },
                    { id: 'b0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, customer_id: cust2, type: 'DEBIT', amount: 3400.00, payment_method: 'CASH', note: 'চাল ও তেলের মাসিক বাকি', customer_name: 'রফিকুল ইসলাম (মাস্টার সাব)', customer_phone: '01812002233', created_at: now },
                    { id: 'b0000000-0000-0000-0000-000000000003', store_id: MAIN_STORE_ID, customer_id: cust3, type: 'DEBIT', amount: 920.00, payment_method: 'CASH', note: 'মুদি মালামাল বাকি', customer_name: 'আব্দুল করিম মিয়া', customer_phone: '01913003344', created_at: now }
                ];

                await supabase.from('baki_transactions').upsert(bakiTxs, { onConflict: 'id' });
                log(`✓ 3 Ledger Transactions recorded.`);

                // 7. Seed Supplier Chalans & Expenses
                log(`[7/7] Seeding Company Chalans & Daily Overheads...`);
                const chalanId = 'e0000000-0000-0000-0000-000000000001';
                const chalan = {
                    id: chalanId,
                    store_id: MAIN_STORE_ID,
                    chalan_no: 'CH-2026-0891',
                    supplier_name: 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ (ফ্রেশ তেল ও চিনি)',
                    supplier_phone: '01713000000',
                    chalan_date: now.split('T')[0],
                    total_amount: 48500.00,
                    paid_amount: 40000.00,
                    due_amount: 8500.00,
                    payment_method: 'BANK',
                    items_count: 2,
                    notes: 'তেল ও চিনির মূল সরবরাহ চালান',
                    created_at: now
                };
                await supabase.from('supplier_chalans').upsert([chalan], { onConflict: 'id' });

                const expenses = [
                    { id: 'x0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, category: 'দোকানের চা-নাস্তা', amount: 150.00, expense_date: now.split('T')[0], note: 'কাস্টমার আপ্যায়ন', created_at: now },
                    { id: 'x0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, category: 'পরিবহন খরচ (ভ্যান/রিকশা)', amount: 350.00, expense_date: now.split('T')[0], note: 'কারওয়ান বাজার থেকে মাল আনা', created_at: now }
                ];
                await supabase.from('expenses').upsert(expenses, { onConflict: 'id' });
                log(`✓ Supplier Chalan & Daily Expenses recorded.`);

                log(`\n🎉 অভিনন্দন! Supabase ক্লাউড ডাটাবেজে সম্পূর্ণ ফ্রেশ স্যাম্পল ডাটা সফলভাবে সেটআপ হয়েছে।`);
                log(`এখন আপনি সরাসরি https://mudi-dokan-2-00.vercel.app এ গিয়ে 01700000000 (admin123) অথবা 01711998877 (pass1234) দিয়ে লগইন করতে পারেন।`);

                badge.textContent = "SUCCESS";
                badge.className = "text-emerald-400 font-bold";
            } catch (err) {
                log(`\n❌ Seeding Error: ${err.message}`);
                badge.textContent = "FAILED";
                badge.className = "text-rose-400 font-bold";
            } finally {
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
