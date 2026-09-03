// ==============================================================================
// MudiDokan (মুদিদোকান) Inventory & Stock Management Hook
// Stock Status Badges, Supplier Arrival Adjustments, & Company Chalan Engine
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { db, buildSyncItem } from '../db/offlineDb';
import { useAuthStore } from './useAuthStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  Product,
  Category,
  ProductUnit,
  SupplierChalan,
  ChalanItem,
  SupplierPayment,
} from '../@types/database.types';
import { round2, round3, toBaseQuantity, toBaseUnitPrice, UNIT_LABELS_BN } from '../lib/units';
import { matchesProduct } from '../lib/phoneticSearch';

export function useInventory() {
  const { activeStoreId } = useAuthStore();
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
    if (!activeStoreId) {
      setProducts([]);
      setCategories([]);
      setChalans([]);
      setChalanItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        try {
          const [sbProds, sbCats, sbChalans, sbChalanItems] = await Promise.all([
            supabase.from('products').select('*').eq('store_id', activeStoreId),
            supabase.from('categories').select('*').eq('store_id', activeStoreId),
            supabase.from('supplier_chalans').select('*').eq('store_id', activeStoreId),
            supabase.from('chalan_items').select('*').eq('store_id', activeStoreId),
          ]);

          if (sbProds.data) {
            await db.products.where('store_id').equals(activeStoreId).delete();
            if (sbProds.data.length > 0) await db.products.bulkPut(sbProds.data);
          }
          if (sbCats.data) {
            await db.categories.where('store_id').equals(activeStoreId).delete();
            if (sbCats.data.length > 0) await db.categories.bulkPut(sbCats.data);
          }
          if (sbChalans.data) {
            await db.supplier_chalans.where('store_id').equals(activeStoreId).delete();
            if (sbChalans.data.length > 0) await db.supplier_chalans.bulkPut(sbChalans.data);
          }
          if (sbChalanItems.data) {
            await db.chalan_items.where('store_id').equals(activeStoreId).delete();
            if (sbChalanItems.data.length > 0) await db.chalan_items.bulkPut(sbChalanItems.data);
          }
        } catch (sbErr) {
          console.warn('[useInventory] Supabase live fetch note:', sbErr);
        }
      }

      const allProducts = await db.products.where('store_id').equals(activeStoreId).toArray();
      allProducts.sort((a, b) => a.name_bn.localeCompare(b.name_bn, 'bn'));
      setProducts(allProducts);

      const allCats = await db.categories.where('store_id').equals(activeStoreId).toArray();
      setCategories(allCats);

      const allChalans = await db.supplier_chalans.where('store_id').equals(activeStoreId).toArray();
      allChalans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setChalans(allChalans);

      const allChalanItems = await db.chalan_items.where('store_id').equals(activeStoreId).toArray();
      setChalanItems(allChalanItems);
    } catch (err) {
      console.error('[useInventory] Failed to load stock or chalans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  /**
   * Adjusts stock for a single product.
   *
   * `mode` is explicit on purpose: the caller used to pass the entered quantity
   * while this function treated it as the new absolute total, so "add 20 kg"
   * silently replaced 300 kg of rice with 20 kg.
   */
  const adjustStock = async (
    productId: string,
    quantity: number,
    mode: 'ADD' | 'SET' = 'SET',
    reason?: string
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const product = await db.products.get(productId);
      if (!product) return false;

      const entered = Number(quantity) || 0;
      const resolved = mode === 'ADD' ? product.stock_quantity + entered : entered;
      const cleanStock = round3(Math.max(0, resolved));

      await db.products.update(productId, {
        stock_quantity: cleanStock,
        updated_at: now,
      });

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('products')
            .update({ stock_quantity: cleanStock, updated_at: now })
            .eq('id', productId);
        } catch (sbErr) {
          console.warn('[useInventory] Supabase direct stock adjust note:', sbErr);
        }
      }

      // Fallback queue item
      await db.sync_queue.add(
        buildSyncItem('products', 'UPDATE', {
          id: productId,
          stock_quantity: cleanStock,
          updated_at: now,
          reason: reason || mode,
        })
      );

      await refreshInventory();
      return true;
    } catch (err) {
      console.error('[useInventory] Stock adjust error:', err);
      return false;
    }
  };

  /**
   * Adjusts stock on an existing product with financial accounting (Cash vs Supplier Baki vs Audit).
   */
  const adjustStockWithPurchase = async (params: {
    productId: string;
    addQuantity: number;
    purchaseType: 'CASH' | 'BAKI' | 'AUDIT';
    unitCostPrice?: number;
    supplierName?: string;
    paidAmount?: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const product = await db.products.get(params.productId);
      if (!product) return false;

      const newStock = round3(Math.max(0, product.stock_quantity + params.addQuantity));
      const costPrice = params.unitCostPrice ?? product.cost_price;
      const totalAmount = round2(params.addQuantity * costPrice);

      // Update product stock and cost price
      await db.products.update(params.productId, {
        stock_quantity: newStock,
        cost_price: costPrice > 0 ? costPrice : product.cost_price,
        updated_at: now,
      });

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('products').update({
            stock_quantity: newStock,
            cost_price: costPrice > 0 ? costPrice : product.cost_price,
            updated_at: now,
          }).eq('id', params.productId);
        } catch (sbErr) {
          console.warn('[useInventory] Supabase direct adjust purchase note:', sbErr);
        }
      }

      await db.sync_queue.add(
        buildSyncItem('products', 'UPDATE', {
          id: params.productId,
          stock_quantity: newStock,
          cost_price: costPrice > 0 ? costPrice : product.cost_price,
          updated_at: now,
        })
      );

      // If financial purchase (Cash or Baki), generate a Supplier Chalan
      if (params.purchaseType === 'CASH' || params.purchaseType === 'BAKI') {
        const isCash = params.purchaseType === 'CASH';
        const paid = isCash ? totalAmount : (params.paidAmount || 0);
        const due = Math.max(0, round2(totalAmount - paid));
        const chalanId = crypto.randomUUID();
        const chalanNo = `CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const storeId = product.store_id || activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const supplier = params.supplierName?.trim() || (isCash ? 'নগদ মহাজন / বাজার ক্রয়' : 'কোম্পানি মহাজন');

        const newChalan: SupplierChalan = {
          id: chalanId,
          store_id: storeId,
          chalan_no: chalanNo,
          supplier_name: supplier,
          chalan_date: now.split('T')[0],
          total_amount: totalAmount,
          paid_amount: paid,
          due_amount: due,
          items_count: 1,
          payment_method: isCash ? 'CASH' : due === totalAmount ? 'DUE' : 'PARTIAL_CASH',
          notes:
            params.notes ||
            (isCash
              ? `মজুদ ক্রয় — নগদ পরিশোধ (${product.name_bn})`
              : `বাকিতে স্টক বৃদ্ধি (${product.name_bn})`),
          created_at: now,
        };

        const chalanItemRecord: ChalanItem = {
          id: crypto.randomUUID(),
          store_id: storeId,
          chalan_id: chalanId,
          product_id: product.id,
          product_name_bn: product.name_bn,
          quantity: params.addQuantity,
          unit: product.unit,
          unit_cost_price: costPrice,
          subtotal: totalAmount,
          created_at: now,
        };

        await db.transaction('rw', [db.supplier_chalans, db.chalan_items, db.sync_queue], async () => {
          await db.supplier_chalans.add(newChalan);
          await db.chalan_items.add(chalanItemRecord);

          await db.sync_queue.add(
            buildSyncItem('supplier_chalans', 'INSERT', {
              id: newChalan.id,
              store_id: newChalan.store_id,
              chalan_no: newChalan.chalan_no,
              supplier_name: newChalan.supplier_name,
              chalan_date: newChalan.chalan_date,
              total_amount: newChalan.total_amount,
              paid_amount: newChalan.paid_amount,
              due_amount: newChalan.due_amount,
              items_count: newChalan.items_count,
              payment_method: newChalan.payment_method,
              notes: newChalan.notes,
              created_at: now,
            })
          );

          await db.sync_queue.add(
            buildSyncItem('chalan_items', 'INSERT', {
              id: chalanItemRecord.id,
              store_id: chalanItemRecord.store_id,
              chalan_id: chalanItemRecord.chalan_id,
              product_id: chalanItemRecord.product_id,
              product_name_bn: chalanItemRecord.product_name_bn,
              quantity: chalanItemRecord.quantity,
              unit: chalanItemRecord.unit,
              unit_cost_price: chalanItemRecord.unit_cost_price,
              subtotal: chalanItemRecord.subtotal,
              created_at: now,
            })
          );
        });
      }

      await refreshInventory();
      return true;
    } catch (err) {
      console.error('[useInventory] adjustStockWithPurchase error:', err);
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
      const targetStoreId = activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const newChalan: SupplierChalan = {
        id: chalanId,
        store_id: targetStoreId,
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

      // Resolve base-unit figures once, here, so the local write and the cloud
      // trigger apply exactly the same replenishment.
      const productsById = new Map(
        (await db.products.where('store_id').equals(targetStoreId).toArray()).map((p) => [p.id, p])
      );

      const chalanItemRecords: ChalanItem[] = items.map((it) => {
        const baseUnit = productsById.get(it.product_id)?.unit || it.unit;
        return {
          id: crypto.randomUUID(),
          store_id: targetStoreId,
          chalan_id: chalanId,
          product_id: it.product_id,
          product_name_bn: it.product_name_bn,
          quantity: it.quantity,
          unit: it.unit,
          unit_cost_price: it.unit_cost_price,
          base_quantity: toBaseQuantity(it.quantity, it.unit, baseUnit),
          base_unit_cost: round2(toBaseUnitPrice(it.unit_cost_price, it.unit, baseUnit)),
          unit_selling_price: it.unit_selling_price,
          subtotal: it.subtotal,
          created_at: now,
        };
      });

      // Atomic transaction: Insert Chalan, Insert Items, Increment Products Stock, Update Cost Price
      await db.transaction(
        'rw',
        [db.supplier_chalans, db.chalan_items, db.products, db.sync_queue],
        async () => {
          await db.supplier_chalans.add(newChalan);
          await db.chalan_items.bulkAdd(chalanItemRecords);
          await db.sync_queue.add(
            buildSyncItem('supplier_chalans', 'INSERT', newChalan as unknown as Record<string, unknown>)
          );

          for (const item of chalanItemRecords) {
            let product = await db.products.get(item.product_id);

            // Fallback by name must stay inside this shop: an unscoped lookup
            // could replenish (and reprice) another tenant's product.
            if (!product && item.product_name_bn) {
              product = await db.products
                .where('store_id')
                .equals(targetStoreId)
                .and((p) => p.name_bn === item.product_name_bn)
                .first();
            }

            if (product) {
              // Chalan lines are entered in the supplier's unit (e.g. 500 gm),
              // stock is held in the product's base unit (kg).
              const addedQty = item.base_quantity ?? toBaseQuantity(item.quantity, item.unit, product.unit);
              const updatedStock = round3(Math.max(0, (Number(product.stock_quantity) || 0) + addedQty));

              const productUpdates: Partial<Product> = {
                stock_quantity: updatedStock,
                cost_price: round2(item.base_unit_cost || product.cost_price),
                updated_at: now,
              };

              if (item.unit_selling_price && Number(item.unit_selling_price) > 0) {
                productUpdates.selling_price = round2(Number(item.unit_selling_price));
              }

              await db.products.update(product.id, productUpdates);
              console.log(
                `[MudiDokan Stock] Replenished ${product.name_bn}: +${addedQty} -> ${updatedStock} ${UNIT_LABELS_BN[product.unit] || product.unit}`
              );
            }

            // One queue row per table row - a nested {chalan, items} envelope
            // can never be inserted into a flat table.
            await db.sync_queue.add(
              buildSyncItem('chalan_items', 'INSERT', item as unknown as Record<string, unknown>)
            );
          }
          if (isSupabaseConfigured()) {
            try {
              await supabase.from('supplier_chalans').insert(newChalan);
              await supabase.from('chalan_items').insert(chalanItemRecords);
              for (const item of chalanItemRecords) {
                const prod = await db.products.get(item.product_id);
                if (prod) {
                  await supabase.from('products').update({
                    stock_quantity: prod.stock_quantity,
                    cost_price: prod.cost_price,
                    selling_price: prod.selling_price,
                    updated_at: now,
                  }).eq('id', item.product_id);
                }
              }
            } catch (sbErr) {
              console.warn('[useInventory] Supabase chalan direct insert note:', sbErr);
            }
          }
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

      const newPaid = round2(Number(chalan.paid_amount || 0) + payAmount);
      const newDue = round2(Math.max(0, currentDue - payAmount));
      const now = new Date().toISOString();

      const paymentRecord: SupplierPayment = {
        id: crypto.randomUUID(),
        store_id: chalan.store_id || activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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

        if (isSupabaseConfigured()) {
          try {
            await supabase.from('supplier_chalans').update({
              paid_amount: newPaid,
              due_amount: newDue,
            }).eq('id', chalanId);
            await supabase.from('supplier_payments').insert(paymentRecord);
          } catch (sbErr) {
            console.warn('[useInventory] Supabase direct supplier payment note:', sbErr);
          }
        }

        await db.sync_queue.add(
          buildSyncItem('supplier_payments', 'INSERT', paymentRecord as unknown as Record<string, unknown>)
        );
        await db.sync_queue.add(
          buildSyncItem('supplier_chalans', 'UPDATE', {
            id: chalanId,
            paid_amount: newPaid,
            due_amount: newDue,
          })
        );
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
      const targetStoreId = activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const newProduct: Product = {
        id: crypto.randomUUID(),
        store_id: targetStoreId,
        ...productData,
        is_quick_item: Boolean(productData.is_quick_item),
        created_at: now,
        updated_at: now,
      };

      await db.products.add(newProduct);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('products').insert(newProduct);
        } catch (sbErr) {
          console.warn('[useInventory] Supabase direct addProduct note:', sbErr);
        }
      }

      await db.sync_queue.add(
        buildSyncItem('products', 'INSERT', newProduct as unknown as Record<string, unknown>)
      );

      await refreshInventory();
      return { success: true };
    } catch (err) {
      console.error('[useInventory] Add product error:', err);
      return { success: false, error: 'পণ্য যোগ করতে সমস্যা হয়েছে।' };
    }
  };

  // Filter products based on search, status badge, and category
  const filteredProducts = products.filter((p) => {
    // Bengali, English, barcode or English phonetics ("chini", "tel").
    if (!matchesProduct(p, searchQuery)) return false;

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
    adjustStockWithPurchase,
    addProduct,
    saveSupplierChalan,
    paySupplierDue,
    refreshInventory,
  };
}
