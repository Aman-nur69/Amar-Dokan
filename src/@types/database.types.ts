// ==============================================================================
// MudiDokan (মুদিদোকান) Database TypeScript Interfaces & Types
// ==============================================================================

export type PaymentMethod = 'CASH' | 'MFS' | 'BAKI' | 'SPLIT';
export type BakiType = 'DEBIT' | 'CREDIT'; // DEBIT = Customer owes more (New Due), CREDIT = Customer paid (Repayment)
export type MfsProvider = 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY' | 'CASH' | 'OTHER';
export type ProductUnit = 'kg' | 'gm' | 'litre' | 'packet' | 'piece' | 'hali';
export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier';

export interface UserSession {
  id: string;
  store_id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  logged_at: string;
}

export type ShopVerificationStatus = 'approved' | 'pending' | 'rejected' | 'suspended';

export interface Store {
  id: string;
  name: string;
  proprietor: string;
  phone: string;
  address: string;
  trade_licence_no?: string;
  trade_licence_doc_url?: string;
  tin_number?: string;
  verification_status: ShopVerificationStatus;
  verification_notes?: string;
  bkash_number?: string;
  nagad_number?: string;
  currency_symbol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  store_id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  password?: string;
  pin_code?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name_bn: string;
  name_en?: string;
  icon?: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  barcode?: string;
  name_bn: string;
  name_en?: string;
  unit: ProductUnit;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  is_quick_item: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string; // 11-digit BD mobile: 01XXXXXXXXX
  address?: string;
  current_balance: number; // Positive = Customer owes shopkeeper (Due), Negative = Advance paid
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  store_id: string;
  customer_id?: string;
  invoice_no: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Local enriched fields
  customer_name?: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  store_id: string;
  sale_id: string;
  product_id: string;
  product_name_bn?: string;
  quantity: number;
  unit?: ProductUnit;
  unit_cost_price: number;
  unit_selling_price: number;
  subtotal: number;
  created_at: string;
}

export interface BakiTransaction {
  id: string;
  store_id: string;
  customer_id: string;
  sale_id?: string;
  type: BakiType; // DEBIT (Due increase), CREDIT (Payment received)
  amount: number;
  payment_method?: MfsProvider;
  note?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface Expense {
  id: string;
  store_id: string;
  category: string;
  amount: number;
  note?: string;
  expense_date: string;
  created_at: string;
}

export interface SupplierChalan {
  id: string;
  store_id: string;
  chalan_no: string;
  supplier_name: string; // e.g. মেঘনা গ্রুপ (ফ্রেশ), তীর, স্কয়ার, ইউনিলিভার, পাইকারি মহাজন
  supplier_phone?: string;
  chalan_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  items_count: number;
  notes?: string;
  created_at: string;
  items?: ChalanItem[];
}

export interface ChalanItem {
  id: string;
  store_id: string;
  chalan_id: string;
  product_id: string;
  product_name_bn: string;
  quantity: number;
  unit: ProductUnit;
  unit_cost_price: number;
  unit_selling_price?: number;
  subtotal: number;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  store_id: string;
  chalan_id: string;
  chalan_no: string;
  supplier_name: string;
  amount: number;
  payment_method: 'CASH' | 'BKASH' | 'BANK';
  payment_date: string;
  note?: string;
  created_at: string;
}

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  table_name:
    | 'sales'
    | 'sale_items'
    | 'baki_transactions'
    | 'customers'
    | 'products'
    | 'expenses'
    | 'supplier_chalans'
    | 'chalan_items'
    | 'supplier_payments';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  status: SyncStatus;
  error_message?: string;
}
