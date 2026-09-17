jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { loadHymnBook, searchHymns } from './hymnal';
import { rankBySearch } from './songSearch';

const songs = [
  { id: 'a', title: 'యేసు నా ప్రియుడు', body: 'యేసు నా ప్రియుడు\nనా ఆశ్రయము నీవే' },
  { id: 'b', title: 'నా ప్రాణ ప్రియుడా', body: 'నాప్రాణప్రియుడా యేసయ్యా\nనీ ప్రేమకు సాటి లేదయ్యా' },
  { id: 'c', title: 'Amazing Grace', body: 'Amazing grace how sweet the sound' },
];
const textOf = (s: (typeof songs)[number]) => ({ title: s.title, body: s.body });

describe('rankBySearch', () => {
  it('matches words in any order, with typos, and through joined words', () => {
    expect(rankBySearch(songs, 'priyudu yesu', textOf).map((s) => s.id)).toEqual(['a']);
    expect(rankBySearch(songs, 'yesu priyudi', textOf).map((s) => s.id)).toEqual(['a']);
    expect(rankBySearch(songs, 'naa praana', textOf).map((s) => s.id)).toEqual(['b']);
    expect(rankBySearch(songs, 'prem', textOf).map((s) => s.id)).toEqual(['b']);
    expect(rankBySearch(songs, 'amazng grace', textOf).map((s) => s.id)).toEqual(['c']);
    expect(rankBySearch(songs, 'hallelujah', textOf)).toEqual([]);
    expect(rankBySearch(songs, '  ', textOf)).toHaveLength(3);
  });

  it('puts the song whose title matches first', () => {
    expect(rankBySearch(songs, 'yesayya', textOf).map((s) => s.id)).toEqual(['b']);
    expect(rankBySearch(songs, 'yesu', textOf).map((s) => s.id)[0]).toBe('a');
  });
});

describe('searchHymns', () => {
  it('finds hymns for the ways people actually type', () => {
    const counts = Object.fromEntries(['nee prema', 'kripa', 'christu', 'kreesthu', 'hallelujah', 'yesayya', 'aaradhana', 'sthothram', 'parishuddha', 'kapari yehova'].map((q) => [q, searchHymns('akk', q).length]));
    for (const [q, n] of Object.entries(counts)) expect({ q, n }).toEqual({ q, n: expect.any(Number) });
    for (const q of Object.keys(counts)) expect(counts[q]).toBeGreaterThan(0);
  });

  it('ranks the hymn that starts with the phrase first and stays fast', () => {
    const started = Date.now();
    expect(searchHymns('akk', 'yehova na kapari')[0].n).toBe(15);
    expect(searchHymns('akk', 'anni kalambula')[0].n).toBe(1);
    expect(searchHymns('akk', '100').map((h) => h.n)).toEqual([100]);
    expect(searchHymns('akk', 'యెహోవా నా కాపరి')[0].n).toBe(15);
    for (let i = 0; i < 5; i += 1) searchHymns('akk', 'parishuddha devuni');
    expect(Date.now() - started).toBeLessThan(6000);
    expect(loadHymnBook('telugu').length).toBeGreaterThan(0);
  });
});
