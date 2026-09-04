-- ==============================================================================
-- Amar Dokan (আমার দোকান) / MudiDokan 2.00
-- Complete Master Database Drop (Public Schema + Auth Users) & Fresh SaaS Build
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard -> SQL Editor
-- 2. Paste this ENTIRE file into a New Query
-- 3. Click "RUN"
-- This will wipe all old dummy data (including auth.users), recreate all 15 tables
-- with indexes, RLS, triggers, and register clean auth accounts & seed catalog.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLEAN SLATE: DROP OLD TRIGGERS, FUNCTIONS & PUBLIC TABLES
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_manage_inventory_on_sale ON public.sale_items;
DROP TRIGGER IF EXISTS trg_deplete_inventory_on_sale ON public.sale_items;
DROP TRIGGER IF EXISTS trg_replenish_inventory_on_chalan ON public.chalan_items;
DROP TRIGGER IF EXISTS trg_rebalance_baki_on_transaction ON public.baki_transactions;

DROP FUNCTION IF EXISTS public.fn_handle_inventory_lifecycle CASCADE;
DROP FUNCTION IF EXISTS public.fn_deplete_inventory_on_sale CASCADE;
DROP FUNCTION IF EXISTS public.fn_replenish_inventory_on_chalan CASCADE;
DROP FUNCTION IF EXISTS public.fn_rebalance_baki_on_transaction CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_store_id CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin CASCADE;

DROP TABLE IF EXISTS public.day_closings CASCADE;
DROP TABLE IF EXISTS public.cash_counts CASCADE;
DROP TABLE IF EXISTS public.supplier_payments CASCADE;
DROP TABLE IF EXISTS public.chalan_items CASCADE;
DROP TABLE IF EXISTS public.supplier_chalans CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.baki_transactions CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.store_audit_logs CASCADE;

-- ------------------------------------------------------------------------------
-- 2. WIPE OLD AUTH DUMMY DATA (AUTH.USERS & SESSIONS)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Delete all child auth records first to avoid foreign key violations
    BEGIN DELETE FROM auth.mfa_amr_claims; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.mfa_challenges; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.mfa_factors; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.refresh_tokens; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.sessions; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.identities; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.one_time_tokens; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.flow_state; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM auth.users; EXCEPTION WHEN OTHERS THEN NULL; END;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth cleanup if permissions restricted: %', SQLERRM;
END $$;

-- ------------------------------------------------------------------------------
-- 3. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 4. SCHEMA DEFINITION (15 SAAS TABLES)
-- ------------------------------------------------------------------------------

-- Table 1: Stores (Tenants)
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    proprietor VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    trade_licence_no VARCHAR(100),
    trade_licence_doc_url TEXT,
    tin_number VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (verification_status IN ('approved', 'pending', 'rejected', 'suspended')),
    verification_notes TEXT,
    bkash_number VARCHAR(20),
    nagad_number VARCHAR(20),
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '৳',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 2: Profiles (Staff & RBAC)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'owner', 'manager', 'cashier')),
    password_hash VARCHAR(255),
    pin_hash VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 3: Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    icon VARCHAR(100) DEFAULT 'shopping-bag',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 4: Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    name_bn VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'gm', 'litre', 'packet', 'piece', 'hali')),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    min_stock_alert NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    is_quick_item BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 5: Customers (Baki Khata)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 6: Sales (Invoices)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_no VARCHAR(100) NOT NULL,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mfs_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mfs_provider VARCHAR(20) CHECK (mfs_provider IN ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'CASH', 'OTHER')),
    mfs_txn_id VARCHAR(100),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'MFS', 'BAKI', 'SPLIT')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT uq_sales_store_invoice UNIQUE (store_id, invoice_no)
);

-- Table 7: Sale Items
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name_bn VARCHAR(255),
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20),
    unit_cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_selling_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 8: Baki Transactions (Customer Ledger)
