// ==============================================================================
// MudiDokan (মুদিদোকান) Bengali Number & Currency Formatting Engine
// Real-time bi-directional conversion between ASCII digits (0-9) and Bengali digits (০-৯)
// ==============================================================================

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const DIGIT_MAP_EN_TO_BN: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

const DIGIT_MAP_BN_TO_EN: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Converts English/ASCII digits (0-9) to Bengali digits (০-৯)
 */
export function toBanglaDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined || input === '') return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => DIGIT_MAP_EN_TO_BN[digit] || digit);
}

/**
 * Converts Bengali digits (০-৯) to English/ASCII digits (0-9)
 */
export function toEnglishDigits(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (digit) => DIGIT_MAP_BN_TO_EN[digit] || digit);
}

/**
 * Safely parses any number input that may contain Bengali or English digits
 */
export function parseBengaliNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  
  // Convert any Bengali digits to English
  const englishStr = toEnglishDigits(input.toString())
    .replace(/[^\d.-]/g, ''); // strip non-numeric except dot and minus

  const parsed = parseFloat(englishStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a currency amount in BDT with the ৳ symbol and Bengali digits
 * Example: 12450.5 -> "৳ ১২,৪৫০.৫০"
 */
export function formatBengaliCurrency(
  amount: number | string | null | undefined,
  showSymbol: boolean = true,
  decimals: number = 2
): string {
  const num = typeof amount === 'number' ? amount : parseBengaliNumber(amount);
  
  // Format with standard locale separators
  const parts = Math.abs(num).toFixed(decimals).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  // South Asian formatting (lakh/crore): 3 digits then sets of 2 digits
  let formattedInt = '';
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const bnInt = toBanglaDigits(formattedInt);
  const bnDec = decimals > 0 ? '.' + toBanglaDigits(decPart) : '';
  const prefix = num < 0 ? '-' : '';
  const currencySymbol = showSymbol ? '৳ ' : '';

  return `${prefix}${currencySymbol}${bnInt}${bnDec}`;
}

/**
 * Formats standard 11-digit Bangladeshi mobile number into Bengali format
 * Example: "01711998877" -> "০১৭১১-৯৯৮৮৭৭"
 */
export function formatBengaliPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = toEnglishDigits(phone).replace(/\D/g, '');
  if (clean.length === 11) {
    const formatted = `${clean.slice(0, 5)}-${clean.slice(5)}`;
    return toBanglaDigits(formatted);
  }
  return toBanglaDigits(phone);
}

/**
 * Formats quantity with unit in Bengali
 * Example: (2.5, 'kg') -> "২.৫ কেজি"
 */
export function formatBengaliQuantity(qty: number, unit: string): string {
  const unitMap: Record<string, string> = {
    kg: 'কেজি',
    gm: 'গ্রাম',
    litre: 'লিটার',
    packet: 'প্যাকেট',
    piece: 'পিস',
    hali: 'হালি',
  };

  const bnQty = toBanglaDigits(qty.toString());
  const bnUnit = unitMap[unit] || unit;
  return `${bnQty} ${bnUnit}`;
}

/**
 * Formats a Date object or ISO string into localized Bengali format
 */
export function formatBengaliDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const day = toBanglaDigits(d.getDate().toString().padStart(2, '0'));
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const month = monthsBn[d.getMonth()];
  const year = toBanglaDigits(d.getFullYear().toString());

<<<<<<< HEAD
  let hours = d.getHours();
  const minutes = toBanglaDigits(d.getMinutes().toString().padStart(2, '0'));
  const period = hours >= 12 ? 'দুপুর/বিকাল' : 'সকাল';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
=======
  // Bengali time-of-day bands. Everything from noon onward used to be labelled
  // "দুপুর/বিকাল", so 11 PM read as afternoon and midnight as সকাল ১২.
  const rawHours = d.getHours();
  let period: string;
  if (rawHours < 4) period = 'রাত';
  else if (rawHours < 6) period = 'ভোর';
  else if (rawHours < 12) period = 'সকাল';
  else if (rawHours < 16) period = 'দুপুর';
  else if (rawHours < 18) period = 'বিকাল';
  else if (rawHours < 20) period = 'সন্ধ্যা';
  else period = 'রাত';

  let hours = rawHours % 12;
  if (hours === 0) hours = 12;
  const minutes = toBanglaDigits(d.getMinutes().toString().padStart(2, '0'));
>>>>>>> c18622f (Bug Fix)
  const bnHours = toBanglaDigits(hours.toString());

  return `${day} ${month} ${year}, ${period} ${bnHours}:${minutes}`;
}
