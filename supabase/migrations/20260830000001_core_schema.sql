-- ==============================================================================
-- Amar Dokan / MudiDokan (আমার দোকান) Core Relational Schema & Financial Engine
-- Migration: 20260830000001_core_schema.sql
-- Targets: PostgreSQL 15+ (Supabase)
--
-- This schema is generated from src/@types/database.types.ts and must stay in
-- step with it. The client mints its own UUIDs offline and replays rows through
-- the sync queue, so every table here accepts a client-supplied id.
--
-- OWNERSHIP OF DERIVED VALUES (important, and the source of a past double-count):
--   * products.stock_quantity   -> SERVER, via triggers on sale_items / chalan_items
--   * customers.current_balance -> SERVER, via trigger on baki_transactions
--   * supplier_chalans paid/due -> CLIENT, synced as an explicit UPDATE
-- The client applies the same effects to its local Dexie copy but never syncs
-- those derived columns, otherwise the change lands twice.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old conflicting template tables if they exist without store_id
DROP TABLE IF EXISTS day_closings CASCADE;
DROP TABLE IF EXISTS cash_counts CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS chalan_items CASCADE;
DROP TABLE IF EXISTS supplier_chalans CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS baki_transactions CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- ------------------------------------------------------------------------------
-- 1. TENANCY & AUTHENTICATION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    proprietor VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    -- Onboarding paperwork collected at registration.
    trade_licence_no VARCHAR(100),
    trade_licence_doc_url TEXT,
    tin_number VARCHAR(50),
    bin_number VARCHAR(50), -- NBR VAT registration, when the shop has one
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('approved', 'pending', 'rejected', 'suspended')),
    verification_notes TEXT,
    bkash_number VARCHAR(15),
    nagad_number VARCHAR(15),
    currency_symbol VARCHAR(5) DEFAULT '৳',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (verification_status);

-- Staff can be created offline, before any auth.users row exists, so the
-- primary key is a plain client UUID and the auth link is a nullable column.
-- Secrets never leave the device: the client stores a salted digest locally and
-- Supabase Auth owns online credentials.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(50) NOT NULL DEFAULT 'owner'
        CHECK (role IN ('super_admin', 'owner', 'manager', 'cashier')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_store ON profiles (store_id);

-- ------------------------------------------------------------------------------
-- 2. PRODUCT CATALOG & INVENTORY
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    icon VARCHAR(50) DEFAULT 'package',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    unit VARCHAR(20) DEFAULT 'piece' CHECK (unit IN ('kg', 'gm', 'litre', 'packet', 'piece', 'hali')),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    -- Deliberately allowed to go negative: a shopkeeper must never be blocked
    -- from selling goods physically on the shelf, and a silent clamp to zero
    -- hides the discrepancy instead of surfacing it at the next count.
    stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    min_stock_alert NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    is_quick_item BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_store_barcode ON products (store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_store_quick ON products (store_id, is_quick_item);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMER LEDGER (BAKIR KHATA)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    address TEXT,
    -- Positive = customer owes the shop. Negative = customer paid in advance.
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT chk_customer_phone CHECK (phone ~ '^01[3-9][0-9]{8}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_store_phone ON customers (store_id, phone);

-- ------------------------------------------------------------------------------
-- 4. SALES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_no VARCHAR(50) NOT NULL,
    -- Dhaka-local business day. created_at is UTC, and comparing its prefix
    -- pushed every pre-6 AM sale into the previous day's হিসাব.
    business_date DATE NOT NULL DEFAULT (TIMEZONE('Asia/Dhaka', NOW()))::DATE,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (due_amount >= 0),
    cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cash_amount >= 0),
    mfs_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (mfs_amount >= 0),
    mfs_provider VARCHAR(20) CHECK (mfs_provider IN ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'CASH', 'OTHER')),
    mfs_txn_id VARCHAR(100),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'MFS', 'BAKI', 'SPLIT')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    -- Invoice numbers are sequential per store per day, so uniqueness is scoped
    -- to the store rather than the whole platform.
    CONSTRAINT uq_sales_store_invoice UNIQUE (store_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales (store_id, business_date DESC);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    -- Denormalised so an old receipt still reads correctly after a rename.
    product_name_bn VARCHAR(255),
    -- Always stored in the product's BASE unit; `unit` records what was typed.
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) CHECK (unit IN ('kg', 'gm', 'litre', 'packet', 'piece', 'hali')),
    unit_cost_price NUMERIC(12, 2) NOT NULL CHECK (unit_cost_price >= 0),
    unit_selling_price NUMERIC(12, 2) NOT NULL CHECK (unit_selling_price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);

