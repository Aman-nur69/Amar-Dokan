// ==============================================================================
// Amar Dokan (আমার দোকান) Unit Conversion
// Stock is always held in the product's own base unit. Anything that touches
// stock — checkout, chalan replenishment, adjustments — converts through here.
// ==============================================================================

import { ProductUnit } from '../@types/database.types';

export const UNIT_LABELS_BN: Record<ProductUnit, string> = {
  kg: 'কেজি',
  gm: 'গ্রাম',
  litre: 'লিটার',
  packet: 'প্যাকেট',
  piece: 'পিস',
  hali: 'হালি',
};

/** How many base units one entry unit represents, per base unit family. */
const CONVERSIONS: Partial<Record<ProductUnit, Partial<Record<ProductUnit, number>>>> = {
  kg: { kg: 1, gm: 0.001 },
  gm: { gm: 1, kg: 1000 },
  litre: { litre: 1 },
  packet: { packet: 1 },
  piece: { piece: 1, hali: 4 },
  hali: { hali: 1, piece: 0.25 },
};

/**
 * Converts a quantity entered in `enteredUnit` into the product's `baseUnit`.
 * Unrelated units (e.g. litre entered against a packet product) pass through
 * unchanged — the caller is responsible for not offering those combinations.
 */
export function toBaseQuantity(
  quantity: number,
  enteredUnit: ProductUnit | undefined,
  baseUnit: ProductUnit
): number {
  const qty = Number(quantity) || 0;
  if (!enteredUnit || enteredUnit === baseUnit) return round3(qty);

  const factor = CONVERSIONS[baseUnit]?.[enteredUnit];
  if (typeof factor !== 'number') return round3(qty);

  return round3(qty * factor);
}

/**
 * Price for one `enteredUnit` of a product priced per `baseUnit`.
 */
export function toUnitPrice(
  basePrice: number,
  enteredUnit: ProductUnit | undefined,
  baseUnit: ProductUnit
): number {
  const price = Number(basePrice) || 0;
  if (!enteredUnit || enteredUnit === baseUnit) return price;

  const factor = CONVERSIONS[baseUnit]?.[enteredUnit];
  if (typeof factor !== 'number') return price;

  return price * factor;
}

/**
 * Inverse of toUnitPrice: a price quoted per `enteredUnit` expressed per
 * `baseUnit`. A supplier billing 500 gm at BDT 75 means BDT 150 per kg.
 */
export function toBaseUnitPrice(
  enteredPrice: number,
  enteredUnit: ProductUnit | undefined,
  baseUnit: ProductUnit
): number {
  const price = Number(enteredPrice) || 0;
  if (!enteredUnit || enteredUnit === baseUnit) return price;

  const factor = CONVERSIONS[baseUnit]?.[enteredUnit];
  if (typeof factor !== 'number' || factor === 0) return price;

  return price / factor;
}

/**
 * Sensible stepper increment for a unit: grams move in 50s, everything else in 1s.
 */
export function stepFor(unit: ProductUnit): number {
  return unit === 'gm' ? 50 : 1;
}

export function round3(value: number): number {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

/** Money rounding — two decimals, no float dust. */
export function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}
