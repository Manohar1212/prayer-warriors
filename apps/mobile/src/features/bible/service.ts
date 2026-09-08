import type { BibleDb } from '../../lib/bibleDb.types';
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

export function createBibleService(open: () => Promise<BibleDb>): BibleService {
  let cachedBooks: BibleBook[] | null = null;
  return {
    async books() {
      if (cachedBooks) return cachedBooks;
      const db = await open();
      const rows = await db.getAllAsync<BookRow>('SELECT * FROM books ORDER BY id');
      cachedBooks = rows.map(toBook);
      return cachedBooks;
    },

    async chapter(bookId, chapter, lang) {
      const db = await open();
      const rows = await db.getAllAsync<VerseRow>(
        'SELECT verse, label, text FROM verses WHERE lang = ? AND book = ? AND chapter = ? ORDER BY verse',
        [lang, bookId, chapter],
      );
      return rows satisfies BibleVerse[];
    },

    async search(query, lang, limit = 100) {
      const q = query.trim();
      if (q.length < 2) return [];
      const db = await open();
      const rows = await db.getAllAsync<HitRow>(
        `SELECT v.book, v.chapter, v.verse, v.label, v.text, b.name_en, b.short_te
         FROM verses v JOIN books b ON b.id = v.book
         WHERE v.lang = ? AND v.text LIKE ? ESCAPE '\\'
         ORDER BY v.book, v.chapter, v.verse LIMIT ?`,
        [lang, likePattern(q), limit],
      );
      return rows.map<SearchHit>((r) => ({
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
