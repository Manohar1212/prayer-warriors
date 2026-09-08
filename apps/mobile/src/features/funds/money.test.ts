import { formatRupees, parseRupees } from './money';

describe('formatRupees', () => {
  it.each([
    [0, '₹0'],
    [500, '₹5'],
    [123450, '₹1,234.50'],
    [4850000, '₹48,500'],
    [100000000, '₹10,00,000'],
    [1234567890, '₹1,23,45,678.90'],
    [-350000, '−₹3,500'],
  ])('%i paise → %s', (paise, expected) => {
    expect(formatRupees(paise)).toBe(expected);
  });
});

describe('parseRupees', () => {
  it.each([
    ['5000', 500000],
    ['₹5,000', 500000],
    ['1234.5', 123450],
    ['1,234.50', 123450],
    [' 0.99 ', 99],
  ])('%s → %i paise', (text, expected) => {
    expect(parseRupees(text)).toBe(expected);
  });
  it.each([['', null], ['abc', null], ['-5', null], ['0', null], ['1.234', null], ['1e5', null]])('rejects %s', (text, expected) => {
    expect(parseRupees(text)).toBe(expected);
  });
});
