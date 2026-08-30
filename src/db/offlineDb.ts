// ==============================================================================
// MudiDokan (মুদিদোকান) Offline-First IndexedDB Engine (Dexie.js)
// Local ACID Persistence & Mutation Sync Queue
// ==============================================================================

import Dexie, { Table } from 'dexie';
import {
  Store,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  BakiTransaction,
  Expense,
  SyncQueueItem,
  SupplierChalan,
  ChalanItem,
  SupplierPayment,
} from '../@types/database.types';

export class MudiDokanDexieDb extends Dexie {
  stores!: Table<Store, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  baki_transactions!: Table<BakiTransaction, string>;
  expenses!: Table<Expense, string>;
  supplier_chalans!: Table<SupplierChalan, string>;
  chalan_items!: Table<ChalanItem, string>;
  supplier_payments!: Table<SupplierPayment, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super('MudiDokanOfflineDB');
    this.version(3).stores({
      stores: 'id',
      categories: 'id, store_id',
      products: 'id, store_id, barcode, category_id, is_quick_item, name_bn, name_en',
      customers: 'id, store_id, phone, name',
      sales: 'id, store_id, invoice_no, customer_id, created_at',
      sale_items: 'id, store_id, sale_id, product_id',
      baki_transactions: 'id, store_id, customer_id, sale_id, type, created_at',
      expenses: 'id, store_id, expense_date, category',
      supplier_chalans: 'id, store_id, chalan_no, supplier_name, chalan_date, created_at',
      chalan_items: 'id, store_id, chalan_id, product_id',
      supplier_payments: 'id, store_id, chalan_id, payment_date, created_at',
      sync_queue: 'id, status, table_name, created_at',
    });
  }
}

export const db = new MudiDokanDexieDb();

