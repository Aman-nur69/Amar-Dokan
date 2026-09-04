// ==============================================================================
// MudiDokan (মুদিদোকান) Print & Customer Notification Engine
// 58mm / 80mm ESC/POS Thermal Printing & WhatsApp/SMS Reminder Generator
// ==============================================================================

import { WhatsAppReminderData } from '../@types/pos.types';
import { formatBengaliCurrency, toBanglaDigits, formatBengaliPhone } from './banglaNumberFormatter';
import { Customer, BakiTransaction, Store } from '../@types/database.types';

/**
 * Triggers native browser print dialog with styling targeted for thermal ESC/POS roll
 */
export function triggerThermalPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

/**
 * Generates an automated WhatsApp reminder link formatted with Bengali text
 */
export function generateWhatsAppReminderUrl(data: WhatsAppReminderData): string {
  const rawPhone = data.customerPhone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!cleanPhone) return '#';

  // Format for Bangladesh (+880...)
  let internationalPhone = cleanPhone;
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    internationalPhone = `880${cleanPhone.substring(1)}`;
  } else if (cleanPhone.startsWith('880')) {
    internationalPhone = cleanPhone;
  }

  const bnAmount = formatBengaliCurrency(data.dueAmount);
  
  let paymentDetails = '';
  if (data.bkashNumber) {
    paymentDetails += `\n📱 বিকাশ (Personal/Merchant): ${toBanglaDigits(data.bkashNumber)}`;
  }
  if (data.nagadNumber) {
    paymentDetails += `\n📱 নগদ: ${toBanglaDigits(data.nagadNumber)}`;
  }

  const message = `আসসালামু আলাইকুম ${data.customerName || 'গ্রাহক'} ভাই/আপা,
${data.storeName} থেকে আপনার মোট বকেয়া (বাকির) পরিমাণ হলো ${bnAmount}।

সুবিধামতো সময়ে দোকানে এসে অথবা নিচে দেয়া নাম্বারে বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি:${paymentDetails}

দোকানের নাম্বার: ${toBanglaDigits(data.storePhone)}
ধন্যবাদান্তে,
${data.storeName}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${internationalPhone}?text=${encodedMessage}`;
}

/**
 * Generates an SMS uri scheme link formatted with Bengali text
 */
export function generateSmsReminderUrl(data: WhatsAppReminderData): string {
  const rawPhone = data.customerPhone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!cleanPhone) return '#';

  const bnAmount = formatBengaliCurrency(data.dueAmount);
  
  const message = `শ্রদ্ধেয় ${data.customerName || 'গ্রাহক'}, ${data.storeName}-এ আপনার মোট বাকি ${bnAmount}। অনুগ্রহ করে দ্রুত পরিশোধ করুন। বিকাশ: ${toBanglaDigits(data.bkashNumber || data.storePhone)}। ধন্যবাদ।`;
  const encoded = encodeURIComponent(message);
  return `sms:${cleanPhone}?body=${encoded}`;
}

/**
 * Generates a full textual ledger statement for a customer to share or copy
 */
export function generateCustomerBakiStatementText(
  customer: Customer,
  transactions: BakiTransaction[],
  store: Store
): string {
  const bnTotalDue = formatBengaliCurrency(customer.current_balance);
  const border = '================================';

  let text = `${store.name}\n${store.address}\nমোবাইল: ${toBanglaDigits(store.phone)}\n${border}\n`;
  text += `গ্রাহক: ${customer.name}\nমোবাইল: ${formatBengaliPhone(customer.phone)}\n`;
  text += `বর্তমান বকেয়া: ${bnTotalDue}\n${border}\n`;
  text += `হালখাতা / হিসাব বিবরণী:\n\n`;

  if (transactions.length === 0) {
    text += `কোন লেনদেনের রেকর্ড পাওয়া যায়নি।\n`;
  } else {
    transactions.forEach((tx, idx) => {
      const typeStr = tx.type === 'DEBIT' ? '➕ নতুন বাকি' : '➖ বাকি আদায় (জমা)';
      const amountStr = formatBengaliCurrency(tx.amount);
      const dateStr = toBanglaDigits(new Date(tx.created_at).toLocaleDateString('bn-BD'));
      text += `${idx + 1}. [${dateStr}] ${typeStr}: ${amountStr} (${tx.note || 'নোট নেই'})\n`;
    });
  }

  text += `\n${border}\n`;
  text += `সর্বমোট দেনা: ${bnTotalDue}\n`;
  if (store.bkash_number) {
    text += `বিকাশ পেমেন্ট: ${toBanglaDigits(store.bkash_number)}\n`;
  }
  text += `সততার সাথে ব্যবসা পরিচালনা আমাদের লক্ষ্য। ধন্যবাদ!`;

  return text;
}
