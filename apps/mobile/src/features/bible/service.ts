import type { BibleDb } from '../../lib/bibleDb.types';
import { fuzzyWordMatch } from '../resources/songSearch';
import { plainKey, verseKey } from '../resources/transliterate';
import type { BibleBook, BibleLanguage, BibleService, BibleVerse, SearchHit } from './types';

type BookRow = { id: number; code: string; testament: string; name_en: string; name_te: string; short_te: string; chapters_en: number; chapters_te: number };
type VerseRow = { verse: number; label: string; text: string };
type HitRow = VerseRow & { book: number; chapter: number; name_en: string; short_te: string };

function toBook(r: BookRow): BibleBook {
  return {
    id: r.id,
    code: r.code,
    testament: r.testament === 'NT' ? 'NT' : 'OT',
    nameEn: r.name_en,
    nameTe: r.name_te,
    shortTe: r.short_te,
    chaptersEn: r.chapters_en,
    chaptersTe: r.chapters_te,
  };
}

/** Escapes LIKE wildcards so a member searching for "%" or "_" gets literal matches. */
export function likePattern(query: string): string {
  return `%${query.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Relevance of a verse for the query words: the whole phrase in order scores highest, then
 * whole-word hits, then words that merely start with or contain the typed letters.
 */
export function scoreVerse(key: string, tokens: string[], phrase: string): number {
  const words = key.split(' ');
  let score = key.includes(phrase) ? 4 : 0;
  for (const t of tokens) {
    if (words.includes(t)) score += 3;
    else if (words.some((w) => w.startsWith(t))) score += 2;
    else if (key.includes(t)) score += 1;
    else if (fuzzyWordMatch(t, words)) score += 1;
    else return 0;
  }
  return score;
}

export function createBibleService(open: () => Promise<BibleDb>): BibleService {
  let cachedBooks: BibleBook[] | null = null;
  return {
    async books() {
      if (cachedBooks) return cachedBooks;
      const db = await open();
      const rows = await db.getAllAsync<BookRow>('SELECT * FROM books ORDER BY id');
      const list = rows.map(toBook);
      // An empty list means the database was not ready; keep nothing so the next call reads it again.
      if (list.length) cachedBooks = list;
      return list;
    },

    async chapter(bookId, chapter, lang) {
      const db = await open();
      const rows = await db.getAllAsync<VerseRow>(
        'SELECT verse, label, text FROM verses WHERE lang = ? AND book = ? AND chapter = ? ORDER BY verse',
        [lang, bookId, chapter],
      );
      return rows satisfies BibleVerse[];
    },

    /**
     * Words in any order, in Telugu or English letters ("devudu" finds దేవుడు), forgiving of
     * small typos; best verses first, then Bible order.
     */
    async search(query, lang, limit = 100) {
      const q = query.trim();
      if (q.length < 2) return [];
      const phrase = verseKey(q, lang);
      const tokens = phrase.split(' ').filter(Boolean);
      const db = await open();
      const select = `SELECT v.book, v.chapter, v.verse, v.label, v.text, v.key, b.name_en, b.short_te
         FROM verses v JOIN books b ON b.id = v.book`;
      const order = 'ORDER BY v.book, v.chapter, v.verse';
      // Telugu verses carry a phonetic key; English is matched on the text itself (LIKE ignores ASCII case).
      const column = lang === 'te' ? 'v.key' : 'v.text';
      const keyOf = (r: HitRow & { key: string }) => (lang === 'te' ? r.key ?? '' : plainKey(r.text));
      const candidates = async (parts: string[], cap: number) =>
        db.getAllAsync<HitRow & { key: string }>(
          `${select} WHERE v.lang = ? AND ${parts.map(() => `${column} LIKE ? ESCAPE '\\'`).join(' AND ')} ${order} LIMIT ?`,
          [lang, ...parts.map(likePattern), cap],
        );
      let rows = tokens.length ? await candidates(tokens, limit * 3) : [];
      if (rows.length === 0 && tokens.length) {
        // Nothing exact: look for verses that contain the start of each word, then keep the near misses.
        const stems = tokens.map((t) => (t.length >= 5 ? t.slice(0, 4) : t));
        rows = (await candidates(stems, limit * 6)).filter((r) => scoreVerse(keyOf(r), tokens, phrase) > 0);
      }
      if (rows.length === 0) {
        // Punctuation-only or unusual input: fall back to the literal text.
        rows = await db.getAllAsync<HitRow & { key: string }>(`${select} WHERE v.lang = ? AND v.text LIKE ? ESCAPE '\\' ${order} LIMIT ?`, [lang, likePattern(q), limit]);
      }
      const ranked = rows
        .map((r, at) => ({ r, at, score: scoreVerse(keyOf(r), tokens, phrase) }))
        .sort((a, b) => b.score - a.score || a.at - b.at)
        .slice(0, limit)
        .map((x) => x.r);
      return ranked.map<SearchHit>((r) => ({
        bookId: r.book,
        bookName: lang === 'te' ? r.short_te : r.name_en,
        chapter: r.chapter,
        verse: r.verse,
        label: r.label,
        text: r.text,
      }));
    },

    async attribution(lang) {
      const db = await open();
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [`attribution_${lang}`]);
      return row?.value ?? '';
    },
  };
}
