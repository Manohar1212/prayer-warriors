import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { TranslationKey } from '../../i18n';
import { indexFor, rankBySearch, scoreFor } from './songSearch';

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

const textOf = (hymn: Hymn) => ({ title: hymn.title, body: hymn.body });

/**
 * Number, or any words of the lyrics typed in Telugu or in English letters ("yesu" finds యేసు),
 * in any order and forgiving of typos; an empty query matches everything.
 */
export function matchesHymn(hymn: Hymn, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (/^\d+$/.test(q)) return hymn.n === Number(q);
  return scoreFor(indexFor(hymn, textOf(hymn)), q) > 0;
}

/** The book filtered and ranked for a query: an exact number first, else best matches first. */
export function searchHymns(book: HymnBook, query: string): Hymn[] {
  const hymns = loadHymnBook(book);
  const q = query.trim();
  if (/^\d+$/.test(q)) return hymns.filter((h) => h.n === Number(q));
  return rankBySearch(hymns, q, textOf);
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
