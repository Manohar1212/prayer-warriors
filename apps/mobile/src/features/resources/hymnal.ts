import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { TranslationKey } from '../../i18n';

/**
 * Books bundled with the app: the classic Andhra Kraisthava Keerthanalu hymnal and a
 * collection of Telugu Christian songs, both in Telugu script. The group's own shared songs
 * are the third book, "Our songs", which lives on the server.
 */
export type HymnBook = 'akk' | 'telugu';
export type SongBook = 'group' | HymnBook;

export type Hymn = { n: number; title: string; body: string };

export const HYMN_BOOKS: { id: HymnBook; label: TranslationKey }[] = [
  { id: 'akk', label: 'resources.book.akk' },
  { id: 'telugu', label: 'resources.book.telugu' },
];

const cache: Partial<Record<HymnBook, Hymn[]>> = {};

/** The songs of a bundled book, loaded once. */
export function loadHymnBook(book: HymnBook): Hymn[] {
  if (!cache[book]) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache[book] = (book === 'akk' ? require('../../../assets/hymnal/akk.json') : require('../../../assets/hymnal/telugu-songs.json')) as Hymn[];
  }
  return cache[book] as Hymn[];
}

export function findHymn(book: HymnBook, n: number): { hymn: Hymn; previous: Hymn | null; next: Hymn | null } | null {
  const hymns = loadHymnBook(book);
  const index = hymns.findIndex((h) => h.n === n);
  if (index < 0) return null;
  return { hymn: hymns[index], previous: index > 0 ? hymns[index - 1] : null, next: index < hymns.length - 1 ? hymns[index + 1] : null };
}

/** Number, title, or any line of the lyrics; an empty query matches everything. */
export function matchesHymn(hymn: Hymn, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (/^\d+$/.test(q)) return hymn.n === Number(q);
  return hymn.title.toLowerCase().includes(q) || hymn.body.toLowerCase().includes(q);
}

const BOOK_KEY = 'songbook.book';
const BOOKS: readonly SongBook[] = ['group', 'akk', 'telugu'];
let cachedBook: SongBook | null = null;

/** The book the member last had open. */
export function useSongBook(): [SongBook, (b: SongBook) => void] {
  const [book, setBook] = useState<SongBook>(cachedBook ?? 'akk');

  useEffect(() => {
    if (cachedBook) return;
    AsyncStorage.getItem(BOOK_KEY)
      .then((stored) => {
        if (stored && (BOOKS as readonly string[]).includes(stored)) {
          cachedBook = stored as SongBook;
          setBook(cachedBook);
        }
      })
      .catch(() => undefined);
  }, []);

  const update = useCallback((next: SongBook) => {
    cachedBook = next;
    setBook(next);
    AsyncStorage.setItem(BOOK_KEY, next).catch(() => undefined);
  }, []);

  return [book, update];
}
