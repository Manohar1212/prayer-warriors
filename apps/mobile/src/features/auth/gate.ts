import type { AuthUser } from './types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type Gate = 'loading' | 'auth' | 'setup' | 'app';

export function resolveGate(status: AuthStatus, user: AuthUser | null): Gate {
  if (status === 'loading') return 'loading';
  if (status === 'signedOut' || !user) return 'auth';
  return user.displayName ? 'app' : 'setup';
}
