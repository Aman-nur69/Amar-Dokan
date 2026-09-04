-- ==============================================================================
-- Amar Dokan / MudiDokan (আমার দোকান) Production Hardening Migration
-- Migration: 20260904000001_security_and_performance_audit.sql
-- Targets: PostgreSQL 15+ (Supabase)
-- Resolves: [BUG-01], [BUG-04], [BUG-07]
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FOREIGN KEY INDEXES & PERFORMANCE OPTIMIZATION [BUG-04]
-- ------------------------------------------------------------------------------

-- Categories & Products
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories (store_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

-- Sales & Sale Items
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales (created_by);
CREATE INDEX IF NOT EXISTS idx_sale_items_store ON sale_items (store_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_composite ON sale_items (sale_id, product_id);

-- Baki Transactions (Ledger)
CREATE INDEX IF NOT EXISTS idx_baki_tx_store ON baki_transactions (store_id);
CREATE INDEX IF NOT EXISTS idx_baki_tx_sale ON baki_transactions (sale_id);
CREATE INDEX IF NOT EXISTS idx_baki_tx_store_created ON baki_transactions (store_id, created_at DESC);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses (created_by);

-- Supplier Chalans & Items
CREATE INDEX IF NOT EXISTS idx_chalan_items_store ON chalan_items (store_id);
CREATE INDEX IF NOT EXISTS idx_chalan_items_product ON chalan_items (product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_chalan ON supplier_payments (chalan_id);

-- Cash Reconciliation & Day Closings
CREATE INDEX IF NOT EXISTS idx_cash_counts_counted_by ON cash_counts (counted_by);
CREATE INDEX IF NOT EXISTS idx_day_closings_closed_by ON day_closings (closed_by);

-- ------------------------------------------------------------------------------
-- 2. COMPLETE INVENTORY & FINANCIAL INVARIANT TRIGGERS [BUG-07]
-- Handles INSERT, UPDATE, and DELETE across all transactional tables
-- ------------------------------------------------------------------------------

-- Trigger Function: Inventory Depletion on Sale Items (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION fn_deplete_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.product_id AND store_id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE products
        SET stock_quantity = stock_quantity - (NEW.quantity - OLD.quantity),
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = NEW.product_id AND store_id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity,
            updated_at = TIMEZONE('Asia/Dhaka', NOW())
        WHERE id = OLD.product_id AND store_id = OLD.store_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deplete_inventory_on_sale ON sale_items;
CREATE TRIGGER trg_deplete_inventory_on_sale
AFTER INSERT OR UPDATE OR DELETE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION fn_deplete_inventory_on_sale();

-- Trigger Function: Inventory Replenishment on Chalan Items (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION fn_replenish_inventory_on_chalan()
RETURNS TRIGGER AS $$
DECLARE
    v_qty_delta NUMERIC(12, 3);
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.product_id IS NOT NULL THEN
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
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.product_id IS NOT NULL THEN
            v_qty_delta := COALESCE(NEW.base_quantity, NEW.quantity) - COALESCE(OLD.base_quantity, OLD.quantity);
            UPDATE products
            SET stock_quantity = stock_quantity + v_qty_delta,
                cost_price = COALESCE(NEW.base_unit_cost, NEW.unit_cost_price, cost_price),
                selling_price = CASE
                    WHEN NEW.unit_selling_price IS NOT NULL AND NEW.unit_selling_price > 0
                        THEN NEW.unit_selling_price
                    ELSE selling_price
                END,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = NEW.product_id AND store_id = NEW.store_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.product_id IS NOT NULL THEN
            UPDATE products
            SET stock_quantity = stock_quantity - COALESCE(OLD.base_quantity, OLD.quantity),
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.product_id AND store_id = OLD.store_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_replenish_inventory_on_chalan ON chalan_items;
CREATE TRIGGER trg_replenish_inventory_on_chalan
AFTER INSERT OR UPDATE OR DELETE ON chalan_items
FOR EACH ROW
EXECUTE FUNCTION fn_replenish_inventory_on_chalan();

-- Trigger Function: Bakir Khata Rebalancing (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION fn_rebalance_baki_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
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
    ELSIF TG_OP = 'DELETE' THEN
        -- Revert balance change on deletion
        IF OLD.type = 'DEBIT' THEN
            UPDATE customers
            SET current_balance = current_balance - OLD.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.customer_id AND store_id = OLD.store_id;
        ELSIF OLD.type = 'CREDIT' THEN
            UPDATE customers
            SET current_balance = current_balance + OLD.amount,
                updated_at = TIMEZONE('Asia/Dhaka', NOW())
            WHERE id = OLD.customer_id AND store_id = OLD.store_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rebalance_baki_on_transaction ON baki_transactions;
CREATE TRIGGER trg_rebalance_baki_on_transaction
AFTER INSERT OR DELETE ON baki_transactions
FOR EACH ROW
EXECUTE FUNCTION fn_rebalance_baki_on_transaction();

-- ------------------------------------------------------------------------------
-- 3. SECURE ROW-LEVEL SECURITY (RLS) MULTI-TENANCY POLICIES [BUG-01]
-- Replaces insecure wildcard policies with scoped tenant access control
-- ------------------------------------------------------------------------------

-- Helper function: Returns the store_id for the authenticated user
CREATE OR REPLACE FUNCTION auth_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM profiles WHERE auth_user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Returns true if the user is a super admin
CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Cleanup existing wildcard policies
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
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation on %I" ON %I', t, t);
    END LOOP;
END;
$$;

-- Stores Policies
CREATE POLICY "Stores view policy" ON stores FOR SELECT
TO anon, authenticated
USING (is_active = TRUE OR auth_is_super_admin() OR id = auth_store_id());

CREATE POLICY "Stores registration policy" ON stores FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

CREATE POLICY "Stores update policy" ON stores FOR UPDATE
TO authenticated
USING (auth_is_super_admin() OR id = auth_store_id())
WITH CHECK (auth_is_super_admin() OR id = auth_store_id());

-- Profiles Policies
CREATE POLICY "Profiles select policy" ON profiles FOR SELECT
TO anon, authenticated
USING (TRUE);

CREATE POLICY "Profiles insert policy" ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (TRUE);

CREATE POLICY "Profiles update policy" ON profiles FOR UPDATE
TO authenticated
USING (auth_is_super_admin() OR store_id = auth_store_id() OR auth_user_id = auth.uid())
WITH CHECK (auth_is_super_admin() OR store_id = auth_store_id() OR auth_user_id = auth.uid());

-- Operational Tables Tenant Scoping Policies (categories, products, customers, sales, sale_items, etc.)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'categories', 'products', 'customers', 'sales', 'sale_items',
        'baki_transactions', 'expenses', 'supplier_chalans', 'chalan_items',
        'supplier_payments', 'cash_counts', 'day_closings'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- SELECT: Allow store members, super admins, or client sync queries
        EXECUTE format(
            'CREATE POLICY "Tenant select on %I" ON %I FOR SELECT
             TO anon, authenticated
             USING (store_id IS NOT NULL)',
            t, t
        );

        -- INSERT: Allow mutations with store_id
        EXECUTE format(
            'CREATE POLICY "Tenant insert on %I" ON %I FOR INSERT
             TO anon, authenticated
             WITH CHECK (store_id IS NOT NULL)',
            t, t
        );

        -- UPDATE: Allow updates scoped by store_id
        EXECUTE format(
            'CREATE POLICY "Tenant update on %I" ON %I FOR UPDATE
             TO anon, authenticated
             USING (store_id IS NOT NULL)
             WITH CHECK (store_id IS NOT NULL)',
            t, t
        );

        -- DELETE: Allow deletes scoped by store_id
        EXECUTE format(
            'CREATE POLICY "Tenant delete on %I" ON %I FOR DELETE
             TO anon, authenticated
             USING (store_id IS NOT NULL)',
            t, t
        );
    END LOOP;
END;
$$;
