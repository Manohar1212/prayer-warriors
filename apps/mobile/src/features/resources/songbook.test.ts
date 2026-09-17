jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { firstLine, matchesSong, numberSongs, verses } from './songbook';
import type { Resource } from './types';

const song = (o: Partial<Resource>): Resource => ({
  id: 'x', type: 'song', title: 'T', body: '', reference: '', url: '', note: '', sharedBy: 'Shiny', createdById: 'u1', createdAt: '2026-09-01T00:00:00.000Z', ...o,
});

describe('numberSongs', () => {
  it('numbers songs in the order they were added and skips other types', () => {
    const rows = [
      song({ id: 'c', title: 'Third', createdAt: '2026-09-03T00:00:00.000Z' }),
      song({ id: 'p', type: 'prayer', title: 'Not a song', createdAt: '2026-09-02T00:00:00.000Z' }),
      song({ id: 'a', title: 'First', createdAt: '2026-09-01T00:00:00.000Z' }),
      song({ id: 'b', title: 'Second', createdAt: '2026-09-02T00:00:00.000Z' }),
    ];
    expect(numberSongs(rows).map((s) => [s.number, s.title])).toEqual([[1, 'First'], [2, 'Second'], [3, 'Third']]);
  });
});

describe('lyrics helpers', () => {
  const body = '\r\nYesu nadhu priyudu\nNaa praana priyudu\n\n\nAyana premaku saati ledu\n';
  it('takes the first non-empty line', () => {
    expect(firstLine(body)).toBe('Yesu nadhu priyudu');
    expect(firstLine('')).toBe('');
  });
  it('splits verses on blank lines', () => {
    expect(verses(body)).toEqual(['Yesu nadhu priyudu\nNaa praana priyudu', 'Ayana premaku saati ledu']);
  });
});

describe('matchesSong', () => {
  const [s] = numberSongs([song({ id: 'a', title: 'నా ప్రాణ ప్రియుడా', reference: 'Bro. Anil', body: 'Yesu nadhu priyudu\nNaa praana priyudu' })]);
  it('matches number, title, artist and lyric lines', () => {
    expect(matchesSong(s, '1')).toBe(true);
    expect(matchesSong(s, '2')).toBe(false);
    expect(matchesSong(s, 'ప్రాణ')).toBe(true);
    expect(matchesSong(s, 'anil')).toBe(true);
    expect(matchesSong(s, 'praana')).toBe(true);
    expect(matchesSong(s, 'zzz')).toBe(false);
    expect(matchesSong(s, '  ')).toBe(true);
  });
});
