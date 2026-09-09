import type { PushRegistration } from './push';

// Push is native-only; the web preview relies on the in-app inbox.
export async function registerForPush(): Promise<PushRegistration | null> {
  return null;
}

export function usePushResponse(_onRoute: (route: string) => void): void {}