// Default Store Profile
export const DEFAULT_STORE: Store = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'ভাই ভাই স্টোর (Bhai Bhai Store)',
  proprietor: 'মোঃ রফিকুল ইসলাম',
  phone: '01711998877',
  address: 'দোকান নং ১২, মীরপুর-১০ গোলচত্বর বাজার, ঢাকা',
  bkash_number: '01711998877',
  nagad_number: '01811998877',
  currency_symbol: '৳',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Initial Seed Data for Instant Standalone / Offline Execution
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'b1111111-1111-1111-1111-111111111111', store_id: DEFAULT_STORE.id, name_bn: 'নিত্যপ্রয়োজনীয়', name_en: 'Daily Essentials', icon: 'shopping-bag', created_at: new Date().toISOString() },
  { id: 'b2222222-2222-2222-2222-222222222222', store_id: DEFAULT_STORE.id, name_bn: 'তেল ও ঘি', name_en: 'Oil & Ghee', icon: 'droplet', created_at: new Date().toISOString() },
  { id: 'b3333333-3333-3333-3333-333333333333', store_id: DEFAULT_STORE.id, name_bn: 'চাল ও ডাল', name_en: 'Rice & Pulses', icon: 'wheat', created_at: new Date().toISOString() },
  { id: 'b4444444-4444-4444-4444-444444444444', store_id: DEFAULT_STORE.id, name_bn: 'মশলা ও আদা-রসুন', name_en: 'Spices', icon: 'sparkles', created_at: new Date().toISOString() },
  { id: 'b5555555-5555-5555-5555-555555555555', store_id: DEFAULT_STORE.id, name_bn: 'স্ন্যাকস ও বিস্কুট', name_en: 'Snacks & Bakery', icon: 'cookie', created_at: new Date().toISOString() },
  { id: 'b6666666-6666-6666-6666-666666666666', store_id: DEFAULT_STORE.id, name_bn: 'টয়লেট্রিজ ও সাবান', name_en: 'Toiletries', icon: 'shield-check', created_at: new Date().toISOString() },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    category_id: 'b2222222-2222-2222-2222-222222222222',
    name_bn: 'খোলা সয়াবিন তেল',
    name_en: 'Loose Soybean Oil',
    unit: 'litre',
    cost_price: 160.00,
    selling_price: 175.00,
    stock_quantity: 120.0,
    min_stock_alert: 20.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    category_id: 'b1111111-1111-1111-1111-111111111111',
    name_bn: 'দেশি সাদা চিনি',
    name_en: 'White Sugar',
    unit: 'kg',
    cost_price: 125.00,
    selling_price: 138.00,
    stock_quantity: 85.5,
    min_stock_alert: 15.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    store_id: DEFAULT_STORE.id,
    category_id: 'b3333333-3333-3333-3333-333333333333',
    name_bn: 'মসুর ডাল (চিকন)',
    name_en: 'Red Lentil Fine',
    unit: 'kg',
    cost_price: 130.00,
    selling_price: 145.00,
    stock_quantity: 65.0,
    min_stock_alert: 10.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    store_id: DEFAULT_STORE.id,
    category_id: 'b1111111-1111-1111-1111-111111111111',
    name_bn: 'ফার্মের লাল ডিম (১ হালি)',
    name_en: 'Farm Red Eggs 4pcs',
    unit: 'hali',
    cost_price: 42.00,
    selling_price: 48.00,
    stock_quantity: 150.0,
    min_stock_alert: 25.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    store_id: DEFAULT_STORE.id,
    category_id: 'b1111111-1111-1111-1111-111111111111',
    name_bn: 'নতুন গোল আলু',
    name_en: 'Fresh Potato',
    unit: 'kg',
    cost_price: 32.00,
    selling_price: 40.00,
    stock_quantity: 250.0,
    min_stock_alert: 40.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    store_id: DEFAULT_STORE.id,
    category_id: 'b1111111-1111-1111-1111-111111111111',
    name_bn: 'দেশি পেঁয়াজ',
    name_en: 'Local Onion',
    unit: 'kg',
    cost_price: 60.00,
    selling_price: 75.00,
    stock_quantity: 95.0,
    min_stock_alert: 20.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    store_id: DEFAULT_STORE.id,
    category_id: 'b3333333-3333-3333-3333-333333333333',
    name_bn: 'মিনিকেট চাল (খোলা)',
    name_en: 'Miniket Rice Loose',
    unit: 'kg',
    cost_price: 68.00,
    selling_price: 76.00,
    stock_quantity: 320.0,
    min_stock_alert: 50.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c8888888-8888-8888-8888-888888888888',
    store_id: DEFAULT_STORE.id,
    category_id: 'b4444444-4444-4444-4444-444444444444',
    name_bn: 'দেশি রসুন',
    name_en: 'Local Garlic',
    unit: 'kg',
    cost_price: 180.00,
    selling_price: 210.00,
    stock_quantity: 30.0,
    min_stock_alert: 8.0,
    is_quick_item: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c9999999-9999-9999-9999-999999999999',
    store_id: DEFAULT_STORE.id,
    category_id: 'b2222222-2222-2222-2222-222222222222',
    barcode: '8941100501123',
    name_bn: 'রূপচাঁদা সয়াবিন তেল (২ লিটার)',
    name_en: 'Rupchanda Soybean Oil 2L',
    unit: 'packet',
    cost_price: 350.00,
    selling_price: 375.00,
    stock_quantity: 18.0,
    min_stock_alert: 5.0,
    is_quick_item: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    store_id: DEFAULT_STORE.id,
    category_id: 'b5555555-5555-5555-5555-555555555555',
    barcode: '8941100332211',
    name_bn: 'ম্যাগি ২-মিনিট নুডুলস (৮ প্যাক)',
    name_en: 'Maggi 2-Min Noodles 8 Pack',
    unit: 'packet',
    cost_price: 135.00,
    selling_price: 150.00,
    stock_quantity: 4.0, // Low stock simulation
    min_stock_alert: 8.0,
    is_quick_item: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    store_id: DEFAULT_STORE.id,
    category_id: 'b6666666-6666-6666-6666-666666666666',
    barcode: '8941100778899',
    name_bn: 'লাইফবয় টোটাল সাবান (১০০ গ্রাম)',
    name_en: 'Lifebuoy Total Soap 100g',
    unit: 'piece',
    cost_price: 42.00,
    selling_price: 50.00,
    stock_quantity: 0.0, // Out of stock simulation
    min_stock_alert: 10.0,
    is_quick_item: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    store_id: DEFAULT_STORE.id,
    category_id: 'b1111111-1111-1111-1111-111111111111',
    barcode: '8941100445566',
    name_bn: 'তীর আটা (২ কেজি প্যাকেট)',
    name_en: 'Teer Atta 2kg Packet',
    unit: 'packet',
    cost_price: 115.00,
    selling_price: 128.00,
    stock_quantity: 35.0,
    min_stock_alert: 10.0,
    is_quick_item: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    name: 'হাজী শামসুল হক (বাড়িয়ালা)',
    phone: '01819234567',
    address: 'বাড়ি নং ৪২, রোড ৭, মীরপুর ১০',
    current_balance: 2450.00, // Due
    credit_limit: 10000.00,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    name: 'মাওলানা আব্দুর রশিদ',
    phone: '01712345678',
    address: 'বায়তুল আমান মসজিদ গলি',
    current_balance: 850.00, // Due
    credit_limit: 5000.00,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    store_id: DEFAULT_STORE.id,
    name: 'মোঃ কবির হোসেন (রিকশাচালক)',
    phone: '01918765432',
    address: 'পূর্ব বস্তি, মিরপুর ১০',
    current_balance: 320.00, // Due
    credit_limit: 1500.00,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    store_id: DEFAULT_STORE.id,
    name: 'সুমন আহমেদ (চাকরিজীবী)',
    phone: '01611223344',
    address: 'ফ্ল্যাট ৩বি, মীম টাওয়ার',
    current_balance: 0.00, // Zero balance
    credit_limit: 8000.00,
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd5555555-5555-5555-5555-555555555555',
    store_id: DEFAULT_STORE.id,
    name: 'নাসরীন আক্তার (গৃহিণী)',
    phone: '01511998844',
    address: 'হাউজিং স্টাফ কোয়ার্টার',
    current_balance: 1420.00, // Due
    credit_limit: 5000.00,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    category: 'দোকানের চা-নাস্তা',
    amount: 120.00,
    note: 'গ্রাহক ও কর্মীদের চা বিস্কুট',
    expense_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    category: 'পরিবহন খরচ (ভ্যান)',
    amount: 250.00,
    note: 'কারওয়ান বাজার থেকে মাল আনা',
    expense_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_BAKI_TRANSACTIONS: BakiTransaction[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    customer_id: 'd1111111-1111-1111-1111-111111111111',
    type: 'DEBIT',
    amount: 3450.00,
    payment_method: 'CASH',
    note: 'মাসের শুরুর বড় সওদা',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    customer_id: 'd1111111-1111-1111-1111-111111111111',
    type: 'CREDIT',
    amount: 1000.00,
    payment_method: 'BKASH',
    note: 'বিকাশে আংশিক বকেয়া পরিশোধ',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    store_id: DEFAULT_STORE.id,
    customer_id: 'd2222222-2222-2222-2222-222222222222',
    type: 'DEBIT',
    amount: 850.00,
    payment_method: 'CASH',
    note: 'তেল ও ডাল বাকিতে ক্রয়',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const INITIAL_CHALANS: SupplierChalan[] = [
  {
    id: 'ch-1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    chalan_no: 'CH-FRESH-4921',
    supplier_name: 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ (ফ্রেশ ডিলার)',
    supplier_phone: '01712001122',
    chalan_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    total_amount: 18500.00,
    paid_amount: 15000.00,
    due_amount: 3500.00,
    payment_method: 'CASH',
    items_count: 2,
    notes: 'সকালে ডেলিভারি ভ্যানে চিনি ও ডাল নামানো হয়েছে',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ch-2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    chalan_no: 'CH-TEER-8810',
    supplier_name: 'সিটি গ্রুপ (তীর ডিস্ট্রিবিউটর)',
    supplier_phone: '01819334455',
    chalan_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    total_amount: 24200.00,
    paid_amount: 24200.00,
    due_amount: 0.00,
    payment_method: 'BKASH',
    items_count: 2,
    notes: 'তীর সয়াবিন তেল ও আটার চালান সম্পূর্ণ পরিশোধ',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ch-3333333-3333-3333-3333-333333333333',
    store_id: DEFAULT_STORE.id,
    chalan_no: 'CH-AROT-104',
    supplier_name: 'হাজী কাশেম বাণিজ্যালয় (কারওয়ান বাজার চালের আড়ত)',
    supplier_phone: '01911445566',
    chalan_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    total_amount: 34000.00,
    paid_amount: 20000.00,
    due_amount: 14000.00,
    payment_method: 'CASH',
    items_count: 1,
    notes: 'মিনিকেট চাল ১০ বস্তা (বাকি আগামী শনিবার দেওয়া হবে)',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const INITIAL_CHALAN_ITEMS: ChalanItem[] = [
  {
    id: 'ci-1111111-1111-1111-1111-111111111111',
    store_id: DEFAULT_STORE.id,
    chalan_id: 'ch-1111111-1111-1111-1111-111111111111',
    product_id: 'c2222222-2222-2222-2222-222222222222',
    product_name_bn: 'দেশি সাদা চিনি',
    quantity: 100,
    unit: 'kg',
    unit_cost_price: 125.00,
    unit_selling_price: 138.00,
    subtotal: 12500.00,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ci-2222222-2222-2222-2222-222222222222',
    store_id: DEFAULT_STORE.id,
    chalan_id: 'ch-1111111-1111-1111-1111-111111111111',
    product_id: 'c3333333-3333-3333-3333-333333333333',
    product_name_bn: 'মসুর ডাল (চিকন)',
    quantity: 40,
    unit: 'kg',
    unit_cost_price: 150.00,
    unit_selling_price: 145.00,
    subtotal: 6000.00,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ci-3333333-3333-3333-3333-333333333333',
    store_id: DEFAULT_STORE.id,
    chalan_id: 'ch-2222222-2222-2222-2222-222222222222',
    product_id: 'c9999999-9999-9999-9999-999999999999',
    product_name_bn: 'রূপচাঁদা সয়াবিন তেল (২ লিটার)',
    quantity: 50,
    unit: 'packet',
    unit_cost_price: 350.00,
    unit_selling_price: 375.00,
    subtotal: 17500.00,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ci-4444444-4444-4444-4444-444444444444',
    store_id: DEFAULT_STORE.id,
    chalan_id: 'ch-2222222-2222-2222-2222-222222222222',
    product_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    product_name_bn: 'তীর আটা (২ কেজি প্যাকেট)',
    quantity: 60,
    unit: 'packet',
    unit_cost_price: 111.66,
    unit_selling_price: 128.00,
    subtotal: 6700.00,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ci-5555555-5555-5555-5555-555555555555',
    store_id: DEFAULT_STORE.id,
    chalan_id: 'ch-3333333-3333-3333-3333-333333333333',
    product_id: 'c7777777-7777-7777-7777-777777777777',
    product_name_bn: 'মিনিকেট চাল (খোলা)',
    quantity: 500,
    unit: 'kg',
    unit_cost_price: 68.00,
    unit_selling_price: 76.00,
    subtotal: 34000.00,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

/**
 * Initializes and seeds the Dexie local database if empty
 */
export async function initializeLocalDatabase(): Promise<void> {
  const storeCount = await db.stores.count();
  if (storeCount === 0) {
    await db.transaction('rw', [db.stores, db.categories, db.products, db.customers, db.expenses, db.baki_transactions, db.supplier_chalans, db.chalan_items], async () => {
      await db.stores.put(DEFAULT_STORE);
      await db.categories.bulkPut(INITIAL_CATEGORIES);
      await db.products.bulkPut(INITIAL_PRODUCTS);
      await db.customers.bulkPut(INITIAL_CUSTOMERS);
      await db.expenses.bulkPut(INITIAL_EXPENSES);
      await db.baki_transactions.bulkPut(INITIAL_BAKI_TRANSACTIONS);
      await db.supplier_chalans.bulkPut(INITIAL_CHALANS);
      await db.chalan_items.bulkPut(INITIAL_CHALAN_ITEMS);
    });
    console.log('[MudiDokan DB] Offline database successfully initialized and seeded.');
  } else {
    // Check if supplier_chalans need seeding
    const chalanCount = await db.supplier_chalans.count();
    if (chalanCount === 0) {
      await db.transaction('rw', [db.supplier_chalans, db.chalan_items], async () => {
        await db.supplier_chalans.bulkPut(INITIAL_CHALANS);
        await db.chalan_items.bulkPut(INITIAL_CHALAN_ITEMS);
      });
      console.log('[MudiDokan DB] Supplier chalans successfully seeded.');
    }
  }
}
