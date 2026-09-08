import { useEffect, useState } from 'react';

import { bibleService } from './index';
import type { BibleBook, BibleLanguage, BibleVerse, SearchHit } from './types';

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Could not load the Bible.';
}

export function useBooks(): { books: BibleBook[]; error: string | null } {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    bibleService.books().then(setBooks).catch((err) => setError(messageOf(err)));
  }, []);
  return { books, error };
}

export function useChapter(bookId: number, chapter: number, lang: BibleLanguage) {
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setVerses(null);
    bibleService
      .chapter(bookId, chapter, lang)
      .then((v) => {
        if (!cancelled) setVerses(v);
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err));
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, lang]);
  return { verses, error };
}

export function useSearch(query: string, lang: BibleLanguage) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      bibleService
        .search(q, lang, 200)
        .then((h) => {
          if (!cancelled) setHits(h);
        })
        .catch((err) => {
          if (!cancelled) setError(messageOf(err));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, lang]);
  return { hits, searching, error };
}

export function useAttribution(lang: BibleLanguage): string {
  const [text, setText] = useState('');
  useEffect(() => {
    bibleService.attribution(lang).then(setText).catch(() => setText(''));
  }, [lang]);
  return text;
}
