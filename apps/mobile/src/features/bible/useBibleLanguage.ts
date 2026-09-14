import { useLanguage } from '../../i18n';
import type { BibleLanguage } from './types';

/** The Bible reads in the app language; the toggle inside the Bible changes it for the whole app. */
export function useBibleLanguage(): [BibleLanguage, (lang: BibleLanguage) => void] {
  const { language, setLanguage } = useLanguage();
  return [language, setLanguage];
}