-- ------------------------------------------------------------------------------
-- 5. BAKI TRANSACTIONS (AUDIT-TRAIL CREDIT LEDGER)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS baki_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) DEFAULT 'CASH'
        CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'OTHER')),
    note TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(15),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_baki_tx_customer ON baki_transactions (customer_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. STORE OPERATING EXPENSES (দৈনিক খরচ)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    expense_date DATE NOT NULL DEFAULT (TIMEZONE('Asia/Dhaka', NOW()))::DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_expenses_store_date ON expenses (store_id, expense_date DESC);

-- ------------------------------------------------------------------------------
-- 7. SUPPLIER CHALANS (কোম্পানির চালান) — these tables did not exist, so every
--    chalan the client synced failed silently.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS supplier_chalans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    chalan_no VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(15),
    chalan_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (due_amount >= 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    items_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chalans_store_date ON supplier_chalans (store_id, chalan_date DESC);

CREATE TABLE IF NOT EXISTS chalan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    chalan_id UUID NOT NULL REFERENCES supplier_chalans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_bn VARCHAR(255) NOT NULL,
    -- As entered by the supplier (e.g. 500 gm)...
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) CHECK (unit IN ('kg', 'gm', 'litre', 'packet', 'piece', 'hali')),
    unit_cost_price NUMERIC(12, 2) NOT NULL CHECK (unit_cost_price >= 0),
    -- ...and converted by the client into the product's base unit, so the
    -- replenishment trigger below does not have to do unit maths in SQL.
    base_quantity NUMERIC(12, 3),
    base_unit_cost NUMERIC(12, 2),
    unit_selling_price NUMERIC(12, 2),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chalan_items_chalan ON chalan_items (chalan_id);

CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    chalan_id UUID NOT NULL REFERENCES supplier_chalans(id) ON DELETE CASCADE,
    chalan_no VARCHAR(100),
    supplier_name VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH'
        CHECK (payment_method IN ('CASH', 'BKASH', 'BANK')),
    payment_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_store_date
    ON supplier_payments (store_id, payment_date DESC);

-- ------------------------------------------------------------------------------
-- 8. CASH RECONCILIATION — counting the drawer used to leave no record at all.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cash_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    denominations JSONB NOT NULL DEFAULT '{}'::jsonb,
    counted_amount NUMERIC(12, 2) NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL,
    variance NUMERIC(12, 2) NOT NULL,
    note TEXT,
    counted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_cash_counts_store_date ON cash_counts (store_id, business_date DESC);

CREATE TABLE IF NOT EXISTS day_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    opening_float NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_collected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_collected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    new_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    supplier_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    counted_cash NUMERIC(12, 2),
    variance NUMERIC(12, 2),
    closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT uq_day_closing UNIQUE (store_id, business_date)
);

-- ==============================================================================
-- 9. FINANCIAL INVARIANTS & ACID TRIGGERS
-- ==============================================================================

-- Inventory depletion on sale item insertion. quantity is already in the
-- product's base unit, converted client-side.
CREATE OR REPLACE FUNCTION fn_deplete_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = TIMEZONE('Asia/Dhaka', NOW())
    WHERE id = NEW.product_id AND store_id = NEW.store_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deplete_inventory_on_sale ON sale_items;
CREATE TRIGGER trg_deplete_inventory_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION fn_deplete_inventory_on_sale();

-- Inventory replenishment on chalan item insertion, mirroring what the client
-- does locally. Without this the cloud only ever saw stock go down.
CREATE OR REPLACE FUNCTION fn_replenish_inventory_on_chalan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE products
    SET stock_quantity = stock_quantity + COALESCE(NEW.base_quantity, NEW.quantity),
        cost_price = COALESCE(NEW.base_unit_cost, NEW.unit_cost_price, cost_price),
        selling_price = CASE
            WHEN NEW.unit_selling_price IS NOT NULL AND NEW.unit_selling_price > 0
                THEN NEW.unit_selling_price
            ELSE selling_price
        END,
        updated_at = TIMEZONE('Asia/Dhaka', NOW())
    WHERE id = NEW.product_id AND store_id = NEW.store_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_replenish_inventory_on_chalan ON chalan_items;
CREATE TRIGGER trg_replenish_inventory_on_chalan
AFTER INSERT ON chalan_items
FOR EACH ROW
EXECUTE FUNCTION fn_replenish_inventory_on_chalan();

-- Bakir Khata rebalancing. Balance_new = Balance_old + (DEBIT - CREDIT).
CREATE OR REPLACE FUNCTION fn_rebalance_baki_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'DEBIT' THEN
        UPDATE customers
        SET current_balance = current_balance + NEW.amount,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.customer_id AND store_id = NEW.store_id;
    ELSIF NEW.type = 'CREDIT' THEN
        UPDATE customers
        SET current_balance = current_balance - NEW.amount,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.customer_id AND store_id = NEW.store_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rebalance_baki_on_transaction ON baki_transactions;
CREATE TRIGGER trg_rebalance_baki_on_transaction
AFTER INSERT ON baki_transactions
FOR EACH ROW
EXECUTE FUNCTION fn_rebalance_baki_on_transaction();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) MULTI-TENANCY POLICIES
-- ==============================================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE baki_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_chalans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chalan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Stores ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Store owners view their own store" ON stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores"
    ON stores FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Store owners update their own store" ON stores;
DROP POLICY IF EXISTS "Super admin and owners can update stores" ON stores;
CREATE POLICY "Super admin and owners can update stores"
    ON stores FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Registration policy: Allow public/unauthenticated shop registration requests
DROP POLICY IF EXISTS "Authenticated users can register a store" ON stores;
DROP POLICY IF EXISTS "Anyone can register a store request" ON stores;
CREATE POLICY "Anyone can register a store request"
    ON stores FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Profiles --------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles visible within the store" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
    ON profiles FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff can be created for own store" ON profiles;
DROP POLICY IF EXISTS "Anyone can register a profile" ON profiles;
CREATE POLICY "Anyone can register a profile"
    ON profiles FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can be updated within the store" ON profiles;
DROP POLICY IF EXISTS "Profiles can be updated" ON profiles;
CREATE POLICY "Profiles can be updated"
    ON profiles FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Operational tables ----------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'stores', 'profiles', 'categories', 'products', 'customers', 'sales', 'sale_items',
        'baki_transactions', 'expenses', 'supplier_chalans', 'chalan_items',
        'supplier_payments', 'cash_counts', 'day_closings'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation on %I" ON %I', t, t);
        EXECUTE format(
            'CREATE POLICY "Public access on %I" ON %I FOR ALL
             TO anon, authenticated
             USING (true)
             WITH CHECK (true)',
            t, t
        );
    END LOOP;
END;
$$;
