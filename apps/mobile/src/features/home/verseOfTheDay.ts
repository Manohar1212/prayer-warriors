export type DailyVerse = { code: string; chapter: number; from: number; to: number };

/** Well-loved passages, rotated by day of the year. Read from the bundled Bible in the chosen language. */
export const DAILY_VERSES: DailyVerse[] = [
  { code: 'JHN', chapter: 3, from: 16, to: 16 },
  { code: 'PSA', chapter: 23, from: 1, to: 1 },
  { code: 'PHP', chapter: 4, from: 13, to: 13 },
  { code: 'ROM', chapter: 8, from: 28, to: 28 },
  { code: 'JER', chapter: 29, from: 11, to: 11 },
  { code: 'ISA', chapter: 41, from: 10, to: 10 },
  { code: 'PRO', chapter: 3, from: 5, to: 6 },
  { code: 'MAT', chapter: 11, from: 28, to: 28 },
  { code: 'PSA', chapter: 46, from: 1, to: 1 },
  { code: 'JOS', chapter: 1, from: 9, to: 9 },
  { code: 'PHP', chapter: 4, from: 6, to: 7 },
  { code: 'ROM', chapter: 12, from: 12, to: 12 },
  { code: '1TH', chapter: 5, from: 16, to: 18 },
  { code: 'JAS', chapter: 5, from: 16, to: 16 },
  { code: 'PSA', chapter: 121, from: 1, to: 2 },
  { code: 'ISA', chapter: 40, from: 31, to: 31 },
  { code: 'MAT', chapter: 6, from: 33, to: 33 },
  { code: 'HEB', chapter: 11, from: 1, to: 1 },
  { code: '2CO', chapter: 12, from: 9, to: 9 },
  { code: 'PSA', chapter: 27, from: 1, to: 1 },
  { code: 'LAM', chapter: 3, from: 22, to: 23 },
  { code: 'PSA', chapter: 34, from: 18, to: 18 },
  { code: 'JHN', chapter: 14, from: 27, to: 27 },
  { code: 'ROM', chapter: 15, from: 13, to: 13 },
  { code: 'EPH', chapter: 2, from: 8, to: 9 },
  { code: 'PSA', chapter: 91, from: 1, to: 2 },
  { code: '1PE', chapter: 5, from: 7, to: 7 },
  { code: 'GAL', chapter: 5, from: 22, to: 23 },
  { code: 'MIC', chapter: 6, from: 8, to: 8 },
  { code: 'PSA', chapter: 119, from: 105, to: 105 },
  { code: 'MAT', chapter: 5, from: 16, to: 16 },
  { code: 'COL', chapter: 3, from: 23, to: 23 },
  { code: 'PSA', chapter: 37, from: 4, to: 5 },
  { code: 'ISA', chapter: 26, from: 3, to: 3 },
  { code: 'MAT', chapter: 18, from: 20, to: 20 },
  { code: 'PSA', chapter: 100, from: 4, to: 5 },
];

export function pickDailyVerse(date: Date): DailyVerse {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return DAILY_VERSES[day % DAILY_VERSES.length];
}
