// ==============================================================================
// MudiDokan (মুদিদোকান) Zustand POS Cart Store
// Handles Cart Items, Fractional Units, Discounts, & Split Due Balances
//
// Every mutation keys on the CART LINE id, not the product id: the same product
// can legitimately sit on two lines (৫০০ গ্রাম চিনি and ২ কেজি চিনি), and
// editing one must never touch the other.
// ==============================================================================

import { create } from 'zustand';
import { Product, Customer, ProductUnit, MfsProvider } from '../@types/database.types';
import { CartItem, SplitPaymentDetails } from '../@types/pos.types';
import { round2, round3, stepFor, toBaseQuantity, toUnitPrice } from '../lib/units';

interface CartState {
  items: CartItem[];
  cartDiscount: number; // General discount applied to cart in BDT
  selectedCustomer: Customer | null;
  paymentDetails: SplitPaymentDetails;
  isCartDrawerOpen: boolean;
  isPaymentSheetOpen: boolean;

  // Actions (line-scoped)
  addItem: (product: Product, quantity?: number, unit?: ProductUnit) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  incrementQuantity: (lineId: string, direction: 1 | -1) => void;
  updateDiscount: (lineId: string, discount: number) => void;
  updateUnit: (lineId: string, unit: ProductUnit) => void;
  removeItem: (lineId: string) => void;
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
  /** Total quantity of a product across every line, in the product's base unit. */
  getBaseQuantityForProduct: (productId: string) => number;
}

const EMPTY_PAYMENT: SplitPaymentDetails = {
  cashAmount: 0,
  mfsAmount: 0,
  mfsProvider: 'BKASH' as MfsProvider,
  dueAmount: 0,
  customer: null,
  paymentMethod: 'CASH',
};

function lineSubtotal(quantity: number, unitPrice: number, discount: number): number {
  return round2(Math.max(0, quantity * unitPrice - (discount || 0)));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartDiscount: 0,
  selectedCustomer: null,
  isCartDrawerOpen: false,
  isPaymentSheetOpen: false,
  paymentDetails: { ...EMPTY_PAYMENT },

  addItem: (product: Product, quantity = 1, unit?: ProductUnit) => {
    const chosenUnit = unit || product.unit;
    const unitPrice = round2(toUnitPrice(product.selling_price, chosenUnit, product.unit));

    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === product.id && item.selectedUnit === chosenUnit
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        const existing = updated[existingIndex];
        const newQty = round3(existing.quantity + quantity);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: lineSubtotal(newQty, existing.unitPrice, existing.discount),
        };
        return { items: updated };
      }

      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product,
        quantity: round3(quantity),
        selectedUnit: chosenUnit,
        unitPrice,
        discount: 0,
        subtotal: lineSubtotal(quantity, unitPrice, 0),
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(lineId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.id === lineId
          ? {
              ...item,
              quantity: round3(quantity),
              subtotal: lineSubtotal(quantity, item.unitPrice, item.discount),
            }
          : item
      ),
    }));
  },

  // Steps by a sensible amount for the unit: grams move 50 at a time, so a
  // ২৫০ গ্রাম line never becomes ২৫১ গ্রাম.
  incrementQuantity: (lineId: string, direction: 1 | -1) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.id !== lineId) return item;
          const delta = stepFor(item.selectedUnit) * direction;
          const newQty = round3(Math.max(0, item.quantity + delta));
          return {
            ...item,
            quantity: newQty,
            subtotal: lineSubtotal(newQty, item.unitPrice, item.discount),
          };
        })
        .filter((item) => item.quantity > 0);

      return { items: updated };
    });
  },

  updateDiscount: (lineId: string, discount: number) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== lineId) return item;
        // An item discount can never exceed the line value.
        const cleanDiscount = round2(
          Math.min(Math.max(0, discount), item.quantity * item.unitPrice)
        );
        return {
          ...item,
          discount: cleanDiscount,
          subtotal: lineSubtotal(item.quantity, item.unitPrice, cleanDiscount),
        };
      }),
    }));
  },

  updateUnit: (lineId: string, unit: ProductUnit) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== lineId) return item;

        const unitPrice = round2(toUnitPrice(item.product.selling_price, unit, item.product.unit));
        let quantity = item.quantity;

        // Switching kg -> gm on a 1kg line should offer a sane gram quantity.
        if (item.selectedUnit === 'kg' && unit === 'gm') quantity = round3(item.quantity * 1000);
        else if (item.selectedUnit === 'gm' && unit === 'kg') quantity = round3(item.quantity / 1000);
        else if (item.selectedUnit === 'hali' && unit === 'piece') quantity = round3(item.quantity * 4);
        else if (item.selectedUnit === 'piece' && unit === 'hali') quantity = round3(item.quantity / 4);

        if (quantity <= 0) quantity = 1;

        return {
          ...item,
          selectedUnit: unit,
          unitPrice,
          quantity,
          subtotal: lineSubtotal(quantity, unitPrice, item.discount),
        };
      }),
    }));
  },

  removeItem: (lineId: string) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== lineId) }));
  },

  clearCart: () => {
    set({
      items: [],
      cartDiscount: 0,
      selectedCustomer: null,
      paymentDetails: { ...EMPTY_PAYMENT },
    });
  },

  setCartDiscount: (discount: number) => {
    const subtotal = get().getSubtotal();
    const itemDiscounts = get().items.reduce((acc, item) => acc + (item.discount || 0), 0);
    // Never let the bill go negative.
    set({ cartDiscount: round2(Math.min(Math.max(0, discount), Math.max(0, subtotal - itemDiscounts))) });
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set((state) => ({
      selectedCustomer: customer,
      paymentDetails: { ...state.paymentDetails, customer },
    }));
  },

  setPaymentDetails: (details: Partial<SplitPaymentDetails>) => {
    set((state) => ({ paymentDetails: { ...state.paymentDetails, ...details } }));
  },

  setCartDrawerOpen: (open: boolean) => set({ isCartDrawerOpen: open }),
  setPaymentSheetOpen: (open: boolean) => set({ isPaymentSheetOpen: open }),

  getSubtotal: () => round2(get().items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)),

  getTotalDiscount: () => {
    const itemDiscounts = get().items.reduce((acc, item) => acc + (item.discount || 0), 0);
    return round2(itemDiscounts + get().cartDiscount);
  },

  getTotalAmount: () => round2(Math.max(0, get().getSubtotal() - get().getTotalDiscount())),

  getItemCount: () => get().items.length,

  getBaseQuantityForProduct: (productId: string) =>
    round3(
      get()
        .items.filter((item) => item.product.id === productId)
        .reduce(
          (acc, item) =>
            acc + toBaseQuantity(item.quantity, item.selectedUnit, item.product.unit),
          0
        )
    ),
}));
