import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

import { useLanguage } from '../../i18n';
import type { BibleLanguage } from './types';

const KEY = 'bible.language';
const VALID: readonly BibleLanguage[] = ['en', 'te'];

/** The reader's own Bible choice, shared by every open Bible screen; null until they pick one. */
let chosen: BibleLanguage | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (chosen === null && stored && (VALID as readonly string[]).includes(stored)) {
          chosen = stored as BibleLanguage;
          emit();
        }
      })
      .catch(() => undefined);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The language the Bible reads in. It is separate from the app language: switching it only
 * changes the verses. Until the reader switches it, it follows the app language.
 */
export function useBibleLanguage(): [BibleLanguage, (lang: BibleLanguage) => void] {
  const { language } = useLanguage();
  const stored = useSyncExternalStore(subscribe, () => chosen);
  const set = useCallback((lang: BibleLanguage) => {
    chosen = lang;
    emit();
    AsyncStorage.setItem(KEY, lang).catch(() => undefined);
  }, []);
  return [stored ?? language, set];
}
