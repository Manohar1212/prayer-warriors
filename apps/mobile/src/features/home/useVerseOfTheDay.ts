import { useEffect, useState } from 'react';

import { bibleService, bookName, type BibleLanguage } from '../bible';
import { pickDailyVerse } from './verseOfTheDay';

export type VerseOfTheDay = { reference: string; text: string; bookId: number; chapter: number };

export function useVerseOfTheDay(lang: BibleLanguage): VerseOfTheDay | null {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  useEffect(() => {
    let cancelled = false;
    const pick = pickDailyVerse(new Date());
    (async () => {
      const books = await bibleService.books();
      const book = books.find((b) => b.code === pick.code);
      if (!book) return;
      const verses = await bibleService.chapter(book.id, pick.chapter, lang);
      const text = verses
        .filter((v) => v.verse >= pick.from && v.verse <= pick.to)
        .map((v) => v.text)
        .join(' ');
      if (!text || cancelled) return;
      const range = pick.from === pick.to ? `${pick.from}` : `${pick.from}-${pick.to}`;
      setVerse({ reference: `${bookName(book, lang, true)} ${pick.chapter}:${range}`, text, bookId: book.id, chapter: pick.chapter });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return verse;
}
