import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { en, type TranslationKey } from './en';
import { te } from './te';

export type Language = 'en' | 'te';
export type { TranslationKey };

const KEY = 'app.language';
const LEGACY_KEY = 'bible.language';
let cached: Language | null = null;

type Vars = Record<string, string | number>;

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

/** Resolve a key in a language, falling back to English. Usable outside React (services, formatters). */
export function translate(language: Language, key: TranslationKey, vars?: Vars): string {
  const table = language === 'te' ? te : undefined;
  return fill((table && table[key]) || en[key], vars);
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  /** BCP 47 tag for date and number formatting. */
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(cached ?? 'en');

  useEffect(() => {
    if (cached) return;
    (async () => {
      const stored = (await AsyncStorage.getItem(KEY)) ?? (await AsyncStorage.getItem(LEGACY_KEY));
      if (stored === 'te' || stored === 'en') {
        cached = stored;
        setLanguageState(stored);
      }
    })().catch(() => undefined);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    cached = next;
    setLanguageState(next);
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
      locale: language === 'te' ? 'te-IN' : 'en-IN',
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

/** The translation function on its own, for screens that only read copy. */
export function useT(): LanguageContextValue['t'] {
  return useLanguage().t;
}