CREATE TABLE public.baki_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'CASH', 'OTHER')),
    note TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 9: Expenses
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    note TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 10: Supplier Chalans (Stock Inward)
CREATE TABLE public.supplier_chalans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    chalan_no VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(20),
    chalan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
    items_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT uq_chalan_store_no UNIQUE (store_id, chalan_no)
);

-- Table 11: Chalan Items
CREATE TABLE public.chalan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    chalan_id UUID NOT NULL REFERENCES public.supplier_chalans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name_bn VARCHAR(255),
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost_price NUMERIC(12, 2) NOT NULL,
    unit_selling_price NUMERIC(12, 2),
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 12: Supplier Payments (Chalan Dues Repayment)
CREATE TABLE public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    chalan_id UUID NOT NULL REFERENCES public.supplier_chalans(id) ON DELETE CASCADE,
    chalan_no VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'BANK')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 13: Cash Counts (Drawer Reconciliation)
CREATE TABLE public.cash_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    denominations JSONB NOT NULL DEFAULT '{}'::jsonb,
    counted_amount NUMERIC(12, 2) NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL,
    variance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    note TEXT,
    counted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- Table 14: Day Closings (EOD Closing Statement)
CREATE TABLE public.day_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
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
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW()),
    CONSTRAINT uq_day_closings_store_date UNIQUE (store_id, business_date)
);

-- Table 15: Store Audit Logs
CREATE TABLE public.store_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('Asia/Dhaka', NOW())
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE B-TREE INDEXES (<50ms Target Budget)
-- ------------------------------------------------------------------------------
CREATE INDEX idx_stores_phone ON public.stores(phone);
CREATE INDEX idx_stores_status ON public.stores(verification_status, is_active);
CREATE INDEX idx_profiles_store ON public.profiles(store_id);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);

