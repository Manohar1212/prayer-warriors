/**
 * One place that hears "your session has expired" (Parse error 209) from anywhere in the app, so
 * the member is sent back to sign-in instead of seeing a red error on every screen.
 */
let handler: (() => void) | null = null;

export function onSessionExpired(fn: () => void): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export function isSessionExpired(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === 209;
}

export function reportIfSessionExpired(err: unknown): void {
  if (isSessionExpired(err)) handler?.();
}
