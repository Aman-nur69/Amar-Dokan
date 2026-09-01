// ==============================================================================
// MudiDokan (মুদিদোকান) Sales & Financial Transaction Engine
// Atomically commits sales, updates stock, creates ledger dues, and returns receipt
<<<<<<< HEAD
// ==============================================================================

import { useState } from 'react';
import { db } from '../db/offlineDb';
import { useAuthStore } from './useAuthStore';
import { Sale, SaleItem, BakiTransaction, SyncQueueItem } from '../@types/database.types';
import { ThermalReceiptData } from '../@types/pos.types';
import { useCartStore } from './useCartStore';
import confetti from 'canvas-confetti';

export function useSalesEngine() {
  const { activeStoreId } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ThermalReceiptData | null>(null);

  const {
    items,
    cartDiscount,
=======
//
// Sync contract: the client writes local state AND enqueues the raw rows.
// Derived server-side effects (stock depletion, khata rebalancing) are owned by
// the SQL triggers, so we never enqueue products.stock_quantity or
// customers.current_balance from a sale — that would apply the change twice.
// ==============================================================================

import { useState } from 'react';
import { db, buildSyncItem } from '../db/offlineDb';
import { useAuthStore } from './useAuthStore';
import { Sale, SaleItem, BakiTransaction, MfsProvider } from '../@types/database.types';
import { ThermalReceiptData } from '../@types/pos.types';
import { useCartStore } from './useCartStore';
import { toast } from './useToastStore';
import { todayDhakaKey } from '../lib/dateUtils';
import { round2, round3, toBaseQuantity, UNIT_LABELS_BN } from '../lib/units';
import confetti from 'canvas-confetti';

export interface CheckoutBlock {
  type: 'CREDIT_LIMIT';
  message: string;
  customerName: string;
  limit: number;
  projectedBalance: number;
}

export interface CheckoutOptions {
  /** Set once an authorised user has approved crossing the credit limit. */
  allowOverLimit?: boolean;
}

export function useSalesEngine() {
  const { activeStoreId, currentUser } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ThermalReceiptData | null>(null);
  const [blockedBy, setBlockedBy] = useState<CheckoutBlock | null>(null);

  const {
    items,
>>>>>>> c18622f (Bug Fix)
    selectedCustomer,
    paymentDetails,
    clearCart,
    getTotalAmount,
    getSubtotal,
    getTotalDiscount,
    setPaymentSheetOpen,
  } = useCartStore();

  /**
<<<<<<< HEAD
   * Generates a unique, readable invoice number with Bengali date prefix
   */
  const generateInvoiceNo = (): string => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MD-${dateStr}-${rand}`;
  };

  /**
   * Executes and commits the checkout transaction
   */
  const completeCheckout = async (overrideMethod?: 'CASH' | 'BAKI' | 'SPLIT'): Promise<ThermalReceiptData | null> => {
    if (items.length === 0) return null;

    setIsProcessing(true);
=======
   * Sequential, collision-free invoice number: MD-YYMMDD-#### counted per store
   * per business day. The previous random suffix could repeat, and the cloud
   * column is UNIQUE.
   */
  const generateInvoiceNo = async (storeId: string, businessDate: string): Promise<string> => {
    const datePart = businessDate.slice(2).replace(/-/g, '');
    const prefix = `MD-${datePart}-`;

    const todaysSales = await db.sales
      .where('store_id')
      .equals(storeId)
      .and((s) => (s.invoice_no || '').startsWith(prefix))
      .toArray();

    let nextSeq = todaysSales.length + 1;
    for (const sale of todaysSales) {
      const seq = parseInt((sale.invoice_no || '').slice(prefix.length), 10);
      if (!isNaN(seq) && seq >= nextSeq) nextSeq = seq + 1;
    }

    // Guard against any historical duplicate still sitting in the table.
    let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    while (await db.sales.where('invoice_no').equals(candidate).first()) {
      nextSeq += 1;
      candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    }
    return candidate;
  };

  /**
   * Executes and commits the checkout transaction.
   */
  const completeCheckout = async (
    overrideMethod?: 'CASH' | 'BAKI' | 'SPLIT',
    options: CheckoutOptions = {}
  ): Promise<ThermalReceiptData | null> => {
    if (items.length === 0) return null;
    if (isProcessing) return null;

    setIsProcessing(true);
    setBlockedBy(null);
>>>>>>> c18622f (Bug Fix)

    try {
      const totalAmount = getTotalAmount();
      const subtotal = getSubtotal();
      const totalDiscount = getTotalDiscount();
<<<<<<< HEAD
      const invoiceNo = generateInvoiceNo();
      const saleId = crypto.randomUUID();
      const now = new Date().toISOString();

      let paymentMethod = overrideMethod || paymentDetails.paymentMethod;
      let paidAmount = 0;
      let dueAmount = 0;

      if (paymentMethod === 'CASH') {
        paidAmount = totalAmount;
        dueAmount = 0;
      } else if (paymentMethod === 'BAKI') {
        paidAmount = 0;
        dueAmount = totalAmount;
      } else {
        // Split / partial payment
        const cashPart = paymentDetails.cashAmount || 0;
        const mfsPart = paymentDetails.mfsAmount || 0;
        paidAmount = cashPart + mfsPart;
        dueAmount = Math.max(0, totalAmount - paidAmount);
        if (dueAmount > 0 && paidAmount > 0) {
          paymentMethod = 'SPLIT';
        } else if (dueAmount > 0 && paidAmount === 0) {
          paymentMethod = 'BAKI';
        }
      }

      const targetStoreId = activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
=======
      const saleId = crypto.randomUUID();
      const now = new Date().toISOString();
      const businessDate = todayDhakaKey();
      const targetStoreId = activeStoreId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const invoiceNo = await generateInvoiceNo(targetStoreId, businessDate);

      let paymentMethod = overrideMethod || paymentDetails.paymentMethod;
      let cashPart = 0;
      let mfsPart = 0;

      if (paymentMethod === 'CASH') {
        cashPart = totalAmount;
      } else if (paymentMethod === 'BAKI') {
        cashPart = 0;
      } else {
        cashPart = round2(paymentDetails.cashAmount || 0);
        mfsPart = round2(paymentDetails.mfsAmount || 0);
      }

      // Never record more collected than the bill.
      const paidAmount = round2(Math.min(cashPart + mfsPart, totalAmount));
      if (paidAmount < cashPart + mfsPart) {
        cashPart = round2(Math.min(cashPart, totalAmount));
        mfsPart = round2(Math.max(0, paidAmount - cashPart));
      }
      const dueAmount = round2(Math.max(0, totalAmount - paidAmount));

      if (dueAmount > 0 && paidAmount > 0) paymentMethod = 'SPLIT';
      else if (dueAmount > 0) paymentMethod = 'BAKI';
      else if (mfsPart > 0 && cashPart === 0) paymentMethod = 'MFS';
      else paymentMethod = 'CASH';

      // A due sale must be attached to a khata, or the money is untraceable.
      if (dueAmount > 0 && !selectedCustomer) {
        toast.error('বাকি রাখতে হলে অবশ্যই একজন গ্রাহকের খাতা নির্বাচন করুন।');
        return null;
      }

      // --- Credit limit gate (previously stored and never checked) ----------
      if (dueAmount > 0 && selectedCustomer && !options.allowOverLimit) {
        const fresh = await db.customers.get(selectedCustomer.id);
        const currentBalance = Number(fresh?.current_balance ?? selectedCustomer.current_balance) || 0;
        const limit = Number(fresh?.credit_limit ?? selectedCustomer.credit_limit) || 0;
        const projected = round2(currentBalance + dueAmount);

        if (limit > 0 && projected > limit) {
          setBlockedBy({
            type: 'CREDIT_LIMIT',
            customerName: selectedCustomer.name,
            limit,
            projectedBalance: projected,
            message: 'গ্রাহকের বাকির সীমা ছাড়িয়ে যাচ্ছে।',
          });
          return null;
        }
      }
>>>>>>> c18622f (Bug Fix)

      // 1. Prepare Sale entity
      const saleRecord: Sale = {
        id: saleId,
        store_id: targetStoreId,
        customer_id: selectedCustomer?.id,
        invoice_no: invoiceNo,
<<<<<<< HEAD
=======
        business_date: businessDate,
>>>>>>> c18622f (Bug Fix)
        total_amount: totalAmount,
        discount_amount: totalDiscount,
        paid_amount: paidAmount,
        due_amount: dueAmount,
<<<<<<< HEAD
        payment_method: paymentMethod,
        notes: paymentDetails.notes,
=======
        cash_amount: cashPart,
        mfs_amount: mfsPart,
        mfs_provider: mfsPart > 0 ? (paymentDetails.mfsProvider as MfsProvider) : undefined,
        mfs_txn_id: mfsPart > 0 ? paymentDetails.mfsTxnId || undefined : undefined,
        payment_method: paymentMethod,
        notes: paymentDetails.notes,
        created_by: currentUser?.id,
>>>>>>> c18622f (Bug Fix)
        created_at: now,
        updated_at: now,
      };

<<<<<<< HEAD
      // 2. Prepare Sale Items
      const saleItemRecords: SaleItem[] = items.map((cartItem) => {
        const itemId = crypto.randomUUID();
        // Convert to base product unit quantity for inventory depletion
        let qtyInBaseUnit = cartItem.quantity;
        if (cartItem.product.unit === 'kg' && cartItem.selectedUnit === 'gm') {
          qtyInBaseUnit = cartItem.quantity / 1000;
        }

        return {
          id: itemId,
          store_id: targetStoreId,
          sale_id: saleId,
          product_id: cartItem.product.id,
          product_name_bn: cartItem.product.name_bn,
          quantity: qtyInBaseUnit,
          unit: cartItem.selectedUnit,
          unit_cost_price: cartItem.product.cost_price,
          unit_selling_price: cartItem.unitPrice,
          subtotal: cartItem.subtotal,
          created_at: now,
        };
      });

      // 3. Atomically execute local database updates
      await db.transaction('rw', [db.sales, db.sale_items, db.products, db.customers, db.baki_transactions, db.sync_queue], async () => {
        // Insert sale
        await db.sales.add(saleRecord);

        // Insert sale items and atomically decrement product inventory
        for (const item of saleItemRecords) {
          await db.sale_items.add(item);
          const product = await db.products.get(item.product_id);
          if (product) {
            const newStock = Math.max(0, product.stock_quantity - item.quantity);
=======
      // 2. Prepare Sale Items, converting every line into the product's base unit
      const saleItemRecords: SaleItem[] = items.map((cartItem) => ({
        id: crypto.randomUUID(),
        store_id: targetStoreId,
        sale_id: saleId,
        product_id: cartItem.product.id,
        product_name_bn: cartItem.product.name_bn,
        quantity: toBaseQuantity(cartItem.quantity, cartItem.selectedUnit, cartItem.product.unit),
        unit: cartItem.selectedUnit,
        unit_cost_price: cartItem.product.cost_price,
        unit_selling_price: cartItem.unitPrice,
        subtotal: cartItem.subtotal,
        created_at: now,
      }));

      const shortfalls: string[] = [];

      // 3. Atomically execute local database updates
      await db.transaction(
        'rw',
        [db.sales, db.sale_items, db.products, db.customers, db.baki_transactions, db.sync_queue],
        async () => {
          await db.sales.add(saleRecord);
          await db.sync_queue.add(
            buildSyncItem('sales', 'INSERT', saleRecord as unknown as Record<string, unknown>)
          );

          for (const item of saleItemRecords) {
            await db.sale_items.add(item);
            await db.sync_queue.add(
              buildSyncItem('sale_items', 'INSERT', item as unknown as Record<string, unknown>)
            );

            const product = await db.products.get(item.product_id);
            if (!product) continue;

            // Stock is allowed to go negative on purpose: a dokandar must never
            // be blocked from selling goods that are physically on the shelf.
            // Clamping to zero used to hide the discrepancy entirely.
            const newStock = round3(product.stock_quantity - item.quantity);
            if (newStock < 0) {
              shortfalls.push(
                `${product.name_bn} (${Math.abs(newStock)} ${UNIT_LABELS_BN[product.unit] || product.unit})`
              );
            }

>>>>>>> c18622f (Bug Fix)
            await db.products.update(item.product_id, {
              stock_quantity: newStock,
              updated_at: now,
            });
          }
<<<<<<< HEAD
        }

        // If due amount exists and customer is attached, rebalance customer's baki
        if (dueAmount > 0 && selectedCustomer) {
          const bakiTxId = crypto.randomUUID();
          const bakiTx: BakiTransaction = {
            id: bakiTxId,
            store_id: targetStoreId,
            customer_id: selectedCustomer.id,
            sale_id: saleId,
            type: 'DEBIT', // Customer owes more
            amount: dueAmount,
            payment_method: 'CASH',
            note: `ইনভয়েস #${invoiceNo} থেকে বাকি`,
            customer_name: selectedCustomer.name,
            customer_phone: selectedCustomer.phone,
            created_at: now,
          };

          await db.baki_transactions.add(bakiTx);

          // Update customer current_balance
          const customer = await db.customers.get(selectedCustomer.id);
          if (customer) {
            const newBalance = customer.current_balance + dueAmount;
            await db.customers.update(selectedCustomer.id, {
              current_balance: newBalance,
              updated_at: now,
            });
          }
        }

        // Queue sync mutation for background push
        const syncItem: SyncQueueItem = {
          id: crypto.randomUUID(),
          table_name: 'sales',
          action: 'INSERT',
          payload: {
            sale: saleRecord,
            items: saleItemRecords,
          },
          created_at: now,
          retry_count: 0,
          status: 'PENDING',
        };
        await db.sync_queue.add(syncItem);
      });

      // 4. Construct Thermal Receipt Data
      const currentStore = await db.stores.get(targetStoreId);
      const customerPrevBalance = selectedCustomer ? selectedCustomer.current_balance : 0;