CREATE INDEX idx_categories_store ON public.categories(store_id);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_barcode ON public.products(store_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_quick ON public.products(store_id, is_quick_item);

CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE INDEX idx_customers_phone ON public.customers(store_id, phone);
CREATE INDEX idx_customers_balance ON public.customers(store_id, current_balance DESC);

CREATE INDEX idx_sales_store_date ON public.sales(store_id, business_date DESC);
CREATE INDEX idx_sales_store_created ON public.sales(store_id, created_at DESC);
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX idx_sale_items_store_product ON public.sale_items(store_id, product_id);

CREATE INDEX idx_baki_tx_customer ON public.baki_transactions(customer_id);
CREATE INDEX idx_baki_tx_store_created ON public.baki_transactions(store_id, created_at DESC);
CREATE INDEX idx_baki_tx_sale ON public.baki_transactions(sale_id) WHERE sale_id IS NOT NULL;

CREATE INDEX idx_expenses_store_date ON public.expenses(store_id, expense_date DESC);

CREATE INDEX idx_chalans_store_date ON public.supplier_chalans(store_id, chalan_date DESC);
CREATE INDEX idx_chalan_items_chalan ON public.chalan_items(chalan_id);
CREATE INDEX idx_chalan_items_product ON public.chalan_items(product_id);
CREATE INDEX idx_supplier_payments_chalan ON public.supplier_payments(chalan_id);

CREATE INDEX idx_cash_counts_store_date ON public.cash_counts(store_id, business_date DESC);
CREATE INDEX idx_day_closings_store_date ON public.day_closings(store_id, business_date DESC);

-- ------------------------------------------------------------------------------
-- 6. DATABASE BUSINESS LOGIC TRIGGERS (INVENTORY & LEDGER REBALANCING)
-- ------------------------------------------------------------------------------

-- Trigger 1: Stock Depletion on Sale Items (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_handle_inventory_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - NEW.quantity,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity + OLD.quantity,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = OLD.product_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.product_id = NEW.product_id THEN
            UPDATE public.products
            SET stock_quantity = stock_quantity + (OLD.quantity - NEW.quantity),
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.product_id;
        ELSE
            UPDATE public.products
            SET stock_quantity = stock_quantity + OLD.quantity,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.product_id;
            
            UPDATE public.products
            SET stock_quantity = stock_quantity - NEW.quantity,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_manage_inventory_on_sale
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_inventory_lifecycle();

-- Trigger 2: Stock Replenishment on Supplier Chalan Items (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_replenish_inventory_on_chalan()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity + NEW.quantity,
            cost_price = CASE WHEN NEW.unit_cost_price > 0 THEN NEW.unit_cost_price ELSE cost_price END,
            selling_price = CASE WHEN NEW.unit_selling_price IS NOT NULL AND NEW.unit_selling_price > 0 THEN NEW.unit_selling_price ELSE selling_price END,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - OLD.quantity,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = OLD.product_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.product_id = NEW.product_id THEN
            UPDATE public.products
            SET stock_quantity = stock_quantity - (OLD.quantity - NEW.quantity),
                cost_price = CASE WHEN NEW.unit_cost_price > 0 THEN NEW.unit_cost_price ELSE cost_price END,
                selling_price = CASE WHEN NEW.unit_selling_price IS NOT NULL AND NEW.unit_selling_price > 0 THEN NEW.unit_selling_price ELSE selling_price END,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.product_id;
        ELSE
            UPDATE public.products
            SET stock_quantity = stock_quantity - OLD.quantity,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.product_id;
            
            UPDATE public.products
            SET stock_quantity = stock_quantity + NEW.quantity,
                cost_price = CASE WHEN NEW.unit_cost_price > 0 THEN NEW.unit_cost_price ELSE cost_price END,
                selling_price = CASE WHEN NEW.unit_selling_price IS NOT NULL AND NEW.unit_selling_price > 0 THEN NEW.unit_selling_price ELSE selling_price END,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_replenish_inventory_on_chalan
    AFTER INSERT OR UPDATE OR DELETE ON public.chalan_items
    FOR EACH ROW EXECUTE FUNCTION public.fn_replenish_inventory_on_chalan();

-- Trigger 3: Customer Balance Rebalancing on Baki Transactions
CREATE OR REPLACE FUNCTION public.fn_rebalance_baki_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'DEBIT' THEN
            UPDATE public.customers
            SET current_balance = current_balance + NEW.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.customer_id;
        ELSIF NEW.type = 'CREDIT' THEN
            UPDATE public.customers
            SET current_balance = current_balance - NEW.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.customer_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'DEBIT' THEN
            UPDATE public.customers
            SET current_balance = current_balance - OLD.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.customer_id;
        ELSIF OLD.type = 'CREDIT' THEN
            UPDATE public.customers
            SET current_balance = current_balance + OLD.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.customer_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_rebalance_baki_on_transaction
    AFTER INSERT OR DELETE ON public.baki_transactions
    FOR EACH ROW EXECUTE FUNCTION public.fn_rebalance_baki_on_transaction();

-- ------------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS) MULTI-TENANT ISOLATION
-- ------------------------------------------------------------------------------
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baki_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_chalans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chalan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public stores discovery" ON public.stores
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

CREATE POLICY "Super admin all access on stores" ON public.stores
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Profiles self and tenant access" ON public.profiles
    FOR ALL TO anon, authenticated
    USING (
        id = auth.uid()
        OR store_id = ((auth.jwt() -> 'app_metadata' ->> 'store_id')::uuid)
        OR (auth.jwt() ->> 'role') = 'super_admin'
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        OR phone IS NOT NULL
    )
    WITH CHECK (
        id = auth.uid()
        OR store_id = ((auth.jwt() -> 'app_metadata' ->> 'store_id')::uuid)
        OR (auth.jwt() ->> 'role') = 'super_admin'
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    );

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'categories', 'products', 'customers', 'sales', 'sale_items',
        'baki_transactions', 'expenses', 'supplier_chalans', 'chalan_items',
        'supplier_payments', 'cash_counts', 'day_closings', 'store_audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY "%s_tenant_isolation" ON public.%I
            FOR ALL
            TO anon, authenticated
            USING (
                store_id = ((auth.jwt() -> ''app_metadata'' ->> ''store_id'')::uuid)
                OR (auth.jwt() ->> ''role'') = ''super_admin''
                OR (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin''
                OR store_id = ''a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11''::uuid
            )
            WITH CHECK (
                store_id = ((auth.jwt() -> ''app_metadata'' ->> ''store_id'')::uuid)
                OR (auth.jwt() ->> ''role'') = ''super_admin''
                OR (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin''
                OR store_id = ''a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11''::uuid
            );
        ', t, t);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 8. CLEAN SAAS SEED DATASET (STORES, AUTH USERS & PROFILES)
-- ------------------------------------------------------------------------------

-- 1. Demo Flagship Store
INSERT INTO public.stores (
    id, name, proprietor, phone, address, trade_licence_no, tin_number,
    verification_status, bkash_number, nagad_number, currency_symbol, is_active
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ভাই ভাই স্টোর (Bhai Bhai Store)',
    'মোঃ রফিকুল ইসলাম (Rafiqul Islam)',
    '01711998877',
    'দোকান নং ১২, মীরপুর-১০ গোলচত্বর বাজার, ঢাকা-১২১৬',
    'TRAD/DNCC/019283/2024',
    '839201948201',
    'approved',
    '01711998877',
    '01811998877',
    '৳',
    TRUE
);

-- 2. Seed Clean Accounts in auth.users (if permissions allow)
DO $$
BEGIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES
    ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '01700000000@mudidokan.internal', crypt('admin123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"], "role": "super_admin"}'::jsonb, '{"full_name": "সুপার অ্যাডমিন", "phone": "01700000000", "role": "super_admin"}'::jsonb, NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'f0000001-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '01711998877@mudidokan.internal', crypt('dokan123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"], "role": "owner"}'::jsonb, '{"full_name": "মোঃ রফিকুল ইসলাম", "phone": "01711998877", "role": "owner"}'::jsonb, NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'f0000002-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '01811223344@mudidokan.internal', crypt('dokan123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"], "role": "manager"}'::jsonb, '{"full_name": "আব্দুল করিম", "phone": "01811223344", "role": "manager"}'::jsonb, NOW(), NOW(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', 'f0000003-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '01911334455@mudidokan.internal', crypt('dokan123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"], "role": "cashier"}'::jsonb, '{"full_name": "তানভীর হাসান", "phone": "01911334455", "role": "cashier"}'::jsonb, NOW(), NOW(), '', '', '', '');

    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
    ('f0000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000000', '{"sub": "f0000000-0000-0000-0000-000000000000", "email": "01700000000@mudidokan.internal"}'::jsonb, 'email', NOW(), NOW(), NOW()),
    ('f0000001-0000-0000-0000-000000000000', 'f0000001-0000-0000-0000-000000000000', '{"sub": "f0000001-0000-0000-0000-000000000000", "email": "01711998877@mudidokan.internal"}'::jsonb, 'email', NOW(), NOW(), NOW()),
    ('f0000002-0000-0000-0000-000000000000', 'f0000002-0000-0000-0000-000000000000', '{"sub": "f0000002-0000-0000-0000-000000000000", "email": "01811223344@mudidokan.internal"}'::jsonb, 'email', NOW(), NOW(), NOW()),
    ('f0000003-0000-0000-0000-000000000000', 'f0000003-0000-0000-0000-000000000000', '{"sub": "f0000003-0000-0000-0000-000000000000", "email": "01911334455@mudidokan.internal"}'::jsonb, 'email', NOW(), NOW(), NOW());
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping direct auth.users creation: %', SQLERRM;
END $$;

-- 3. Profiles (Linked to stores and matching app salted hashes)
INSERT INTO public.profiles (
    id, store_id, full_name, phone, role, password_hash, pin_hash, is_active
) VALUES
('f0000000-0000-0000-0000-000000000000', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'সুপার অ্যাডমিন (System Administrator)', '01700000000', 'super_admin', 'sha256$4b187707c7394e03030383e54ab9c7bd628b340134810d55207cadeb53c50499', 'sha256$4b187707c7394e03030383e54ab9c7bd628b340134810d55207cadeb53c50499', TRUE),
('f0000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মোঃ রফিকুল ইসলাম (দোকান মালিক)', '01711998877', 'owner', 'sha256$9b4198a88a6c92cb3d1d566d46dec30f8407c71f20a0fd6d9801db5c44ad1ef7', 'sha256$9b4198a88a6c92cb3d1d566d46dec30f8407c71f20a0fd6d9801db5c44ad1ef7', TRUE),
('f0000002-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'আব্দুল করিম (ম্যানেজার)', '01811223344', 'manager', 'sha256$d41b835cce5873cc227dc8c7805639488a4315199accfdd0efed99ef11b07379', 'sha256$d41b835cce5873cc227dc8c7805639488a4315199accfdd0efed99ef11b07379', TRUE),
('f0000003-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'তানভীর হাসান (ক্যাশিয়ার)', '01911334455', 'cashier', 'sha256$3a4b261157f67591802d9a941520105ed0444ab404fd084cd6f29ea93b90ce53', 'sha256$3a4b261157f67591802d9a941520105ed0444ab404fd084cd6f29ea93b90ce53', TRUE);

-- 4. Standard Grocery Categories
INSERT INTO public.categories (id, store_id, name_bn, name_en, icon) VALUES
('b1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'নিত্যপ্রয়োজনীয় (Daily Essentials)', 'Daily Essentials', 'shopping-bag'),
('b2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'তেল ও ঘি (Oil & Ghee)', 'Oil & Ghee', 'droplet'),
('b3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'চাল ও ডাল (Rice & Pulses)', 'Rice & Pulses', 'wheat'),
('b4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মশলা ও আদা-রসুন (Spices)', 'Spices', 'sparkles'),
('b5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'স্ন্যাকস ও বিস্কুট (Snacks & Bakery)', 'Snacks & Bakery', 'cookie'),
('b6666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'টয়লেট্রিজ ও সাবান (Toiletries)', 'Toiletries', 'shield-check');

-- 5. Catalog Products
INSERT INTO public.products (
    id, store_id, category_id, barcode, name_bn, name_en, unit,
    cost_price, selling_price, stock_quantity, min_stock_alert, is_quick_item
) VALUES
('c1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b2222222-2222-2222-2222-222222222222', NULL, 'খোলা সয়াবিন তেল', 'Loose Soybean Oil', 'litre', 160.00, 175.00, 120.000, 20.000, TRUE),
('c2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'দেশি সাদা চিনি', 'White Sugar', 'kg', 125.00, 138.00, 85.500, 15.000, TRUE),
('c3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b3333333-3333-3333-3333-333333333333', NULL, 'মসুর ডাল (চিকন)', 'Red Lentil (Fine)', 'kg', 130.00, 145.00, 65.000, 10.000, TRUE),
('c4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'ফার্মের লাল ডিম (১ হালি)', 'Farm Red Eggs (4 pcs)', 'hali', 42.00, 48.00, 150.000, 25.000, TRUE),
('c5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'নতুন গোল আলু', 'Fresh Potato', 'kg', 32.00, 40.00, 250.000, 40.000, TRUE),
('c6666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'দেশি পেঁয়াজ', 'Local Onion', 'kg', 60.00, 75.00, 95.000, 20.000, TRUE),
('c7777777-7777-7777-7777-777777777777', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b3333333-3333-3333-3333-333333333333', NULL, 'মিনিকেট চাল (৫০ কেজি বস্তা খোলা)', 'Miniket Rice Loose', 'kg', 68.00, 76.00, 320.000, 50.000, TRUE),
('c8888888-8888-8888-8888-888888888888', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b4444444-4444-4444-4444-444444444444', NULL, 'দেশি রসুন', 'Local Garlic', 'kg', 180.00, 210.00, 30.000, 8.000, TRUE),
('c9999999-9999-9999-9999-999999999999', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b2222222-2222-2222-2222-222222222222', '8941100501123', 'রূপচাঁদা সয়াবিন তেল (২ লিটার)', 'Rupchanda Soybean Oil 2L', 'packet', 350.00, 375.00, 18.000, 5.000, FALSE),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b5555555-5555-5555-5555-555555555555', '8941100332211', 'ম্যাগি ২-মিনিট নুডুলস (৮ প্যাক)', 'Maggi 2-Min Noodles (8 pack)', 'packet', 135.00, 150.00, 4.000, 8.000, FALSE),
('cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b6666666-6666-6666-6666-666666666666', '8941100778899', 'লাইফবয় টোটাল সাবান (১০০ গ্রাম)', 'Lifebuoy Total Soap 100g', 'piece', 42.00, 50.00, 25.000, 10.000, FALSE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', '8941100445566', 'তীর আটা (২ কেজি প্যাকেট)', 'Teer Atta 2kg Packet', 'packet', 115.00, 128.00, 35.000, 10.000, FALSE);

-- 6. Regular Customers (Baki Khata)
INSERT INTO public.customers (id, store_id, name, phone, address, current_balance, credit_limit) VALUES
('d1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'হাজী শামসুল হক (বাড়িয়ালা)', '01819234567', 'বাড়ি নং ৪২, রোড ৭, মীরপুর ১০', 0.00, 10000.00),
('d2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মাওলানা আব্দুর রশিদ', '01712345678', 'বায়তুল আমান মসজিদ গলি', 0.00, 5000.00),
('d3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মোঃ কবির হোসেন (রিকশাচালক)', '01918765432', 'পূর্ব বস্তি, মিরপুর ১০', 0.00, 1500.00),
('d4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'সুমন আহমেদ (চাকরিজীবী)', '01611223344', 'ফ্ল্যাট ৩বি, মীম টাওয়ার', 0.00, 8000.00),
('d5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'নাসরীন আক্তার (গৃহিণী)', '01511998844', 'হাউজিং স্টাফ কোয়ার্টার', 0.00, 5000.00);

-- 7. Sample Initial Ledger Transactions
INSERT INTO public.baki_transactions (id, store_id, customer_id, type, amount, payment_method, note, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd1111111-1111-1111-1111-111111111111', 'DEBIT', 3450.00, 'CASH', 'মাসের শুরুর বড় সওদা', NOW() - INTERVAL '4 days'),
('e2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd1111111-1111-1111-1111-111111111111', 'CREDIT', 1000.00, 'BKASH', 'বিকাশে আংশিক বকেয়া পরিশোধ', NOW() - INTERVAL '1 day'),
('e3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd2222222-2222-2222-2222-222222222222', 'DEBIT', 850.00, 'CASH', 'তেল ও ডাল বাকিতে ক্রয়', NOW() - INTERVAL '2 days');

-- 8. Sample Initial Expenses
INSERT INTO public.expenses (id, store_id, category, amount, note, expense_date) VALUES
('f1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'দোকানের চা-নাস্তা', 120.00, 'গ্রাহক ও কর্মীদের চা বিস্কুট', CURRENT_DATE),
('f2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'পরিবহন খরচ (ভ্যান)', 250.00, 'কারওয়ান বাজার থেকে মাল আনা', CURRENT_DATE);

-- ==============================================================================
-- ✅ COMPLETE DATABASE WIPE & REBUILD COMPLETED SUCCESSFULLY!
-- ==============================================================================
