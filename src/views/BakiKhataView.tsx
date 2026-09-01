// ==============================================================================
// MudiDokan (মুদিদোকান) Bakir Khata (Digital Ledger) Master View
// Mobile & Tablet Optimized: Dedicated New Khata Modal, Realtime Sync & Ledger
// ==============================================================================

import React, { useState } from 'react';
import { useBakiKhata } from '../hooks/useBakiKhata';
import { CustomerLedgerTable } from '../components/baki/CustomerLedgerTable';
import { PaymentCollectModal } from '../components/baki/PaymentCollectModal';
import { QuickCustomerDrawer } from '../components/baki/QuickCustomerDrawer';
import { NewCustomerModal } from '../components/baki/NewCustomerModal';
import { Customer } from '../@types/database.types';
import { formatBengaliCurrency, toBanglaDigits } from '../lib/banglaNumberFormatter';
import { BookOpen, AlertCircle, CheckCircle2, TrendingDown, UserPlus } from 'lucide-react';

export const BakiKhataView: React.FC = () => {
  const {
    customers,
    transactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    totalBakiOutstanding,
    totalDueCustomersCount,
    addCustomer,
    collectPayment,
    addManualDue,
  } = useBakiKhata();

  // Modal states
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Customer Ledger Statement Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);

  const handleOpenPayment = (customer: Customer) => {
    setSelectedCustomerForPayment(customer);
    setIsPaymentModalOpen(true);
  };

  const handleOpenStatement = (customer: Customer) => {
    setDrawerCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleOpenNewCustomer = () => {
    setIsNewCustomerModalOpen(true);
  };

  // Filter transactions for drawer customer
  const drawerCustomerTransactions = drawerCustomer
    ? transactions.filter((t) => t.customer_id === drawerCustomer.id)
    : [];

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner & KPI Badges (Responsive Mobile 1-col, Tablet/Desktop 3-col) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Total Baki Outstanding (Crimson Red) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-600 text-white shadow-lg shadow-rose-600/20 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-rose-200 mb-0.5 truncate">
              বাজারে মোট বকেয়া পাওনা
            </p>
            <h2 className="text-2xl sm:text-3xl font-black truncate">
              {formatBengaliCurrency(totalBakiOutstanding)}
            </h2>
            <p className="text-[11px] text-rose-100 mt-0.5 truncate">
              মোট {toBanglaDigits(totalDueCustomersCount)} জন গ্রাহকের কাছে বাকি
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        {/* Due Customers Count */}
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-amber-100 mb-0.5 truncate">
              বাকিদার গ্রাহক সংখ্যা
            </p>
            <h2 className="text-2xl sm:text-3xl font-black truncate">
              {toBanglaDigits(totalDueCustomersCount)} জন
            </h2>
            <p className="text-[11px] text-amber-100 mt-0.5 truncate">
              তাগাদা পাঠাতে ১-ক্লিক বাটন চাপুন
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        {/* Cleared Accounts */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-emerald-200 mb-0.5 truncate">
              পরিশোধিত খাতা
            </p>
            <h2 className="text-2xl sm:text-3xl font-black truncate">
              {toBanglaDigits(customers.filter((c) => c.current_balance <= 0).length)} জন
            </h2>
            <p className="text-[11px] text-emerald-100 mt-0.5 truncate">বর্তমানে কোনো দেনা নেই</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <CustomerLedgerTable
        customers={customers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        onCollectDue={handleOpenPayment}
        onViewStatement={handleOpenStatement}
        onAddNewCustomer={handleOpenNewCustomer}
      />

      {/* Payment Collect Modal (বাকি আদায়) */}
      <PaymentCollectModal
        customer={selectedCustomerForPayment}
        isOpen={isPaymentModalOpen}
<<<<<<< HEAD
        onClose={() => setSelectedCustomerForPayment(null)}
=======
        onClose={() => {
          // Both pieces of state have to reset, otherwise isPaymentModalOpen
          // stays true for the rest of the session.
          setIsPaymentModalOpen(false);
          setSelectedCustomerForPayment(null);
        }}
>>>>>>> c18622f (Bug Fix)
        onConfirm={collectPayment}
      />

      {/* Dedicated Ultra User-Friendly New Khata Creator Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={addCustomer}
      />

      {/* Quick Customer Drawer (Statement View & Add Due) */}
      <QuickCustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode="STATEMENT"
        selectedCustomer={drawerCustomer}
        customerTransactions={drawerCustomerTransactions}
        onOpenPaymentCollect={(c) => {
          setIsDrawerOpen(false);
          handleOpenPayment(c);
        }}
        onAddManualDue={addManualDue}
      />
    </div>
  );
};
