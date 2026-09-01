// ==============================================================================
// MudiDokan (মুদিদোকান) Zustand POS Cart Store
// Handles Cart Items, Fractional Units, Discounts, & Split Due Balances
<<<<<<< HEAD
// ==============================================================================

import { create } from 'zustand';
import { Product, Customer, ProductUnit, PaymentMethod, MfsProvider } from '../@types/database.types';
import { CartItem, SplitPaymentDetails } from '../@types/pos.types';
=======
//
// Every mutation keys on the CART LINE id, not the product id: the same product
// can legitimately sit on two lines (৫০০ গ্রাম চিনি and ২ কেজি চিনি), and
// editing one must never touch the other.
// ==============================================================================

import { create } from 'zustand';
import { Product, Customer, ProductUnit, MfsProvider } from '../@types/database.types';
import { CartItem, SplitPaymentDetails } from '../@types/pos.types';
import { round2, round3, stepFor, toUnitPrice } from '../lib/units';
>>>>>>> c18622f (Bug Fix)

interface CartState {
  items: CartItem[];
  cartDiscount: number; // General discount applied to cart in BDT
  selectedCustomer: Customer | null;
  paymentDetails: SplitPaymentDetails;
  isCartDrawerOpen: boolean;
  isPaymentSheetOpen: boolean;

<<<<<<< HEAD
  // Actions
  addItem: (product: Product, quantity?: number, unit?: ProductUnit) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string, delta: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateUnit: (productId: string, unit: ProductUnit) => void;
  removeItem: (productId: string) => void;
=======
  // Actions (line-scoped)
  addItem: (product: Product, quantity?: number, unit?: ProductUnit) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  incrementQuantity: (lineId: string, direction: 1 | -1) => void;
  updateDiscount: (lineId: string, discount: number) => void;
  updateUnit: (lineId: string, unit: ProductUnit) => void;
  removeItem: (lineId: string) => void;
>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
=======
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
>>>>>>> c18622f (Bug Fix)
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartDiscount: 0,
  selectedCustomer: null,
  isCartDrawerOpen: false,
  isPaymentSheetOpen: false,
<<<<<<< HEAD
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
=======
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
>>>>>>> c18622f (Bug Fix)
        };
        return { items: updated };
      }

      const newItem: CartItem = {
<<<<<<< HEAD
        product,
        quantity,
        selectedUnit: chosenUnit,
        unitPrice,
        discount: 0,
        subtotal: Math.max(0, quantity * unitPrice),
=======
        id: crypto.randomUUID(),
        product,
        quantity: round3(quantity),
        selectedUnit: chosenUnit,
        unitPrice,
        discount: 0,
        subtotal: lineSubtotal(quantity, unitPrice, 0),
>>>>>>> c18622f (Bug Fix)
      };

      return { items: [...state.items, newItem] };
    });
  },

<<<<<<< HEAD
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
=======
  updateQuantity: (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(lineId);
>>>>>>> c18622f (Bug Fix)
      return;
    }

    set((state) => ({
<<<<<<< HEAD
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
=======
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
>>>>>>> c18622f (Bug Fix)
        })
        .filter((item) => item.quantity > 0);

      return { items: updated };
    });
  },

<<<<<<< HEAD
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
=======
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
>>>>>>> c18622f (Bug Fix)
      }),
    }));
  },

<<<<<<< HEAD
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
=======
  updateUnit: (lineId: string, unit: ProductUnit) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== lineId) return item;

        const unitPrice = round2(toUnitPrice(item.product.selling_price, unit, item.product.unit));
        let quantity = item.quantity;

        // Switching kg -> gm on a 1kg line should offer a sane gram quantity.
        if (item.selectedUnit === 'kg' && unit === 'gm') quantity = round3(item.quantity * 1000);
        else if (item.selectedUnit === 'gm' && unit === 'kg') quantity = round3(item.quantity / 1000);

        if (quantity <= 0) quantity = 1;

        return {
          ...item,
          selectedUnit: unit,
          unitPrice,
          quantity,
          subtotal: lineSubtotal(quantity, unitPrice, item.discount),
        };
>>>>>>> c18622f (Bug Fix)
      }),
    }));
  },

<<<<<<< HEAD
  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
=======
  removeItem: (lineId: string) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== lineId) }));
>>>>>>> c18622f (Bug Fix)
  },

  clearCart: () => {
    set({
      items: [],
      cartDiscount: 0,
      selectedCustomer: null,
<<<<<<< HEAD
      paymentDetails: {
        cashAmount: 0,
        mfsAmount: 0,
        mfsProvider: 'BKASH',
        dueAmount: 0,
        customer: null,
        paymentMethod: 'CASH',
      },
=======
      paymentDetails: { ...EMPTY_PAYMENT },
>>>>>>> c18622f (Bug Fix)
    });
  },

  setCartDiscount: (discount: number) => {
<<<<<<< HEAD
    set({ cartDiscount: Math.max(0, discount) });
=======
    const subtotal = get().getSubtotal();
    const itemDiscounts = get().items.reduce((acc, item) => acc + (item.discount || 0), 0);
    // Never let the bill go negative.
    set({ cartDiscount: round2(Math.min(Math.max(0, discount), Math.max(0, subtotal - itemDiscounts))) });
>>>>>>> c18622f (Bug Fix)
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set((state) => ({
      selectedCustomer: customer,
<<<<<<< HEAD
      paymentDetails: {
        ...state.paymentDetails,
        customer,
      },
=======
      paymentDetails: { ...state.paymentDetails, customer },
>>>>>>> c18622f (Bug Fix)
    }));
  },

  setPaymentDetails: (details: Partial<SplitPaymentDetails>) => {
<<<<<<< HEAD
    set((state) => ({
      paymentDetails: {
        ...state.paymentDetails,
        ...details,
      },
    }));
=======
    set((state) => ({ paymentDetails: { ...state.paymentDetails, ...details } }));
>>>>>>> c18622f (Bug Fix)
  },

  setCartDrawerOpen: (open: boolean) => set({ isCartDrawerOpen: open }),
  setPaymentSheetOpen: (open: boolean) => set({ isPaymentSheetOpen: open }),

<<<<<<< HEAD
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
=======
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
            acc +
            (item.selectedUnit === item.product.unit
              ? item.quantity
              : toUnitPriceSafeQty(item.quantity, item.selectedUnit, item.product.unit)),
          0
        )
    ),
}));

// Local helper kept out of the store surface.
function toUnitPriceSafeQty(qty: number, from: ProductUnit, to: ProductUnit): number {
  if (from === 'gm' && to === 'kg') return qty / 1000;
  if (from === 'kg' && to === 'gm') return qty * 1000;
  if (from === 'hali' && to === 'piece') return qty * 4;
  if (from === 'piece' && to === 'hali') return qty / 4;
  return qty;
}
>>>>>>> c18622f (Bug Fix)
