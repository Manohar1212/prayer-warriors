const messages: Record<number, string> = {
  100: 'Could not reach the server. Check your connection and try again.',
  101: 'Incorrect email or password.',
  200: 'Please enter your email.',
  201: 'Please enter your password.',
  205: 'No account uses that email.',
  209: 'Your session has expired. Please sign in again.',
};

export function mapParseError(err: unknown): Error {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'number' && messages[code]) return new Error(messages[code]);
    return err;
  }
  return new Error('Something went wrong. Please try again.');
}