=======

          // If due amount exists and customer is attached, rebalance the khata.
          if (dueAmount > 0 && selectedCustomer) {
            const bakiTx: BakiTransaction = {
              id: crypto.randomUUID(),
              store_id: targetStoreId,
              customer_id: selectedCustomer.id,
              sale_id: saleId,
              type: 'DEBIT', // Customer owes more
              amount: dueAmount,
              // Carry the real settlement method instead of hardcoding CASH.
              payment_method: mfsPart > 0 ? (paymentDetails.mfsProvider as MfsProvider) : 'CASH',
              note: `ইনভয়েস #${invoiceNo} থেকে বাকি`,
              customer_name: selectedCustomer.name,
              customer_phone: selectedCustomer.phone,
              created_at: now,
            };

            await db.baki_transactions.add(bakiTx);
            await db.sync_queue.add(
              buildSyncItem('baki_transactions', 'INSERT', bakiTx as unknown as Record<string, unknown>)
            );

            const customer = await db.customers.get(selectedCustomer.id);
            if (customer) {
              await db.customers.update(selectedCustomer.id, {
                current_balance: round2(customer.current_balance + dueAmount),
                updated_at: now,
              });
            }
          }
        }
      );

      // 4. Construct Thermal Receipt Data from freshly persisted state
      const currentStore = await db.stores.get(targetStoreId);
      const freshCustomer = selectedCustomer ? await db.customers.get(selectedCustomer.id) : undefined;
      const customerPrevBalance = round2(
        (freshCustomer?.current_balance ?? selectedCustomer?.current_balance ?? 0) - dueAmount
      );

