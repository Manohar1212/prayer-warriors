import { formatMobile, parseMobile, toE164 } from './phone';

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

describe('parseMobile', () => {
  it.each([
    ['9100641194', '+919100641194'],
    ['91006 41194', '+919100641194'],
    ['091006-41194', '+919100641194'],
    ['+91 91006 41194', '+919100641194'],
    ['+44 7700 900123', '+447700900123'],
  ])('reads %s as %s', (input, expected) => {
    expect(parseMobile(input)).toBe(expected);
  });
  it.each(['12345', '91006411940', 'phone', '+0123'])('refuses %s', (input) => {
    expect(parseMobile(input)).toBeNull();
  });
});

describe('formatMobile', () => {
  it('groups an Indian number and leaves others alone', () => {
    expect(formatMobile('+919100641194')).toBe('+91 91006 41194');
    expect(formatMobile('+447700900123')).toBe('+447700900123');
  });
});
