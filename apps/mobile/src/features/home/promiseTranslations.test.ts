jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { PROMISE_LANGUAGES } from './promiseLanguage';
import { PROMISE_TRANSLATIONS } from './promiseTranslations';
import { DAILY_VERSES, passageKey, verseRange } from './verseOfTheDay';

/** Each bundled language must actually be written in its own script. */
const SCRIPT = { ta: /[஀-௿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/, hi: /[ऀ-ॿ]/ } as const;

describe('PROMISE_TRANSLATIONS', () => {
  it('has every daily passage in every bundled language, in its own script', () => {
    for (const lang of Object.keys(SCRIPT) as (keyof typeof SCRIPT)[]) {
      for (const p of DAILY_VERSES) {
        const entry = PROMISE_TRANSLATIONS[lang][passageKey(p)];
        expect(entry).toBeDefined();
        expect(entry.text).toMatch(SCRIPT[lang]);
        expect(entry.reference).toMatch(SCRIPT[lang]);
        expect(entry.reference.endsWith(` ${p.chapter}:${verseRange(p)}`)).toBe(true);
      }
    }
  });

  it('covers every pill except Telugu, which is read from the Bible', () => {
    const bundled = PROMISE_LANGUAGES.map((l) => l.code).filter((c) => c !== 'te');
    expect(Object.keys(PROMISE_TRANSLATIONS).sort()).toEqual([...bundled].sort());
  });
});
