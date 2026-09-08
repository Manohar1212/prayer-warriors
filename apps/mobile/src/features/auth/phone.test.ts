import { toE164 } from './phone';

describe('toE164', () => {
  it.each([
    ['91', '98765 43210', '+919876543210'],
    ['+91', '098765-43210', '+919876543210'],
    ['44', '07700 900123', '+447700900123'],
    ['1', '(415) 555-0132', '+14155550132'],
  ])('normalises %s %s', (cc, national, expected) => {
    expect(toE164(cc, national)).toBe(expected);
  });

  it.each([
    ['91', '12345'],
    ['', '9876543210'],
    ['91', ''],
    ['0', '9876543210'],
    ['91', '98765432109876543'],
  ])('rejects %s %s', (cc, national) => {
    expect(toE164(cc, national)).toBeNull();
  });
});
