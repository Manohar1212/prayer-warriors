import { formatDuration } from './format';

describe('formatDuration', () => {
  it('shows minutes and seconds, rounding to whole seconds', () => {
    expect(formatDuration(42_000)).toBe('0:42');
    expect(formatDuration(42_600)).toBe('0:43');
    expect(formatDuration(125_000)).toBe('2:05');
  });

  it('adds hours past sixty minutes', () => {
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('is a dash when there is no time', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
  });
});
