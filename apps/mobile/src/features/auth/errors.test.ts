import { mapParseError } from './errors';

function parseError(code: number, message = 'raw') {
  return Object.assign(new Error(message), { code });
}

describe('mapParseError', () => {
  it.each([
    [101, 'Incorrect email or password.'],
    [205, 'No account uses that email.'],
    [100, 'Could not reach the server. Check your connection and try again.'],
    [209, 'Your session has expired. Please sign in again.'],
  ])('maps Parse code %i to a friendly message', (code, expected) => {
    expect(mapParseError(parseError(code)).message).toBe(expected);
  });

  it('keeps the original message for unknown codes', () => {
    expect(mapParseError(parseError(999, 'weird')).message).toBe('weird');
  });

  it('wraps non-Error values', () => {
    expect(mapParseError('boom').message).toBe('Something went wrong. Please try again.');
  });
});
