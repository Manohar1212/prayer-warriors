jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { findHymn, loadHymnBook, matchesHymn } from './hymnal';

describe('bundled hymn books', () => {
  it('ship the full AKK hymnal and the Telugu song collection in Telugu script', () => {
    const akk = loadHymnBook('akk');
    const telugu = loadHymnBook('telugu');
    expect(akk).toHaveLength(684);
    expect(akk[0].n).toBe(1);
    expect(akk[akk.length - 1].n).toBe(684);
    expect(telugu.length).toBeGreaterThan(250);
    for (const h of [...akk, ...telugu]) {
      expect(h.title.length).toBeGreaterThan(0);
      expect(h.body.length).toBeGreaterThan(20);
      expect(h.body).toMatch(/[ఀ-౿]/);
    }
  });

  it('finds a hymn with its neighbours', () => {
    const first = findHymn('akk', 1);
    expect(first?.previous).toBeNull();
    expect(first?.next?.n).toBe(2);
    expect(findHymn('akk', 684)?.next).toBeNull();
    expect(findHymn('akk', 9999)).toBeNull();
  });

  it('matches by number, title, or a lyric line', () => {
    const hymn = { n: 12, title: 'యేసు నా ప్రియుడు', body: 'యేసు నా ప్రియుడు\nనా ఆశ్రయము' };
    expect(matchesHymn(hymn, '12')).toBe(true);
    expect(matchesHymn(hymn, '13')).toBe(false);
    expect(matchesHymn(hymn, 'ఆశ్రయ')).toBe(true);
    expect(matchesHymn(hymn, '')).toBe(true);
  });
});
