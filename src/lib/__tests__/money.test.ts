// ==============================================================================
// Money & measurement invariants.
// Each test here pins down a bug that reached the field, so a regression is
// caught before a shopkeeper's হিসাব is.
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { toBaseQuantity, toBaseUnitPrice, toUnitPrice, stepFor, round2, round3 } from '../units';
import { toDhakaDateKey, shiftDhakaDateKey, isOnDhakaDate, isWithinDhakaRange } from '../dateUtils';
import { matchesProduct, transliterateBn } from '../phoneticSearch';
import { formatBengaliCurrency, parseBengaliNumber, formatBengaliDate } from '../banglaNumberFormatter';
import { Product } from '../../@types/database.types';

describe('unit conversion', () => {
  it('converts grams entered against a kg product into kg', () => {
    expect(toBaseQuantity(500, 'gm', 'kg')).toBe(0.5);
    expect(toBaseQuantity(250, 'gm', 'kg')).toBe(0.25);
    expect(toBaseQuantity(2, 'kg', 'kg')).toBe(2);
  });

  it('converts a hali of eggs into pieces', () => {
    expect(toBaseQuantity(3, 'hali', 'piece')).toBe(12);
  });

  it('prices a gram against a per-kg selling price', () => {
    // 138 taka/kg sugar -> 0.138 taka per gram -> 34.50 for 250 gm
    expect(round2(toUnitPrice(138, 'gm', 'kg') * 250)).toBe(34.5);
  });

  it('converts a supplier price quoted per gram back to a per-kg cost', () => {
    // A chalan line of 500 gm at 75 taka means 150 taka per kg.
    expect(toBaseUnitPrice(75, 'gm', 'kg')).toBe(75000);
    expect(round2(toBaseUnitPrice(0.075, 'gm', 'kg'))).toBe(75);
  });

  it('steps grams in 50s so a 250 gm line never becomes 251 gm', () => {
    expect(stepFor('gm')).toBe(50);
    expect(stepFor('kg')).toBe(1);
    expect(stepFor('piece')).toBe(1);
  });

  it('keeps money at two decimals and quantities at three', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round3(1 / 3)).toBe(0.333);
  });
});

describe('Dhaka business day', () => {
  it('books an early-morning sale to the correct local day', () => {
    // 2026-09-01T00:30:00Z is 06:30 on 1 September in Dhaka.
    expect(toDhakaDateKey('2026-09-01T00:30:00.000Z')).toBe('2026-09-01');
    // 2026-08-31T23:30:00Z is 05:30 on 1 September in Dhaka — the case that
    // used to be filed under 31 August.
    expect(toDhakaDateKey('2026-08-31T23:30:00.000Z')).toBe('2026-09-01');
  });

  it('books a late-evening sale to the correct local day', () => {
    // 22:00 on 1 September in Dhaka is 16:00Z the same day.
    expect(toDhakaDateKey('2026-09-01T16:00:00.000Z')).toBe('2026-09-01');
  });

  it('matches a record against a business date', () => {
    expect(isOnDhakaDate('2026-08-31T23:30:00.000Z', '2026-09-01')).toBe(true);
    expect(isOnDhakaDate('2026-08-31T17:00:00.000Z', '2026-09-01')).toBe(false);
    // Plain date keys (expense_date) compare directly.
    expect(isOnDhakaDate('2026-09-01', '2026-09-01')).toBe(true);
  });

  it('shifts and ranges over business days', () => {
    expect(shiftDhakaDateKey('2026-09-01', -1)).toBe('2026-08-31');
    expect(shiftDhakaDateKey('2026-09-01', -6)).toBe('2026-08-26');
    expect(isWithinDhakaRange('2026-08-28T10:00:00.000Z', '2026-08-26', '2026-09-01')).toBe(true);
    expect(isWithinDhakaRange('2026-08-25T10:00:00.000Z', '2026-08-26', '2026-09-01')).toBe(false);
  });
});

describe('bilingual product search', () => {
  const sugar: Product = {
    id: '1',
    store_id: 's',
    name_bn: 'দেশি সাদা চিনি',
    name_en: 'White Sugar',
    unit: 'kg',
    cost_price: 125,
    selling_price: 138,
    stock_quantity: 10,
    min_stock_alert: 5,
    is_quick_item: true,
    created_at: '',
    updated_at: '',
  };
  const oil: Product = { ...sugar, id: '2', name_bn: 'খোলা সয়াবিন তেল', name_en: 'Loose Soybean Oil' };
  const noodles: Product = {
    ...sugar,
    id: '3',
    name_bn: 'ম্যাগি নুডুলস',
    name_en: 'Maggi Noodles',
    barcode: '8941100332211',
  };

  it('finds goods typed as English phonetics', () => {
    expect(matchesProduct(sugar, 'chini')).toBe(true);
    expect(matchesProduct(oil, 'tel')).toBe(true);
    expect(matchesProduct(oil, 'soyabin')).toBe(true);
  });

  it('still finds goods in Bengali and English', () => {
    expect(matchesProduct(sugar, 'চিনি')).toBe(true);
    expect(matchesProduct(sugar, 'sugar')).toBe(true);
  });

  it('matches a barcode typed in Bengali digits', () => {
    expect(matchesProduct(noodles, '৮৯৪১১০০৩৩২২১১')).toBe(true);
  });

  it('does not match unrelated goods', () => {
    expect(matchesProduct(sugar, 'tel')).toBe(false);
  });

  it('transliterates Bengali to rough Latin', () => {
    expect(transliterateBn('চিনি')).toContain('chi');
  });
});

describe('Bengali formatting', () => {
  it('formats currency with South Asian grouping', () => {
    expect(formatBengaliCurrency(12450.5)).toBe('৳ ১২,৪৫০.৫০');
  });

  it('parses numbers typed in Bengali digits', () => {
    expect(parseBengaliNumber('১২৩৪.৫')).toBe(1234.5);
    expect(parseBengaliNumber('৳ ১,২০০')).toBe(1200);
  });

  it('labels the time of day correctly across the clock', () => {
    // Locale-independent check: 11 PM must not read as afternoon.
    const evening = formatBengaliDate(new Date(2026, 8, 1, 23, 5));
    expect(evening).toContain('রাত');
    const morning = formatBengaliDate(new Date(2026, 8, 1, 9, 5));
    expect(morning).toContain('সকাল');
    const noon = formatBengaliDate(new Date(2026, 8, 1, 13, 5));
    expect(noon).toContain('দুপুর');
    const midnight = formatBengaliDate(new Date(2026, 8, 1, 0, 5));
    expect(midnight).toContain('রাত');
  });
});
