// ==============================================================================
// MudiDokan (মুদিদোকান) Offline-First IndexedDB Engine (Dexie.js)
// Local ACID Persistence & Mutation Sync Queue
// ==============================================================================

import Dexie, { Table } from 'dexie';
import {
  Store,
  Profile,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  BakiTransaction,
  Expense,
  SyncQueueItem,
  SyncTableName,
  SupplierChalan,
  ChalanItem,
  SupplierPayment,
  CashCount,
  DayClosing,
} from '../@types/database.types';
import { todayDhakaKey } from '../lib/dateUtils';

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
  profiles!: Table<Profile, string>;
  cash_counts!: Table<CashCount, string>;
  day_closings!: Table<DayClosing, string>;

  constructor() {
    super('AmarDokanOfflineDB');
    this.version(4).stores({
      stores: 'id',
      profiles: 'id, store_id, phone, role',
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

    // v5: business-date indexes for the daily হিসাব, plus persisted drawer
    // counts and day closings (previously the reconciliation was thrown away).
    this.version(5)
      .stores({
        sales: 'id, store_id, invoice_no, customer_id, created_at, business_date',
        cash_counts: 'id, store_id, business_date, created_at',
        day_closings: 'id, store_id, business_date, created_at',
      })
      .upgrade(async (tx) => {
        // Backfill business_date for sales recorded before the Dhaka-day fix.
        const sales = await tx.table('sales').toArray();
        for (const sale of sales) {
          if (!sale.business_date) {
            await tx.table('sales').update(sale.id, {
              business_date: toDhakaKeySafe(sale.created_at),
            });
          }
        }
      });
  }
}

function toDhakaKeySafe(iso?: string): string {
  try {
    return iso ? new Date(new Date(iso).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10) : todayDhakaKey();
  } catch {
    return todayDhakaKey();
  }
}

export const db = new MudiDokanDexieDb();

// Default Store Profile Template (Empty state fallback)
export const DEFAULT_STORE: Store = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'আমার দোকান (Amar Dokan)',
  proprietor: '',
  phone: '',
  address: '',
  currency_symbol: '৳',
  verification_status: 'approved',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Clean empty seed lists (Real data comes directly from Supabase cloud database)
export const INITIAL_STORES: Store[] = [];
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000000',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'সুপার অ্যাডমিন (System Administrator)',
    phone: '01700000000',
    role: 'super_admin',
    password_hash: 'sha256$4b187707c7394e03030383e54ab9c7bd628b340134810d55207cadeb53c50499', // admin123
    pin_hash: 'sha256$4b187707c7394e03030383e54ab9c7bd628b340134810d55207cadeb53c50499',
    is_active: true,
    created_at: '2026-08-30T00:00:00.000Z',
    updated_at: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'মোঃ রফিকুল ইসলাম (দোকান মালিক)',
    phone: '01711998877',
    role: 'owner',
    password_hash: 'sha256$9b4198a88a6c92cb3d1d566d46dec30f8407c71f20a0fd6d9801db5c44ad1ef7', // dokan123
    pin_hash: 'sha256$9b4198a88a6c92cb3d1d566d46dec30f8407c71f20a0fd6d9801db5c44ad1ef7',
    is_active: true,
    created_at: '2026-08-30T00:00:00.000Z',
    updated_at: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'f0000002-0000-0000-0000-000000000002',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'আব্দুল করিম (ম্যানেজার)',
    phone: '01811223344',
    role: 'manager',
    password_hash: 'sha256$d41b835cce5873cc227dc8c7805639488a4315199accfdd0efed99ef11b07379', // dokan123
    pin_hash: 'sha256$d41b835cce5873cc227dc8c7805639488a4315199accfdd0efed99ef11b07379',
    is_active: true,
    created_at: '2026-08-30T00:00:00.000Z',
    updated_at: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'f0000003-0000-0000-0000-000000000003',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'তানভীর হাসান (ক্যাশিয়ার)',
    phone: '01911334455',
    role: 'cashier',
    password_hash: 'sha256$3a4b261157f67591802d9a941520105ed0444ab404fd084cd6f29ea93b90ce53', // dokan123
    pin_hash: 'sha256$3a4b261157f67591802d9a941520105ed0444ab404fd084cd6f29ea93b90ce53',
    is_active: true,
    created_at: '2026-08-30T00:00:00.000Z',
    updated_at: '2026-08-30T00:00:00.000Z',
  },
];
export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_BAKI_TRANSACTIONS: BakiTransaction[] = [];
export const INITIAL_CHALANS: SupplierChalan[] = [];
export const INITIAL_CHALAN_ITEMS: ChalanItem[] = [];

/**
 * Request persistent browser storage to prevent silent eviction under low disk space
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[AmarDokan DB] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[AmarDokan DB] Persistent storage request failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Purges all local IndexedDB tables and syncs fresh data directly from Supabase
 */
