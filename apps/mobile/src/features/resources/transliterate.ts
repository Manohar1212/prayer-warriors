/**
 * Telugu script to loose Latin letters, so a member can type "yesu" and find యేసు.
 * Both the song text and the query go through `searchKey`, which drops the details people
 * spell differently: vowel length, doubled letters, aspirates (th/t, bh/b), w/v, sh/s.
 */

const VOWELS: Record<string, string> = {
  అ: 'a', ఆ: 'aa', ఇ: 'i', ఈ: 'ii', ఉ: 'u', ఊ: 'uu', ఋ: 'ru', ౠ: 'ruu', ఎ: 'e', ఏ: 'e', ఐ: 'ai', ఒ: 'o', ఓ: 'o', ఔ: 'au',
};
const MATRAS: Record<string, string> = {
  'ా': 'aa', 'ి': 'i', 'ీ': 'ii', 'ు': 'u', 'ూ': 'uu', 'ృ': 'ru', 'ౄ': 'ruu', 'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au',
};
const CONSONANTS: Record<string, string> = {
  క: 'k', ఖ: 'kh', గ: 'g', ఘ: 'gh', ఙ: 'ng', చ: 'ch', ఛ: 'chh', జ: 'j', ఝ: 'jh', ఞ: 'ny',
  ట: 't', ఠ: 'th', డ: 'd', ఢ: 'dh', ణ: 'n', త: 't', థ: 'th', ద: 'd', ధ: 'dh', న: 'n',
  ప: 'p', ఫ: 'ph', బ: 'b', భ: 'bh', మ: 'm', య: 'y', ర: 'r', ఱ: 'r', ల: 'l', ళ: 'l', వ: 'v', శ: 'sh', ష: 'sh', స: 's', హ: 'h',
};
const VIRAMA = '్';
const ANUSVARA = 'ం';
const VISARGA = 'ః';
const DIGITS = '౦౧౨౩౪౫౬౭౮౯';

/** Plain romanisation, e.g. "యేసు నా ప్రియుడు" → "yeesu naa priyudu". Latin text passes through. */
export function transliterate(text: string): string {
  let out = '';
  let pendingA = false;
  const flush = () => {
    if (pendingA) out += 'a';
    pendingA = false;
  };
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (CONSONANTS[ch]) {
      flush();
      out += CONSONANTS[ch];
      pendingA = true;
    } else if (MATRAS[ch]) {
      out += MATRAS[ch];
      pendingA = false;
    } else if (ch === VIRAMA) {
      pendingA = false;
    } else if (VOWELS[ch]) {
      flush();
      out += VOWELS[ch];
    } else if (ch === ANUSVARA) {
      flush();
      const next = CONSONANTS[chars[i + 1] ?? ''] ?? '';
      out += next && !/^[pbm]/.test(next) ? 'n' : 'm';
    } else if (ch === VISARGA) {
      flush();
      out += 'h';
    } else if (ch === 'ఁ') {
      flush();
    } else if (DIGITS.includes(ch)) {
      flush();
      out += String(DIGITS.indexOf(ch));
    } else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}

/**
 * Forgiving key used on both sides of a search: lower-case ASCII with the usual spelling
 * variations folded away. People write long vowels as "aa/ee/oo", aspirates as "th/dh/bh",
 * క as "k" or "c", చ as "ch", ృ as "ri" or "ru", and doubled letters inconsistently.
 */
export function searchKey(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/aa/g, 'a')
    .replace(/ee|ii|ea/g, 'i')
    .replace(/oo|uu/g, 'u')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/jah\b/g, 'ya')
    .replace(/ph|f/g, 'p')
    .replace(/(k|g|c|j|t|d|b|s)h/g, '$1')
    .replace(/c/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/([bdghjklmnprstvy])ri/g, '$1ru')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when `query` (Telugu or English letters) appears in `text`. */
export function looseIncludes(textKey: string, query: string): boolean {
  const q = searchKey(query);
  return q.length === 0 || textKey.includes(q);
}
