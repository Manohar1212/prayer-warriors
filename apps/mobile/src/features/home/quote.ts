const TELUGU = /[ఀ-౿]/;

/** Wraps a verse in curly quotes, first removing any quotes the translation already carries. */
export function quoted(text: string): string {
  const inner = text.trim().replace(/^[“”"'‘’\s]+/, '').replace(/[“”"'‘’\s]+$/, '');
  return `“${inner}”`;
}

/** Wide letter spacing suits Latin capitals but breaks Telugu conjuncts apart, so only use it for Latin text. */
export function headingSpacing(text: string): number {
  return TELUGU.test(text) ? 0 : 2.5;
}
