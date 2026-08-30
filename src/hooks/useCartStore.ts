// ==============================================================================
// MudiDokan (মুদিদোকান) Zustand POS Cart Store
// Handles Cart Items, Fractional Units, Discounts, & Split Due Balances
// ==============================================================================

import { create } from 'zustand';
import { Product, Customer, ProductUnit, PaymentMethod, MfsProvider } from '../@types/database.types';
import { CartItem, SplitPaymentDetails } from '../@types/pos.types';

interface CartState {
  items: CartItem[];
  cartDiscount: number; // General discount applied to cart in BDT
  selectedCustomer: Customer | null;
  paymentDetails: SplitPaymentDetails;
  isCartDrawerOpen: boolean;
  isPaymentSheetOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number, unit?: ProductUnit) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string, delta: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateUnit: (productId: string, unit: ProductUnit) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;

  setCartDiscount: (discount: number) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setPaymentDetails: (details: Partial<SplitPaymentDetails>) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setPaymentSheetOpen: (open: boolean) => void;

  // Calculated getters
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartDiscount: 0,
  selectedCustomer: null,
  isCartDrawerOpen: false,
  isPaymentSheetOpen: false,
  paymentDetails: {
    cashAmount: 0,
    mfsAmount: 0,
    mfsProvider: 'BKASH',
    dueAmount: 0,
    customer: null,
    paymentMethod: 'CASH',
  },

  addItem: (product: Product, quantity = 1, unit?: ProductUnit) => {
    const chosenUnit = unit || product.unit;
    let unitPrice = product.selling_price;
    
    // Auto-adjust unit price if customer asks for grams of a kg-based product
    if (product.unit === 'kg' && chosenUnit === 'gm') {
      unitPrice = product.selling_price / 1000;
    }

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id && item.selectedUnit === chosenUnit);
      if (existingIndex > -1) {
        const updated = [...state.items];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: Math.max(0, newQty * existing.unitPrice - existing.discount),
        };
        return { items: updated };
      }

      const newItem: CartItem = {
        product,
        quantity,
        selectedUnit: chosenUnit,
        unitPrice,
        discount: 0,
        subtotal: Math.max(0, quantity * unitPrice),
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
            subtotal: Math.max(0, quantity * item.unitPrice - item.discount),
          };
        }
        return item;
      }),
    }));
  },

  incrementQuantity: (productId: string, delta: number) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = Math.max(0, Math.round((item.quantity + delta) * 1000) / 1000);
            return {
              ...item,
              quantity: newQty,
              subtotal: Math.max(0, newQty * item.unitPrice - item.discount),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return { items: updated };
    });
  },

  updateDiscount: (productId: string, discount: number) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.product.id === productId) {
          const cleanDiscount = Math.max(0, discount);
          return {
            ...item,
            discount: cleanDiscount,
            subtotal: Math.max(0, item.quantity * item.unitPrice - cleanDiscount),
          };
        }
        return item;
      }),
    }));
  },

  updateUnit: (productId: string, unit: ProductUnit) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.product.id === productId) {
          let unitPrice = item.product.selling_price;
          let quantity = item.quantity;

          if (item.product.unit === 'kg' && unit === 'gm') {
            unitPrice = item.product.selling_price / 1000;
            if (quantity === 1) quantity = 250; // default to 250gm if switched from 1kg
          } else if (item.product.unit === 'kg' && unit === 'kg') {
            unitPrice = item.product.selling_price;
            if (quantity > 10) quantity = 1;
          }

          return {
            ...item,
            selectedUnit: unit,
            unitPrice,
            quantity,
            subtotal: Math.max(0, quantity * unitPrice - item.discount),
          };
        }
        return item;
      }),
    }));
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      cartDiscount: 0,
      selectedCustomer: null,
      paymentDetails: {
        cashAmount: 0,
        mfsAmount: 0,
        mfsProvider: 'BKASH',
        dueAmount: 0,
        customer: null,
        paymentMethod: 'CASH',
      },
    });
  },

  setCartDiscount: (discount: number) => {
    set({ cartDiscount: Math.max(0, discount) });
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set((state) => ({
      selectedCustomer: customer,
      paymentDetails: {
        ...state.paymentDetails,
        customer,
      },
    }));
  },

  setPaymentDetails: (details: Partial<SplitPaymentDetails>) => {
    set((state) => ({
      paymentDetails: {
        ...state.paymentDetails,
        ...details,
      },
    }));
  },

  setCartDrawerOpen: (open: boolean) => set({ isCartDrawerOpen: open }),
  setPaymentSheetOpen: (open: boolean) => set({ isPaymentSheetOpen: open }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  },

  getTotalDiscount: () => {
    const itemDiscounts = get().items.reduce((acc, item) => acc + (item.discount || 0), 0);
    return itemDiscounts + get().cartDiscount;
  },

  getTotalAmount: () => {
    const subtotal = get().getSubtotal();
    const discounts = get().getTotalDiscount();
    return Math.max(0, subtotal - discounts);
  },

  getItemCount: () => {
    return get().items.length;
  },
}));
