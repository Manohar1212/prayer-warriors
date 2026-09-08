export type BibleLanguage = 'en' | 'te';

export type BibleBook = {
  id: number;
  code: string;
  testament: 'OT' | 'NT';
  nameEn: string;
  nameTe: string;
  shortTe: string;
  chaptersEn: number;
  chaptersTe: number;
};

export type BibleVerse = { verse: number; label: string; text: string };

export type SearchHit = {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  label: string;
  text: string;
};

export type BibleService = {
  books(): Promise<BibleBook[]>;
  chapter(bookId: number, chapter: number, lang: BibleLanguage): Promise<BibleVerse[]>;
  search(query: string, lang: BibleLanguage, limit?: number): Promise<SearchHit[]>;
  attribution(lang: BibleLanguage): Promise<string>;
};

export function bookName(book: BibleBook, lang: BibleLanguage, short = false): string {
  if (lang === 'te') return short ? book.shortTe : book.nameTe;
  return book.nameEn;
}

export function chapterCount(book: BibleBook, lang: BibleLanguage): number {
  return lang === 'te' ? book.chaptersTe : book.chaptersEn;
}
