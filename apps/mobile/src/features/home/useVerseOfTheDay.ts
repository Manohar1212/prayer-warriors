import { useEffect, useState } from 'react';

import { bibleService, bookName, type BibleLanguage } from '../bible';
import type { PromiseLanguage } from './promiseLanguage';
import { PROMISE_TRANSLATIONS } from './promiseTranslations';
import { passageKey, pickDailyVerse, verseRange } from './verseOfTheDay';

export type VerseOfTheDay = { reference: string; text: string; bookId: number; chapter: number };

/** Today's passage. English and Telugu are read from the bundled Bible; the other languages from the promise translations. */
export function useVerseOfTheDay(lang: BibleLanguage | PromiseLanguage): VerseOfTheDay | null {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  useEffect(() => {
    let cancelled = false;
    const pick = pickDailyVerse(new Date());
    (async () => {
      const books = await bibleService.books();
      const book = books.find((b) => b.code === pick.code);
      if (!book) return;
      if (lang !== 'en' && lang !== 'te') {
        const bundled = PROMISE_TRANSLATIONS[lang][passageKey(pick)];
        if (bundled && !cancelled) setVerse({ ...bundled, bookId: book.id, chapter: pick.chapter });
        return;
      }
      const verses = await bibleService.chapter(book.id, pick.chapter, lang);
      const text = verses
        .filter((v) => v.verse >= pick.from && v.verse <= pick.to)
        .map((v) => v.text)
        .join(' ');
      if (!text || cancelled) return;
      setVerse({ reference: `${bookName(book, lang, true)} ${pick.chapter}:${verseRange(pick)}`, text, bookId: book.id, chapter: pick.chapter });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return verse;
}