export async function purgeLocalDataAndSyncWithSupabase(): Promise<void> {
  try {
    const { isSupabaseConfigured, supabase } = await import('../lib/supabaseClient');
    if (!isSupabaseConfigured()) return;

    // 1. Fetch live cloud data for all operational tables
    const [
      storesRes,
      profilesRes,
      categoriesRes,
      productsRes,
      customersRes,
      salesRes,
      saleItemsRes,
      bakiTxnsRes,
      expensesRes,
      chalansRes,
      chalanItemsRes,
      paymentsRes,
      cashCountsRes,
      dayClosingsRes,
    ] = await Promise.all([
      supabase.from('stores').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('sale_items').select('*'),
      supabase.from('baki_transactions').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('supplier_chalans').select('*'),
      supabase.from('chalan_items').select('*'),
      supabase.from('supplier_payments').select('*'),
      supabase.from('cash_counts').select('*'),
      supabase.from('day_closings').select('*'),
    ]);

    // 2. Atomic Dexie rewrite with fresh Supabase data
    await db.transaction(
      'rw',
      [
        db.stores,
        db.profiles,
        db.categories,
        db.products,
        db.customers,
        db.sales,
        db.sale_items,
        db.baki_transactions,
        db.expenses,
        db.supplier_chalans,
        db.chalan_items,
        db.supplier_payments,
        db.cash_counts,
        db.day_closings,
      ],
      async () => {
        await Promise.all([
          db.stores.clear(),
          db.profiles.clear(),
          db.categories.clear(),
          db.products.clear(),
          db.customers.clear(),
          db.sales.clear(),
          db.sale_items.clear(),
          db.baki_transactions.clear(),
          db.expenses.clear(),
          db.supplier_chalans.clear(),
          db.chalan_items.clear(),
          db.supplier_payments.clear(),
          db.cash_counts.clear(),
          db.day_closings.clear(),
        ]);

        if (storesRes.data?.length) await db.stores.bulkPut(storesRes.data);
        if (categoriesRes.data?.length) await db.categories.bulkPut(categoriesRes.data);
        if (profilesRes.data?.length) {
          const merged = profilesRes.data.map((p) => {
            const initMatch = INITIAL_PROFILES.find((ip) => ip.phone === p.phone || ip.id === p.id);
            return {
              ...p,
              password_hash: p.password_hash || initMatch?.password_hash,
              pin_hash: p.pin_hash || initMatch?.pin_hash,
            };
          });
          await db.profiles.bulkPut(merged);
        } else if (INITIAL_PROFILES.length > 0) {
          await db.profiles.bulkPut(INITIAL_PROFILES);
        }
        if (productsRes.data?.length) await db.products.bulkPut(productsRes.data);
        if (customersRes.data?.length) await db.customers.bulkPut(customersRes.data);
        if (salesRes.data?.length) await db.sales.bulkPut(salesRes.data);
        if (saleItemsRes.data?.length) await db.sale_items.bulkPut(saleItemsRes.data);
        if (bakiTxnsRes.data?.length) await db.baki_transactions.bulkPut(bakiTxnsRes.data);
        if (expensesRes.data?.length) await db.expenses.bulkPut(expensesRes.data);
        if (chalansRes.data?.length) await db.supplier_chalans.bulkPut(chalansRes.data);
        if (chalanItemsRes.data?.length) await db.chalan_items.bulkPut(chalanItemsRes.data);
        if (paymentsRes.data?.length) await db.supplier_payments.bulkPut(paymentsRes.data);
        if (cashCountsRes.data?.length) await db.cash_counts.bulkPut(cashCountsRes.data);
        if (dayClosingsRes.data?.length) await db.day_closings.bulkPut(dayClosingsRes.data);
      }
    );

    console.log('[AmarDokan DB] Synchronized all tables directly with live Supabase database.');
  } catch (err) {
    console.error('[AmarDokan DB] Failed to sync all tables with Supabase:', err);
  }
}

/**
 * Initializes and syncs the Dexie local database with live Supabase cloud database
 */
export async function initializeLocalDatabase(): Promise<void> {
  // 1. Request OS/Browser storage persistence
  requestPersistentStorage().catch(() => {});

  // 2. Fetch live data from Supabase
  await purgeLocalDataAndSyncWithSupabase();
}

// ==============================================================================
// Sync Queue Helpers
// One queue row = one database row. Local-only enrichment (joined names, nested
// children) is stripped here so the payload matches the destination table.
// ==============================================================================

/** Fields the client carries for display but the server does not store. */
const LOCAL_ONLY_FIELDS: Partial<Record<SyncTableName, string[]>> = {
  sales: ['customer_name', 'items'],
  supplier_chalans: ['items'],
  products: ['reason'],
};

export function sanitizeSyncPayload(
  table: SyncTableName,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  const drop = new Set(LOCAL_ONLY_FIELDS[table] || []);

  for (const [key, value] of Object.entries(payload)) {
    if (drop.has(key)) continue;
    if (value === undefined) continue; // undefined breaks PostgREST; omit instead
    clean[key] = value;
  }

  return clean;
}

/**
 * Builds a queue row. Always enqueue one of these per table row — never a
 * nested {parent, children} envelope, which no table can accept.
 */
export function buildSyncItem(
  table: SyncTableName,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: Record<string, unknown>
): SyncQueueItem {
  return {
    id: crypto.randomUUID(),
    table_name: table,
    action,
    payload: sanitizeSyncPayload(table, payload),
    created_at: new Date().toISOString(),
    retry_count: 0,
    status: 'PENDING',
  };
}

/** Convenience for callers already inside a Dexie rw transaction. */
export async function enqueueSync(
  entries: { table: SyncTableName; action: 'INSERT' | 'UPDATE' | 'DELETE'; payload: Record<string, unknown> }[]
): Promise<void> {
  if (entries.length === 0) return;
  await db.sync_queue.bulkAdd(entries.map((e) => buildSyncItem(e.table, e.action, e.payload)));
}
