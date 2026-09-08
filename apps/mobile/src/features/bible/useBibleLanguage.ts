import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { BibleLanguage } from './types';

const KEY = 'bible.language';
let cached: BibleLanguage | null = null;

export function useBibleLanguage(): [BibleLanguage, (lang: BibleLanguage) => void] {
  const [lang, setLang] = useState<BibleLanguage>(cached ?? 'en');

  useEffect(() => {
    if (cached) return;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (stored === 'te' || stored === 'en') {
          cached = stored;
          setLang(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const update = useCallback((next: BibleLanguage) => {
    cached = next;
    setLang(next);
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  return [lang, update];
}
