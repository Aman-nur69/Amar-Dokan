import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sfhsrrmwckwefjtxjoij.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C9LiVCRDDwHEpwC7teg5LQ_3qw41Jue';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function main() {
  console.log('🌱 Seeding sample retail data into Supabase Cloud Database...');
  console.log(`Target: ${SUPABASE_URL}\n`);
  const now = new Date().toISOString();

  // 1. Stores
  console.log('1. Seeding Stores...');
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

  // 2. Profiles
  console.log('2. Seeding Profiles & Passwords...');
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

  // 3. Categories
  console.log('3. Seeding Categories...');
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

  // 4. Products
  console.log('4. Seeding Products...');
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

  // 5. Customers
  console.log('5. Seeding Customers...');
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

  // 6. Ledger dues
  console.log('6. Seeding Ledger Dues...');
  await supabase.from('baki_transactions').upsert(
    [
      { id: 'b0000000-0000-0000-0000-000000000001', store_id: MAIN_STORE_ID, customer_id: cust1, type: 'DEBIT', amount: 1850.0, payment_method: 'CASH', note: 'পূর্বের খাতার প্রারম্ভিক বাকি', customer_name: 'হাজী মোঃ মোশাররফ হোসেন', customer_phone: '01711001122', created_at: now },
      { id: 'b0000000-0000-0000-0000-000000000002', store_id: MAIN_STORE_ID, customer_id: cust2, type: 'DEBIT', amount: 3400.0, payment_method: 'CASH', note: 'চাল ও তেলের মাসিক বাকি', customer_name: 'রফিকুল ইসলাম (মাস্টার সাব)', customer_phone: '01812002233', created_at: now },
      { id: 'b0000000-0000-0000-0000-000000000003', store_id: MAIN_STORE_ID, customer_id: cust3, type: 'DEBIT', amount: 920.0, payment_method: 'CASH', note: 'মুদি মালামাল বাকি', customer_name: 'আব্দুল করিম মিয়া', customer_phone: '01913003344', created_at: now },
    ],
    { onConflict: 'id' }
  );

  // 7. Supplier Chalans & Expenses
  console.log('7. Seeding Chalans & Expenses...');
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

  console.log('\n🎉 Seeding complete! Log in with:');
  console.log('Super Admin: 01700000000 / admin123');
  console.log('Shop Owner:  01711998877 / pass1234');
}

main().catch(console.error);
