import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { looseIncludes, searchKey } from './transliterate';
import type { Resource } from './types';

/** A song with its place in the book. Numbers follow the order songs were added, like a hymnal. */
export type Song = Resource & { number: number };

export function numberSongs(resources: Resource[]): Song[] {
  return resources
    .filter((r) => r.type === 'song')
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map((r, i) => ({ ...r, number: i + 1 }));
}

/** The opening line of the lyrics, for the list. */
export function firstLine(body: string): string {
  return (
    body
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ''
  );
}

/** Lyrics split into verses: blank lines separate paragraphs, single line breaks stay inside a verse. */
export function verses(body: string): string[] {
  return body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Number, title, artist, or any lyric words in Telugu or English letters; an empty query matches everything. */
export function matchesSong(song: Song, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (/^\d+$/.test(q)) return song.number === Number(q);
  return looseIncludes(searchKey(`${song.title} ${song.reference} ${song.body}`), q);
}

export type SongTextSize = 'small' | 'medium' | 'large' | 'xlarge';
export const SONG_TEXT_SIZES: readonly SongTextSize[] = ['small', 'medium', 'large', 'xlarge'];
export const songTextStyle: Record<SongTextSize, { fontSize: number; lineHeight: number }> = {
  small: { fontSize: 16, lineHeight: 27 },
  medium: { fontSize: 19, lineHeight: 32 },
  large: { fontSize: 23, lineHeight: 38 },
  xlarge: { fontSize: 28, lineHeight: 46 },
};

const KEY = 'songbook.textSize';
let cached: SongTextSize | null = null;

/** Remembered lyrics size, shared by every song. */
export function useSongTextSize(): [SongTextSize, (s: SongTextSize) => void] {
  const [size, setSize] = useState<SongTextSize>(cached ?? 'medium');

  useEffect(() => {
    if (cached) return;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (stored && (SONG_TEXT_SIZES as readonly string[]).includes(stored)) {
          cached = stored as SongTextSize;
          setSize(cached);
        }
      })
      .catch(() => undefined);
  }, []);

  const update = useCallback((next: SongTextSize) => {
    cached = next;
    setSize(next);
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  return [size, update];
}