>>>>>>> c18622f (Bug Fix)
      const receiptData: ThermalReceiptData = {
        storeName: currentStore?.name || 'আমার দোকান',
        storeProprietor: currentStore?.proprietor || 'স্বত্বাধিকারী',
        storePhone: currentStore?.phone || '',
        storeAddress: currentStore?.address || '',
        bkashNumber: currentStore?.bkash_number || '',
<<<<<<< HEAD
=======
        nagadNumber: currentStore?.nagad_number || '',
>>>>>>> c18622f (Bug Fix)
        invoiceNo,
        date: now,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        items: items.map((it) => ({
          name: it.product.name_bn,
          quantity: it.quantity,
          unit: it.selectedUnit,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
        subtotal,
        discount: totalDiscount,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentMethod,
        customerPreviousDue: customerPrevBalance,
<<<<<<< HEAD
        customerTotalDue: dueAmount > 0 ? customerPrevBalance + dueAmount : customerPrevBalance,
=======
        customerTotalDue: freshCustomer?.current_balance ?? customerPrevBalance,
>>>>>>> c18622f (Bug Fix)
      };

      setLastReceipt(receiptData);

<<<<<<< HEAD
      // Trigger celebratory confetti on paid sale
      if (paidAmount > 0) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
=======
      if (shortfalls.length > 0) {
        toast.warning(
          `স্টক ঋণাত্মক হয়েছে — মজুদ মিলিয়ে নিন: ${shortfalls.slice(0, 3).join(', ')}`
        );
      }

      // Trigger celebratory confetti on a fully paid sale
      if (dueAmount === 0 && paidAmount > 0) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
>>>>>>> c18622f (Bug Fix)
        } catch {
          // ignore if canvas unavailable
        }
      }

<<<<<<< HEAD
      // Reset cart
=======
>>>>>>> c18622f (Bug Fix)
      clearCart();
      setPaymentSheetOpen(false);

      return receiptData;
    } catch (err) {
      console.error('[SalesEngine] Checkout error:', err);
<<<<<<< HEAD
      alert('লেনদেন সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
=======
      toast.error('লেনদেন সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
>>>>>>> c18622f (Bug Fix)
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    lastReceipt,
    setLastReceipt,
    completeCheckout,
<<<<<<< HEAD
=======
    blockedBy,
    clearBlock: () => setBlockedBy(null),
>>>>>>> c18622f (Bug Fix)
  };
}
