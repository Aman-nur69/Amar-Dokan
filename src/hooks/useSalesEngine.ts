// ==============================================================================
// MudiDokan (মুদিদোকান) Sales & Financial Transaction Engine
// Atomically commits sales, updates stock, creates ledger dues, and returns receipt
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
    selectedCustomer,
    paymentDetails,
    clearCart,
    getTotalAmount,
    getSubtotal,
    getTotalDiscount,
    setPaymentSheetOpen,
  } = useCartStore();

  /**
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

    try {
      const totalAmount = getTotalAmount();
      const subtotal = getSubtotal();
      const totalDiscount = getTotalDiscount();
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

      // 1. Prepare Sale entity
      const saleRecord: Sale = {
        id: saleId,
        store_id: targetStoreId,
        customer_id: selectedCustomer?.id,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        discount_amount: totalDiscount,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        payment_method: paymentMethod,
        notes: paymentDetails.notes,
        created_at: now,
        updated_at: now,
      };

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
            await db.products.update(item.product_id, {
              stock_quantity: newStock,
              updated_at: now,
            });
          }
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
      const receiptData: ThermalReceiptData = {
        storeName: currentStore?.name || 'আমার দোকান',
        storeProprietor: currentStore?.proprietor || 'স্বত্বাধিকারী',
        storePhone: currentStore?.phone || '',
        storeAddress: currentStore?.address || '',
        bkashNumber: currentStore?.bkash_number || '',
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
        customerTotalDue: dueAmount > 0 ? customerPrevBalance + dueAmount : customerPrevBalance,
      };

      setLastReceipt(receiptData);

      // Trigger celebratory confetti on paid sale
      if (paidAmount > 0) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch {
          // ignore if canvas unavailable
        }
      }

      // Reset cart
      clearCart();
      setPaymentSheetOpen(false);

      return receiptData;
    } catch (err) {
      console.error('[SalesEngine] Checkout error:', err);
      alert('লেনদেন সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
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
  };
}
