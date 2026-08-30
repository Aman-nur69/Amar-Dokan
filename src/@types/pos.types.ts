// ==============================================================================
// MudiDokan (মুদিদোকান) POS & Front-End Types
// ==============================================================================

import { Product, Customer, ProductUnit, PaymentMethod, MfsProvider } from './database.types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedUnit: ProductUnit;
  unitPrice: number;
  discount: number; // Item-level discount in BDT
  subtotal: number; // (quantity * unitPrice) - discount
}

export interface SplitPaymentDetails {
  cashAmount: number;
  mfsAmount: number;
  mfsProvider: MfsProvider;
  mfsTxnId?: string;
  dueAmount: number;
  customer?: Customer | null;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ThermalReceiptData {
  storeName: string;
  storeProprietor: string;
  storePhone: string;
  storeAddress: string;
  bkashNumber?: string;
  invoiceNo: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  customerPreviousDue?: number;
  customerTotalDue?: number;
}

export interface WhatsAppReminderData {
  customerName: string;
  customerPhone: string;
  storeName: string;
  storePhone: string;
  dueAmount: number;
  bkashNumber?: string;
  nagadNumber?: string;
}
