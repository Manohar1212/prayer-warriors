import { DAILY_VERSES, pickDailyVerse } from './verseOfTheDay';

describe('pickDailyVerse', () => {
  it('is stable within a day and covers the list across days', () => {
    const a = pickDailyVerse(new Date('2026-09-09T06:00:00'));
    const b = pickDailyVerse(new Date('2026-09-09T23:00:00'));
    expect(a).toEqual(b);
    const seen = new Set(Array.from({ length: DAILY_VERSES.length }, (_, i) => pickDailyVerse(new Date(2026, 0, 1 + i)).code + pickDailyVerse(new Date(2026, 0, 1 + i)).chapter));
    expect(seen.size).toBeGreaterThan(DAILY_VERSES.length * 0.8);
  });

  it('only references real chapters with sensible verse ranges', () => {
    for (const v of DAILY_VERSES) {
      expect(v.code).toMatch(/^[1-3A-Z]{3}$/);
      expect(v.chapter).toBeGreaterThan(0);
      expect(v.from).toBeGreaterThan(0);
      expect(v.to).toBeGreaterThanOrEqual(v.from);
      expect(v.to - v.from).toBeLessThan(4);
    }
    expect(DAILY_VERSES.length).toBeGreaterThanOrEqual(30);
  });
});
