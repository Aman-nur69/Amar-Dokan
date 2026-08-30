// ==============================================================================
// MudiDokan (মুদিদোকান) Digital Bakir Khata (Credit Ledger) Hook
// Handles Customer Directories, 11-digit Validation, Due Rebalancing,
// and Opening Balance (পূর্বের বকেয়া) Ledger Initialization
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { db, DEFAULT_STORE } from '../db/offlineDb';
import { Customer, BakiTransaction, SyncQueueItem, MfsProvider } from '../@types/database.types';

export function useBakiKhata() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<BakiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'DUE_ONLY' | 'CLEARED'>('ALL');

  // Load customers and transactions from local Dexie database
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCustomers = await db.customers.toArray();
      // Sort by current_balance DESC (highest due first)
      allCustomers.sort((a, b) => b.current_balance - a.current_balance);
      setCustomers(allCustomers);

      const allTx = await db.baki_transactions.toArray();
      allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTx);
    } catch (err) {
      console.error('[useBakiKhata] Error loading ledger:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /**
   * Adds a new customer with Bangladeshi 11-digit mobile validation and optional opening due
   */
  const addCustomer = async (
    name: string,
    phone: string,
    address?: string,
    creditLimit = 5000,
    openingDue = 0
  ): Promise<{ success: boolean; error?: string; customer?: Customer }> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^01[3-9]\d{8}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return {
        success: false,
        error: 'দয়া করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711998877)',
      };
    }

    if (!name.trim()) {
      return { success: false, error: 'গ্রাহকের নাম অবশ্যই দিতে হবে।' };
    }

    // Check duplicate phone
    const existing = await db.customers.where('phone').equals(cleanPhone).first();
    if (existing) {
      return { success: false, error: 'এই মোবাইল নম্বরে ইতিমধ্যে একটি খাতা বিদ্যমান!' };
    }

    const now = new Date().toISOString();
    const cleanOpeningDue = Math.max(0, Number(openingDue) || 0);

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      store_id: DEFAULT_STORE.id,
      name: name.trim(),
      phone: cleanPhone,
      address: address?.trim() || '',
      current_balance: cleanOpeningDue,
      credit_limit: creditLimit,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await db.transaction('rw', [db.customers, db.baki_transactions, db.sync_queue], async () => {
      await db.customers.add(newCustomer);

      // If opening due is provided, create initial DEBIT transaction in ledger
      if (cleanOpeningDue > 0) {
        const initialTx: BakiTransaction = {
          id: crypto.randomUUID(),
          store_id: DEFAULT_STORE.id,
          customer_id: newCustomer.id,
          type: 'DEBIT',
          amount: cleanOpeningDue,
          payment_method: 'CASH',
          note: 'পূর্বের খাতার প্রারম্ভিক বকেয়া',
          customer_name: newCustomer.name,
          customer_phone: newCustomer.phone,
          created_at: now,
        };
        await db.baki_transactions.add(initialTx);

        await db.sync_queue.add({
          id: crypto.randomUUID(),
          table_name: 'baki_transactions',
          action: 'INSERT',
          payload: initialTx as unknown as Record<string, unknown>,
          created_at: now,
          retry_count: 0,
          status: 'PENDING',
        });
      }

      // Queue customer sync mutation
      const syncItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        table_name: 'customers',
        action: 'INSERT',
        payload: newCustomer as unknown as Record<string, unknown>,
        created_at: now,
        retry_count: 0,
        status: 'PENDING',
      };
      await db.sync_queue.add(syncItem);
    });

    await refreshData();
    return { success: true, customer: newCustomer };
  };

  /**
   * Collects payment from customer ("বাকি আদায়") and recalculates balance
   */
  const collectPayment = async (
    customerId: string,
    amount: number,
    paymentMethod: MfsProvider = 'CASH',
    note?: string
  ): Promise<boolean> => {
    if (amount <= 0) return false;

    try {
      const now = new Date().toISOString();
      const customer = await db.customers.get(customerId);
      if (!customer) return false;

      const newBalance = customer.current_balance - amount;

      const txRecord: BakiTransaction = {
        id: crypto.randomUUID(),
        store_id: DEFAULT_STORE.id,
        customer_id: customerId,
        type: 'CREDIT', // Payment collected
        amount,
        payment_method: paymentMethod,
        note: note || 'বাকি আদায় (জমা)',
        customer_name: customer.name,
        customer_phone: customer.phone,
        created_at: now,
      };

      await db.transaction('rw', [db.customers, db.baki_transactions, db.sync_queue], async () => {
        await db.baki_transactions.add(txRecord);
        await db.customers.update(customerId, {
          current_balance: newBalance,
          updated_at: now,
        });

        // Sync queue
        await db.sync_queue.add({
          id: crypto.randomUUID(),
          table_name: 'baki_transactions',
          action: 'INSERT',
          payload: txRecord as unknown as Record<string, unknown>,
          created_at: now,
          retry_count: 0,
          status: 'PENDING',
        });
      });

      await refreshData();
      return true;
    } catch (err) {
      console.error('[useBakiKhata] Collect payment error:', err);
      return false;
    }
  };

  /**
   * Adds manual due / cash loan to an existing customer ("হাতে নতুন বাকি দেওয়া")
   */
  const addManualDue = async (
    customerId: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (amount <= 0) return { success: false, error: 'দয়া করে সঠিক টাকার পরিমাণ লিখুন।' };

    try {
      const now = new Date().toISOString();
      const customer = await db.customers.get(customerId);
      if (!customer) return { success: false, error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' };

      const newBalance = customer.current_balance + amount;

      const txRecord: BakiTransaction = {
        id: crypto.randomUUID(),
        store_id: DEFAULT_STORE.id,
        customer_id: customerId,
        type: 'DEBIT',
        amount,
        payment_method: 'CASH',
        note: note || 'হাতে নতুন বাকি প্রদান',
        customer_name: customer.name,
        customer_phone: customer.phone,
        created_at: now,
      };

      await db.transaction('rw', [db.customers, db.baki_transactions, db.sync_queue], async () => {
        await db.baki_transactions.add(txRecord);
        await db.customers.update(customerId, {
          current_balance: newBalance,
          updated_at: now,
        });

        await db.sync_queue.add({
          id: crypto.randomUUID(),
          table_name: 'baki_transactions',
          action: 'INSERT',
          payload: txRecord as unknown as Record<string, unknown>,
          created_at: now,
          retry_count: 0,
          status: 'PENDING',
        });
      });

      await refreshData();
      return { success: true };
    } catch (err) {
      console.error('[useBakiKhata] Add manual due error:', err);
      return { success: false, error: 'বাকি যোগ করতে সমস্যা হয়েছে।' };
    }
  };

  /**
   * Filtered customer directory based on search query and tab filter
   */
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'DUE_ONLY') return c.current_balance > 0;
    if (filterType === 'CLEARED') return c.current_balance <= 0;
    return true;
  });

  // Aggregated totals
  const totalBakiOutstanding = customers.reduce(
    (acc, c) => acc + (c.current_balance > 0 ? c.current_balance : 0),
    0
  );
  const totalDueCustomersCount = customers.filter((c) => c.current_balance > 0).length;

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    transactions,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    totalBakiOutstanding,
    totalDueCustomersCount,
    addCustomer,
    collectPayment,
    addManualDue,
    refreshData,
  };
}
