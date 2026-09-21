import { usePersisted } from '../bible/usePrefs';

/** The language the Daily Promise shows under English. Telugu comes from the Bible; the rest are bundled. */
export type PromiseLanguage = 'te' | 'ta' | 'kn' | 'ml' | 'hi';

/** In the order the pills show, each named in its own script. */
export const PROMISE_LANGUAGES: { code: PromiseLanguage; label: string }[] = [
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'hi', label: 'हिन्दी' },
];

const CODES = PROMISE_LANGUAGES.map((l) => l.code);

export function usePromiseLanguage(): [PromiseLanguage, (lang: PromiseLanguage) => void] {
  return usePersisted<PromiseLanguage>('promise.language', 'te', CODES);
}
