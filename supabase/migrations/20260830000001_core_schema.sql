-- ==============================================================================
-- MudiDokan (মুদিদোকান) Core Relational Schema & Financial ACID Engine
-- Migration: 20260830000001_core_schema.sql
-- Targets: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TENANCY & AUTHENTICATION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    proprietor VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    bkash_number VARCHAR(15),
    nagad_number VARCHAR(15),
    currency_symbol VARCHAR(5) DEFAULT '৳',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(50) DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'cashier')),
    pin_code VARCHAR(6) DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

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
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Positive = Customer owes shopkeeper (Due)
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT chk_customer_phone CHECK (phone ~ '^01[3-9][0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON customers (store_id, phone);

-- ------------------------------------------------------------------------------
-- 4. SALES & CART TRANSACTIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (due_amount >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'MFS', 'BAKI', 'SPLIT')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales (store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
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
    type VARCHAR(10) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')), -- DEBIT = Customer owes more (New Due), CREDIT = Customer paid (Payment collection)
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'OTHER')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_baki_tx_customer ON baki_transactions (customer_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. STORE OPERATING EXPENSES (দৈনিক খরচ)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g. দোকান ভাড়া, বিদ্যুৎ বিল, নাস্তা/চা, স্টাফ বেতন, পরিবহন
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

CREATE INDEX IF NOT EXISTS idx_expenses_store_date ON expenses (store_id, expense_date DESC);

-- ==============================================================================
-- 7. FINANCIAL INVARIANTS & ACID TRIGGERS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Trigger 1: Inventory Depletion on Sale Item Insertion
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Trigger 2: Bakir Khata Rebalancing on Baki Transaction Insertion
-- Formula: Balance_new = Balance_old + (DEBIT - CREDIT)
-- DEBIT: New due added (increases money owed to store)
-- CREDIT: Payment collected (decreases money owed to store)
-- ------------------------------------------------------------------------------
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
-- 8. ROW LEVEL SECURITY (RLS) MULTI-TENANCY POLICIES
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

-- Helper to retrieve current authenticated user's store_id
CREATE OR REPLACE FUNCTION get_current_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for Stores
CREATE POLICY "Store owners view their own store"
    ON stores FOR SELECT
    USING (id = get_current_store_id());

CREATE POLICY "Store owners update their own store"
    ON stores FOR UPDATE
    USING (id = get_current_store_id());

-- Policies for Operational Tables
CREATE POLICY "Tenant Store Isolation on categories"
    ON categories FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on products"
    ON products FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on customers"
    ON customers FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on sales"
    ON sales FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on sale_items"
    ON sale_items FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on baki_transactions"
    ON baki_transactions FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());

CREATE POLICY "Tenant Store Isolation on expenses"
    ON expenses FOR ALL
    USING (store_id = get_current_store_id())
    WITH CHECK (store_id = get_current_store_id());
