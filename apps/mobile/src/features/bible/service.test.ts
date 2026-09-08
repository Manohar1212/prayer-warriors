import type { BibleDb } from '../../lib/bibleDb.types';
import { createBibleService, likePattern } from './service';

const books = [
  { id: 1, code: 'GEN', testament: 'OT', name_en: 'Genesis', name_te: 'ఆదికాండం', short_te: 'ఆది', chapters_en: 50, chapters_te: 50 },
  { id: 43, code: 'JHN', testament: 'NT', name_en: 'John', name_te: 'యోహాను రాసిన సువార్త', short_te: 'యోహాను', chapters_en: 21, chapters_te: 21 },
];

function fakeDb() {
  const calls: { sql: string; params?: (string | number)[] }[] = [];
  const db: BibleDb = {
    async getAllAsync(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT * FROM books')) return books as never[];
      if (sql.includes('FROM verses v JOIN books')) return [{ book: 43, chapter: 3, verse: 16, label: '16', text: 'For God so loved…', name_en: 'John', short_te: 'యోహాను' }] as never[];
      return [{ verse: 1, label: '1', text: 'In the beginning' }, { verse: 2, label: '2-3', text: 'The earth' }] as never[];
    },
    async getFirstAsync(sql, params) {
      calls.push({ sql, params });
      return { value: `attr-${params?.[0]}` } as never;
    },
  };
  return { db, calls };
}

describe('bibleService', () => {
  it('lists and caches books', async () => {
    const { db, calls } = fakeDb();
    const open = jest.fn(async () => db);
    const service = createBibleService(open);
    const first = await service.books();
    await service.books();
    expect(first[1]).toMatchObject({ id: 43, nameEn: 'John', shortTe: 'యోహాను', testament: 'NT', chaptersEn: 21 });
    expect(calls.filter((c) => c.sql.startsWith('SELECT * FROM books'))).toHaveLength(1);
  });

  it('reads a chapter in the requested language', async () => {
    const { db, calls } = fakeDb();
    const verses = await createBibleService(async () => db).chapter(1, 1, 'te');
    expect(verses).toEqual([{ verse: 1, label: '1', text: 'In the beginning' }, { verse: 2, label: '2-3', text: 'The earth' }]);
    expect(calls[0].params).toEqual(['te', 1, 1]);
  });

  it('searches with an escaped LIKE pattern and language-specific book names', async () => {
    const { db, calls } = fakeDb();
    const service = createBibleService(async () => db);
    const hits = await service.search('so loved', 'te', 50);
    expect(hits[0]).toEqual({ bookId: 43, bookName: 'యోహాను', chapter: 3, verse: 16, label: '16', text: 'For God so loved…' });
    expect(calls[0].params).toEqual(['te', '%so loved%', 50]);
    expect(await service.search('a', 'en')).toEqual([]);
  });

  it('escapes LIKE wildcards', () => {
    expect(likePattern('100%')).toBe('%100\\%%');
    expect(likePattern(' a_b ')).toBe('%a\\_b%');
  });

  it('reads the attribution line', async () => {
    const { db } = fakeDb();
    await expect(createBibleService(async () => db).attribution('te')).resolves.toBe('attr-attribution_te');
  });
});
