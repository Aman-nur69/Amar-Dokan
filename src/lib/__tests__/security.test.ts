// ==============================================================================
// Credential handling and sync payload shape.
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { hashSecret, isHashedSecret, verifySecret } from '../secureHash';
import { sanitizeSyncPayload } from '../../db/offlineDb';

describe('credential digests', () => {
  it('never returns the secret itself', async () => {
    const digest = await hashSecret('01711998877', 'dokan123');
    expect(digest).not.toContain('dokan123');
    expect(isHashedSecret(digest)).toBe(true);
  });

  it('salts per identity, so the same PIN differs between staff', async () => {
    const a = await hashSecret('01711998877', '1234');
    const b = await hashSecret('01811223344', '1234');
    expect(a).not.toBe(b);
  });

  it('is stable for the same identity and secret', async () => {
    const a = await hashSecret('01711998877', 'dokan123');
    const b = await hashSecret('01711998877', 'dokan123');
    expect(a).toBe(b);
  });

  it('verifies against a digest', async () => {
    const digest = await hashSecret('01711998877', 'dokan123');
    expect(await verifySecret('01711998877', 'dokan123', digest)).toEqual({
      valid: true,
      needsUpgrade: false,
    });
    expect(await verifySecret('01711998877', 'wrong', digest)).toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });

  it('accepts a legacy plaintext record once and flags it for upgrade', async () => {
    expect(await verifySecret('01711998877', 'dokan123', 'dokan123')).toEqual({
      valid: true,
      needsUpgrade: true,
    });
    expect(await verifySecret('01711998877', 'nope', 'dokan123')).toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });

  it('rejects an empty stored secret', async () => {
    expect(await verifySecret('01711998877', 'anything', undefined)).toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });
});

describe('sync payload sanitising', () => {
  it('strips local-only enrichment from a sale row', () => {
    const clean = sanitizeSyncPayload('sales', {
      id: 'sale-1',
      total_amount: 100,
      customer_name: 'হাজী শামসুল হক',
      items: [{ id: 'x' }],
    });

    expect(clean).toEqual({ id: 'sale-1', total_amount: 100 });
  });

  it('drops undefined values, which PostgREST rejects', () => {
    const clean = sanitizeSyncPayload('products', {
      id: 'p-1',
      stock_quantity: 5,
      barcode: undefined,
    });

    expect(clean).toEqual({ id: 'p-1', stock_quantity: 5 });
    expect('barcode' in clean).toBe(false);
  });

  it('strips the client-only adjustment reason from a product update', () => {
    const clean = sanitizeSyncPayload('products', {
      id: 'p-1',
      stock_quantity: 5,
      reason: 'PURCHASE',
    });

    expect('reason' in clean).toBe(false);
  });

  it('leaves a ledger row untouched', () => {
    const row = {
      id: 'bt-1',
      store_id: 's',
      customer_id: 'c',
      type: 'DEBIT',
      amount: 250,
      customer_name: 'কবির হোসেন',
    };
    expect(sanitizeSyncPayload('baki_transactions', row)).toEqual(row);
  });
});
