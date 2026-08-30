// ==============================================================================
// MudiDokan (মুদিদোকান) Inventory & Stock Management Hook
// Stock Status Badges, Supplier Arrival Adjustments, & Company Chalan Engine
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { db, DEFAULT_STORE } from '../db/offlineDb';
import {
  Product,
  Category,
  SyncQueueItem,
  ProductUnit,
  SupplierChalan,
  ChalanItem,
  SupplierPayment,
} from '../@types/database.types';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [chalans, setChalans] = useState<SupplierChalan[]>([]);
  const [chalanItems, setChalanItems] = useState<ChalanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chalanSearchQuery, setChalanSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const refreshInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await db.products.toArray();
      allProducts.sort((a, b) => a.name_bn.localeCompare(b.name_bn, 'bn'));
      setProducts(allProducts);

      const allCats = await db.categories.toArray();
      setCategories(allCats);

      const allChalans = await db.supplier_chalans.toArray();
      allChalans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setChalans(allChalans);

      const allChalanItems = await db.chalan_items.toArray();
      setChalanItems(allChalanItems);
    } catch (err) {
      console.error('[useInventory] Failed to load stock or chalans:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  /**
   * Adjusts stock quantity for a single product (e.g. manual audit or damaged goods)
   */
  const adjustStock = async (productId: string, newStock: number, reason?: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const product = await db.products.get(productId);
      if (!product) return false;

      const cleanStock = Math.max(0, Math.round(newStock * 1000) / 1000);

      await db.products.update(productId, {
        stock_quantity: cleanStock,
        updated_at: now,
      });

      // Queue sync mutation
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: 'products',
        action: 'UPDATE',
        payload: {
          id: productId,
          stock_quantity: cleanStock,
          reason: reason || 'ম্যানুয়াল স্টক অ্যাডজাস্টমেন্ট',
          updated_at: now,
        },
        created_at: now,
        retry_count: 0,
        status: 'PENDING',
      });

      await refreshInventory();
      return true;
    } catch (err) {
      console.error('[useInventory] Stock adjust error:', err);
      return false;
    }
  };

  /**
   * Records a new Supplier/Company Delivery Chalan (কোম্পানির চালান)
   * Atomically replenishes stock quantities for all items and updates cost/selling prices
   */
  const saveSupplierChalan = async (
    chalanData: {
      chalan_no: string;
      supplier_name: string;
      supplier_phone?: string;
      chalan_date: string;
      total_amount: number;
      paid_amount: number;
      due_amount: number;
      payment_method: string;
      notes?: string;
    },
    items: {
      product_id: string;
      product_name_bn: string;
      quantity: number;
      unit: ProductUnit;
      unit_cost_price: number;
      unit_selling_price?: number;
      subtotal: number;
    }[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!chalanData.supplier_name.trim()) {
      return { success: false, error: 'কোম্পানি বা মহাজনের নাম আবশ্যক।' };
    }
    if (items.length === 0) {
      return { success: false, error: 'চালানে অন্তত একটি পণ্য যোগ করতে হবে।' };
    }

    try {
      const now = new Date().toISOString();
      const chalanId = crypto.randomUUID();

      const newChalan: SupplierChalan = {
        id: chalanId,
        store_id: DEFAULT_STORE.id,
        chalan_no: chalanData.chalan_no.trim() || `CH-${Date.now().toString().slice(-6)}`,
        supplier_name: chalanData.supplier_name.trim(),
        supplier_phone: chalanData.supplier_phone?.trim(),
        chalan_date: chalanData.chalan_date,
        total_amount: chalanData.total_amount,
        paid_amount: chalanData.paid_amount,
        due_amount: chalanData.due_amount,
        payment_method: chalanData.payment_method,
        items_count: items.length,
        notes: chalanData.notes?.trim(),
        created_at: now,
      };

      const chalanItemRecords: ChalanItem[] = items.map((it) => ({
        id: crypto.randomUUID(),
        store_id: DEFAULT_STORE.id,
        chalan_id: chalanId,
        product_id: it.product_id,
        product_name_bn: it.product_name_bn,
        quantity: it.quantity,
        unit: it.unit,
        unit_cost_price: it.unit_cost_price,
        unit_selling_price: it.unit_selling_price,
        subtotal: it.subtotal,
        created_at: now,
      }));

      // Atomic transaction: Insert Chalan, Insert Items, Increment Products Stock, Update Cost Price
      await db.transaction(
        'rw',
        [db.supplier_chalans, db.chalan_items, db.products, db.sync_queue],
        async () => {
          await db.supplier_chalans.add(newChalan);
          await db.chalan_items.bulkAdd(chalanItemRecords);

          for (const item of chalanItemRecords) {
            let product = await db.products.get(item.product_id);
            if (!product && item.product_name_bn) {
              product = await db.products.where('name_bn').equals(item.product_name_bn).first();
            }

            if (product) {
              const currentStock = Number(product.stock_quantity) || 0;
              const addedQty = Number(item.quantity) || 0;
              const updatedStock = Math.max(0, Math.round((currentStock + addedQty) * 1000) / 1000);

              const productUpdates: Partial<Product> = {
                stock_quantity: updatedStock,
                cost_price: Number(item.unit_cost_price) || Number(product.cost_price),
                updated_at: now,
              };

              if (item.unit_selling_price && Number(item.unit_selling_price) > 0) {
                productUpdates.selling_price = Number(item.unit_selling_price);
              }

              await db.products.update(product.id, productUpdates);
              console.log(`[MudiDokan Stock] Replenished ${product.name_bn}: +${addedQty} -> ${updatedStock} ${product.unit}`);
            }
          }

          // Queue sync
          await db.sync_queue.add({
            id: crypto.randomUUID(),
            table_name: 'supplier_chalans',
            action: 'INSERT',
            payload: {
              chalan: newChalan,
              items: chalanItemRecords,
            },
            created_at: now,
            retry_count: 0,
            status: 'PENDING',
          });
        }
      );

      await refreshInventory();
      return { success: true };
    } catch (err) {
      console.error('[useInventory] Save chalan error:', err);
      return { success: false, error: 'চালান সংরক্ষণ করতে সমস্যা হয়েছে।' };
    }
  };

  /**
   * Records a payment towards an outstanding supplier chalan due
   */
  const paySupplierDue = async (
    chalanId: string,
    amount: number,
    paymentMethod: 'CASH' | 'BKASH' | 'BANK',
    note?: string
  ): Promise<{ success: boolean; error?: string; newDue?: number }> => {
    try {
      const chalan = await db.supplier_chalans.get(chalanId);
      if (!chalan) {
        return { success: false, error: 'চালানটি পাওয়া যায়নি।' };
      }

      const currentDue = Number(chalan.due_amount || 0);
      if (currentDue <= 0) {
        return { success: false, error: 'এই চালানের কোনো বকেয়া অবশিষ্ট নেই।' };
      }

      const payAmount = Math.min(Number(amount), currentDue);
      if (payAmount <= 0) {
        return { success: false, error: 'পরিশোধের পরিমাণ শূন্য হতে পারবে না।' };
      }

      const newPaid = Number(chalan.paid_amount || 0) + payAmount;
      const newDue = Math.max(0, currentDue - payAmount);
      const now = new Date().toISOString();

      const paymentRecord: SupplierPayment = {
        id: crypto.randomUUID(),
        store_id: DEFAULT_STORE.id,
        chalan_id: chalan.id,
        chalan_no: chalan.chalan_no,
        supplier_name: chalan.supplier_name,
        amount: payAmount,
        payment_method: paymentMethod || 'CASH',
        payment_date: now.split('T')[0],
        note: note || 'চালান বাকি পরিশোধ',
        created_at: now,
      };

      await db.transaction('rw', [db.supplier_chalans, db.supplier_payments, db.sync_queue], async () => {
        await db.supplier_chalans.update(chalanId, {
          paid_amount: newPaid,
          due_amount: newDue,
        });

        await db.supplier_payments.add(paymentRecord);

        await db.sync_queue.add({
          id: crypto.randomUUID(),
          table_name: 'supplier_payments',
          action: 'INSERT',
          payload: paymentRecord as unknown as Record<string, unknown>,
          created_at: now,
          retry_count: 0,
          status: 'PENDING',
        });
      });

      await refreshInventory();
      return { success: true, newDue };
    } catch (err) {
      console.error('[useInventory] Pay supplier due error:', err);
      return { success: false, error: 'বকেয়া পরিশোধ রেকর্ড করতে সমস্যা হয়েছে।' };
    }
  };

  /**
   * Adds a new product to inventory
   */
  const addProduct = async (productData: {
    name_bn: string;
    name_en?: string;
    barcode?: string;
    category_id?: string;
    unit: ProductUnit;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    min_stock_alert: number;
    is_quick_item?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!productData.name_bn.trim()) {
      return { success: false, error: 'পণ্যের বাংলা নাম অবশ্যই দিতে হবে।' };
    }

    try {
      const now = new Date().toISOString();
      const newProduct: Product = {
        id: crypto.randomUUID(),
        store_id: DEFAULT_STORE.id,
        ...productData,
        is_quick_item: Boolean(productData.is_quick_item),
        created_at: now,
        updated_at: now,
      };

      await db.products.add(newProduct);

      // Queue sync
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: 'products',
        action: 'INSERT',
        payload: newProduct as unknown as Record<string, unknown>,
        created_at: now,
        retry_count: 0,
        status: 'PENDING',
      });

      await refreshInventory();
      return { success: true };
    } catch (err) {
      console.error('[useInventory] Add product error:', err);
      return { success: false, error: 'পণ্য যোগ করতে সমস্যা হয়েছে।' };
    }
  };

  // Filter products based on search, status badge, and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));

    if (!matchesSearch) return false;

    if (selectedCategory !== 'ALL' && p.category_id !== selectedCategory) {
      return false;
    }

    const isOutOfStock = p.stock_quantity <= 0;
    const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert;

    if (statusFilter === 'OUT_OF_STOCK') return isOutOfStock;
    if (statusFilter === 'LOW_STOCK') return isLowStock;
    if (statusFilter === 'IN_STOCK') return !isOutOfStock && !isLowStock;

    return true;
  });

  // Filter chalans based on chalan search query
  const filteredChalans = chalans.filter(
    (c) =>
      c.supplier_name.toLowerCase().includes(chalanSearchQuery.toLowerCase()) ||
      c.chalan_no.toLowerCase().includes(chalanSearchQuery.toLowerCase()) ||
      (c.supplier_phone && c.supplier_phone.includes(chalanSearchQuery))
  );

  // Aggregated Stock Metrics
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert
  ).length;

  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;

  const totalValuation = products.reduce(
    (acc, p) => acc + p.stock_quantity * p.cost_price,
    0
  );

  // Aggregated Chalan Metrics
  const totalChalansCount = chalans.length;
  const totalChalanValuation = chalans.reduce((acc, c) => acc + c.total_amount, 0);
  const totalSupplierPaid = chalans.reduce((acc, c) => acc + c.paid_amount, 0);
  const totalSupplierDue = chalans.reduce((acc, c) => acc + c.due_amount, 0);

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    chalans: filteredChalans,
    allChalans: chalans,
    chalanItems,
    isLoading,
    searchQuery,
    setSearchQuery,
    chalanSearchQuery,
    setChalanSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCategory,
    setSelectedCategory,
    lowStockCount,
    outOfStockCount,
    totalValuation,
    totalChalansCount,
    totalChalanValuation,
    totalSupplierPaid,
    totalSupplierDue,
    adjustStock,
    addProduct,
    saveSupplierChalan,
    paySupplierDue,
    refreshInventory,
  };
}
