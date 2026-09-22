import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { reportIfSessionExpired } from './session';

/**
 * Data that a screen fetches when it comes into view, remembered across visits so the second
 * time a screen opens it shows the last result at once and quietly refreshes behind it.
 *
 * - One request per focus (the first focus is the mount), never two.
 * - `loading` is true only while there is nothing to show yet for this key.
 * - `setData` updates both the screen and the cache, for optimistic edits.
 */

const cache = new Map<string, unknown>();
/** Bumped on sign-out, so an answer still on its way for the last account is thrown away. */
let generation = 0;

/** Forget everything, e.g. when a member signs out. */
export function clearQueryCache(): void {
  cache.clear();
  generation += 1;
}

export type CachedQuery<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (update: (current: T | null) => T | null) => void;
};

export function useCachedQuery<T>(key: string, fetcher: () => Promise<T>, options: { fallback?: string; onLoaded?: (data: T) => void } = {}): CachedQuery<T> {
  const [data, setState] = useState<T | null>(() => (cache.has(key) ? (cache.get(key) as T) : null));
  const [loading, setLoading] = useState(() => !cache.has(key));
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const onLoadedRef = useRef(options.onLoaded);
  onLoadedRef.current = options.onLoaded;
  const fallback = options.fallback ?? 'Could not load.';
  const keyRef = useRef(key);

  // A new key (another tab, another month): show what we already have for it, or a spinner.
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    if (cache.has(key)) {
      setState(cache.get(key) as T);
      setLoading(false);
    } else {
      setState(null);
      setLoading(true);
    }
    setError(null);
  }, [key]);

  const refresh = useCallback(async () => {
    const startedIn = generation;
    try {
      const next = await fetcherRef.current();
      if (startedIn !== generation) return;
      cache.set(key, next);
      if (keyRef.current === key) {
        setState(next);
        setError(null);
      }
      onLoadedRef.current?.(next);
    } catch (err) {
      reportIfSessionExpired(err);
      if (keyRef.current === key) setError(err instanceof Error ? err.message : fallback);
    } finally {
      if (keyRef.current === key) setLoading(false);
    }
  }, [key, fallback]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const setData = useCallback(
    (update: (current: T | null) => T | null) => {
      setState((current) => {
        const next = update(current);
        if (next === null) cache.delete(key);
        else cache.set(key, next);
        return next;
      });
    },
    [key],
  );

  return { data, loading, error, refresh, setData };
}
