import { looseIncludes, searchKey, transliterate } from './transliterate';

describe('transliterate', () => {
  it('romanises Telugu words', () => {
    expect(transliterate('యేసు నా ప్రియుడు')).toBe('yesu naa priyudu');
    expect(transliterate('ప్రభు')).toBe('prabhu');
    expect(transliterate('స్తుతి')).toBe('stuti');
    expect(transliterate('అందాల తార')).toBe('andaala taara');
    expect(transliterate('నన్ను')).toBe('nannu');
    expect(transliterate('సంపూర్ణ')).toBe('sampuurna');
    expect(transliterate('Amazing Grace 12')).toBe('Amazing Grace 12');
  });
});

describe('searchKey', () => {
  it('folds the spellings people use', () => {
    expect(searchKey('sthuthi')).toBe(searchKey('స్తుతి'));
    expect(searchKey('Yesu')).toBe(searchKey('యేసు'));
    expect(searchKey('prabhu')).toBe(searchKey('ప్రభు'));
    expect(searchKey('andala thara')).toBe(searchKey('అందాల తార'));
    expect(searchKey('nannu')).toBe(searchKey('నన్ను'));
    expect(searchKey('yehova')).toBe(searchKey('యెహోవా'));
    expect(searchKey('devudu')).toBe(searchKey('దేవుడు'));
    expect(searchKey('vishwasam')).toBe(searchKey('విశ్వాసం'));
    expect(searchKey('nee prema')).toBe(searchKey('నీ ప్రేమ'));
    expect(searchKey('kripa')).toBe(searchKey('కృప'));
    expect(searchKey('christu')).toBe(searchKey('క్రీస్తు'));
    expect(searchKey('kreesthu')).toBe(searchKey('క్రీస్తు'));
    expect(searchKey('hallelujah')).toBe(searchKey('హల్లెలూయా'));
    expect(searchKey('raksha')).toBe(searchKey('రక్ష'));
  });

  it('keeps different words apart', () => {
    expect(searchKey('మా')).not.toBe(searchKey('నా'));
    expect(searchKey('yesu')).not.toBe(searchKey('yesayya'));
  });
});

describe('looseIncludes', () => {
  const key = searchKey('నా ప్రాణ ప్రియుడా యేసయ్యా\nనీ ప్రేమకు సాటి లేదయ్యా');
  it('matches English-letter, Telugu, and empty queries', () => {
    expect(looseIncludes(key, 'yesayya')).toBe(true);
    expect(looseIncludes(key, 'naa praana')).toBe(true);
    expect(looseIncludes(key, 'ప్రేమకు')).toBe(true);
    expect(looseIncludes(key, '')).toBe(true);
    expect(looseIncludes(key, 'hallelujah')).toBe(false);
  });
});
