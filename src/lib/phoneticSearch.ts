// ==============================================================================
// Amar Dokan (আমার দোকান) Bilingual Product Matching
// A dokandar types "chini", "tel", "dal" on an English keyboard far more often
// than they switch to a Bengali layout. We transliterate the Bengali name to
// Latin and also carry a hand-written alias list for the goods that matter.
// ==============================================================================

import { Product } from '../@types/database.types';
import { toEnglishDigits } from './banglaNumberFormatter';

// Longest-first so conjuncts and matras resolve before their parts.
const TRANSLITERATION: [string, string][] = [
  ['ক্ষ', 'kh'], ['জ্ঞ', 'gg'], ['ঞ্চ', 'nc'], ['ঞ্জ', 'nj'], ['ষ্ট', 'sht'], ['স্ট', 'st'],
  ['ন্দ', 'nd'], ['ন্ত', 'nt'], ['ম্প', 'mp'], ['ম্ব', 'mb'], ['ল্ল', 'll'], ['ত্ত', 'tt'],
  ['ভ', 'bh'], ['ধ', 'dh'], ['ঘ', 'gh'], ['ঝ', 'jh'], ['ঠ', 'th'], ['ঢ', 'dh'], ['ছ', 'ch'],
  ['থ', 'th'], ['ফ', 'ph'], ['খ', 'kh'], ['চ', 'ch'], ['শ', 'sh'], ['ষ', 'sh'], ['ং', 'ng'],
  ['ক', 'k'], ['গ', 'g'], ['জ', 'j'], ['ট', 't'], ['ড', 'd'], ['ণ', 'n'], ['ত', 't'],
  ['দ', 'd'], ['ন', 'n'], ['প', 'p'], ['ব', 'b'], ['ম', 'm'], ['য', 'j'], ['র', 'r'],
  ['ল', 'l'], ['স', 's'], ['হ', 'h'], ['ড়', 'r'], ['ঢ়', 'r'], ['য়', 'y'],
  ['আ', 'a'], ['অ', 'o'], ['ই', 'i'], ['ঈ', 'i'], ['উ', 'u'], ['ঊ', 'u'], ['এ', 'e'],
  ['ঐ', 'oi'], ['ও', 'o'], ['ঔ', 'ou'], ['ঋ', 'ri'],
  ['া', 'a'], ['ি', 'i'], ['ী', 'i'], ['ু', 'u'], ['ূ', 'u'], ['ে', 'e'], ['ৈ', 'oi'],
  ['ো', 'o'], ['ৌ', 'ou'], ['ৃ', 'ri'], ['্', ''], ['ঁ', ''], ['ঃ', ''],
];

/** Common shop vocabulary a shopkeeper is likely to type in English. */
const ALIASES: [RegExp, string][] = [
  [/চিনি/, 'chini sugar cheeni'],
  [/তেল/, 'tel oil soyabin soybean'],
  [/সয়াবিন/, 'soyabin soybean tel'],
  [/ডাল/, 'dal daal lentil masur mosur'],
  [/মসুর/, 'masur mosur dal lentil'],
  [/চাল/, 'chal chaal rice minicot miniket'],
  [/মিনিকেট/, 'miniket minicot chal rice'],
  [/আটা/, 'ata atta flour'],
  [/ময়দা/, 'moyda maida flour'],
  [/ডিম/, 'dim egg deem'],
  [/আলু/, 'alu aloo potato'],
  [/পেঁয়াজ|পিয়াজ/, 'peyaj piyaj peaj onion'],
  [/রসুন/, 'rosun roshun garlic'],
  [/আদা/, 'ada ginger'],
  [/লবণ|লবন/, 'lobon lobn salt'],
  [/সাবান/, 'saban shaban soap'],
  [/বিস্কুট/, 'biscuit biskut'],
  [/নুডুলস|নুডলস/, 'noodles nudals'],
  [/দুধ/, 'dudh milk'],
  [/চা\b|চা-/, 'cha tea'],
  [/মরিচ/, 'morich chili morich'],
  [/হলুদ/, 'holud turmeric'],
  [/ঘি/, 'ghee ghi'],
  [/গুড়/, 'gur gud jaggery'],
  [/মুড়ি/, 'muri puffed rice'],
  [/সেমাই/, 'semai vermicelli'],
];

const productIndexCache = new WeakMap<Product, string>();
const transliterationCache = new Map<string, string>();

/** Bengali text rendered in rough Latin letters. */
export function transliterateBn(text: string): string {
  if (!text) return '';
  const cached = transliterationCache.get(text);
  if (cached !== undefined) return cached;

  let out = text;
  for (const [bn, latin] of TRANSLITERATION) {
    out = out.split(bn).join(latin);
  }
  const result = out.toLowerCase();
  if (transliterationCache.size > 2000) {
    transliterationCache.clear();
  }
  transliterationCache.set(text, result);
  return result;
}

/**
 * Everything a product should be findable by, as one lowercase haystack.
 * Memoized per Product object reference for sub-millisecond POS filtering.
 */
export function buildSearchIndex(product: Product): string {
  const cached = productIndexCache.get(product);
  if (cached !== undefined) return cached;

  const parts: string[] = [
    product.name_bn || '',
    product.name_en || '',
    product.barcode || '',
    transliterateBn(product.name_bn || ''),
  ];

  for (const [pattern, alias] of ALIASES) {
    if (pattern.test(product.name_bn || '')) parts.push(alias);
  }

  const index = parts.join(' ').toLowerCase();
  productIndexCache.set(product, index);
  return index;
}

/**
 * Matches a product against a query typed in Bengali, English or phonetics.
 * Bengali digits in the query are normalised so "৮৯৪১" finds a barcode.
 */
export function matchesProduct(product: Product, rawQuery: string): boolean {
  const query = toEnglishDigits(rawQuery.trim()).toLowerCase();
  if (!query) return true;

  const haystack = buildSearchIndex(product);
  // Every whitespace-separated term must appear somewhere.
  return query.split(/\s+/).every((term) => haystack.includes(term));
}
