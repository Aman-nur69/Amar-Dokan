// ==============================================================================
// Cart arithmetic and line identity.
// The cart used to key every mutation on the product id, so editing ৫০০ গ্রাম
// চিনি also rewrote the ২ কেজি চিনি line and deleting one deleted both.
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';
import { Product } from '../../@types/database.types';

const sugar: Product = {
  id: 'p-sugar',
  store_id: 's',
  name_bn: 'দেশি সাদা চিনি',
  unit: 'kg',
  cost_price: 125,
  selling_price: 138,
  stock_quantity: 100,
  min_stock_alert: 5,
  is_quick_item: true,
  created_at: '',
  updated_at: '',
};

const soap: Product = { ...sugar, id: 'p-soap', name_bn: 'সাবান', unit: 'piece', selling_price: 50 };

const reset = () => useCartStore.getState().clearCart();

describe('cart lines', () => {
  beforeEach(reset);

  it('keeps the same product on separate lines per unit', () => {
    const { addItem } = useCartStore.getState();
    addItem(sugar, 500, 'gm');
    addItem(sugar, 2, 'kg');

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]!.id).not.toBe(items[1]!.id);
  });

  it('merges a repeat add of the same product AND unit', () => {
    const { addItem } = useCartStore.getState();
    addItem(sugar, 1, 'kg');
    addItem(sugar, 1, 'kg');

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.quantity).toBe(2);
  });

  it('edits only the targeted line', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    addItem(sugar, 500, 'gm');
    addItem(sugar, 2, 'kg');

    const gramLine = useCartStore.getState().items[0]!;
    updateQuantity(gramLine.id, 750);

    const items = useCartStore.getState().items;
    expect(items[0]!.quantity).toBe(750);
    expect(items[1]!.quantity).toBe(2); // untouched
  });

  it('removes only the targeted line', () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem(sugar, 500, 'gm');
    addItem(sugar, 2, 'kg');

    removeItem(useCartStore.getState().items[0]!.id);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.selectedUnit).toBe('kg');
  });

  it('steps a gram line by 50, not by 1', () => {
    const { addItem, incrementQuantity } = useCartStore.getState();
    addItem(sugar, 250, 'gm');

    const line = useCartStore.getState().items[0]!;
    incrementQuantity(line.id, 1);
    expect(useCartStore.getState().items[0]!.quantity).toBe(300);

    incrementQuantity(line.id, -1);
    expect(useCartStore.getState().items[0]!.quantity).toBe(250);
  });

  it('drops a line stepped down to zero', () => {
    const { addItem, incrementQuantity } = useCartStore.getState();
    addItem(soap, 1);

    incrementQuantity(useCartStore.getState().items[0]!.id, -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cart pricing', () => {
  beforeEach(reset);

  it('prices a gram line from the per-kg selling price', () => {
    useCartStore.getState().addItem(sugar, 500, 'gm');
    const line = useCartStore.getState().items[0]!;
    expect(line.unitPrice).toBe(0.14); // 138 / 1000, rounded to paisa
    expect(useCartStore.getState().getSubtotal()).toBe(70);
  });

  it('totals items, item discounts and the bill discount together', () => {
    const { addItem, updateDiscount, setCartDiscount, getTotalAmount } = useCartStore.getState();
    addItem(sugar, 2, 'kg'); // 276
    addItem(soap, 2); // 100

    updateDiscount(useCartStore.getState().items[0]!.id, 6);
    setCartDiscount(20);

    expect(useCartStore.getState().getSubtotal()).toBe(376);
    expect(useCartStore.getState().getTotalDiscount()).toBe(26);
    expect(getTotalAmount()).toBe(350);
  });

  it('never lets a discount push the bill negative', () => {
    const { addItem, setCartDiscount } = useCartStore.getState();
    addItem(soap, 1); // 50

    setCartDiscount(5000);
    expect(useCartStore.getState().getTotalAmount()).toBe(0);
    expect(useCartStore.getState().cartDiscount).toBe(50);
  });

  it('caps an item discount at the line value', () => {
    const { addItem, updateDiscount } = useCartStore.getState();
    addItem(soap, 1); // 50
    updateDiscount(useCartStore.getState().items[0]!.id, 999);
    expect(useCartStore.getState().items[0]!.discount).toBe(50);
    expect(useCartStore.getState().items[0]!.subtotal).toBe(0);
  });

  it('reports total base-unit quantity per product across lines', () => {
    const { addItem, getBaseQuantityForProduct } = useCartStore.getState();
    addItem(sugar, 500, 'gm'); // 0.5 kg
    addItem(sugar, 2, 'kg'); // 2 kg
    expect(getBaseQuantityForProduct(sugar.id)).toBe(2.5);
  });
});
