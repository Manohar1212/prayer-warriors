import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** Small persisted preference backed by AsyncStorage with a module-level cache. */
function usePersisted<T extends string>(key: string, fallback: T, valid: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>((cache.get(key) as T) ?? fallback);

  useEffect(() => {
    if (cache.has(key)) return;
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (stored && (valid as readonly string[]).includes(stored)) {
          cache.set(key, stored);
          setValue(stored as T);
        }
      })
      .catch(() => undefined);
  }, [key, valid]);

  const update = useCallback(
    (next: T) => {
      cache.set(key, next);
      setValue(next);
      AsyncStorage.setItem(key, next).catch(() => undefined);
    },
    [key],
  );

  return [value, update];
}

const cache = new Map<string, string>();

export type TextSize = 'small' | 'medium' | 'large';
const TEXT_SIZES: readonly TextSize[] = ['small', 'medium', 'large'];

export function useBibleTextSize(): [TextSize, (s: TextSize) => void] {
  return usePersisted<TextSize>('bible.textSize', 'medium', TEXT_SIZES);
}

/** Font size and line height (px) for verse text. */
export const textSizeStyle: Record<TextSize, { fontSize: number; lineHeight: number }> = {
  small: { fontSize: 15, lineHeight: 25 },
  medium: { fontSize: 17, lineHeight: 29 },
  large: { fontSize: 21, lineHeight: 35 },
};

export type LastRead = { bookId: number; chapter: number };
const LAST_READ_KEY = 'bible.lastRead';

export async function saveLastRead(pos: LastRead): Promise<void> {
  cache.set(LAST_READ_KEY, JSON.stringify(pos));
  await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(pos)).catch(() => undefined);
}

export function useLastRead(): LastRead | null {
  const [pos, setPos] = useState<LastRead | null>(() => {
    const cached = cache.get(LAST_READ_KEY);
    return cached ? (JSON.parse(cached) as LastRead) : null;
  });
  useEffect(() => {
    AsyncStorage.getItem(LAST_READ_KEY)
      .then((stored) => {
        if (!stored) return;
        cache.set(LAST_READ_KEY, stored);
        setPos(JSON.parse(stored) as LastRead);
      })
      .catch(() => undefined);
  }, []);
  return pos;
}
