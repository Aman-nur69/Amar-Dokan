// ==============================================================================
// Amar Dokan (আমার দোকান) Business Day Utilities — Asia/Dhaka (UTC+6, no DST)
// All "today's হিসাব" logic must go through here. Never compare raw ISO strings:
// a sale at 05:30 AM Dhaka is stored as 23:30 UTC of the PREVIOUS day.
// ==============================================================================

export const DHAKA_TIME_ZONE = 'Asia/Dhaka';
const DHAKA_OFFSET_MINUTES = 6 * 60; // Bangladesh Standard Time is a fixed +06:00

/**
 * Returns the Dhaka-local business date key (YYYY-MM-DD) for any date input.
 */
export function toDhakaDateKey(input: string | Date | null | undefined): string {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '';

  try {
    // en-CA renders as YYYY-MM-DD, which is exactly the key format we store.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DHAKA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback for runtimes without full ICU: shift by the fixed BST offset.
    const shifted = new Date(date.getTime() + DHAKA_OFFSET_MINUTES * 60 * 1000);
    return shifted.toISOString().slice(0, 10);
  }
}

/**
 * Today's business date key in Dhaka.
 */
export function todayDhakaKey(): string {
  return toDhakaDateKey(new Date());
}

/**
 * Business date key shifted by a number of days (negative = past).
 */
export function shiftDhakaDateKey(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T00:00:00Z`);
  if (isNaN(base.getTime())) return dateKey;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/**
 * True when the record falls on the given Dhaka business date.
 * Accepts both timestamps (created_at) and plain date keys (expense_date).
 */
export function isOnDhakaDate(value: string | undefined, dateKey: string): boolean {
  if (!value || !dateKey) return false;
  // Plain YYYY-MM-DD values are already business date keys — compare directly.
  if (value.length === 10 && !value.includes('T')) return value === dateKey;
  return toDhakaDateKey(value) === dateKey;
}

/**
 * True when the record falls inside an inclusive Dhaka business date range.
 */
export function isWithinDhakaRange(
  value: string | undefined,
  fromKey: string,
  toKey: string
): boolean {
  if (!value || !fromKey || !toKey) return false;
  const key = value.length === 10 && !value.includes('T') ? value : toDhakaDateKey(value);
  if (!key) return false;
  return key >= fromKey && key <= toKey;
}
