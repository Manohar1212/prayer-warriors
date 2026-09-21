import type { AuthUser } from './types';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type Gate = 'loading' | 'auth' | 'password' | 'setup' | 'app';

export function resolveGate(status: AuthStatus, user: AuthUser | null): Gate {
  if (status === 'loading') return 'loading';
  if (status === 'signedOut' || !user) return 'auth';
  // The admin's starting password came over WhatsApp; nothing opens until the member picks their own.
  if (user.mustSetPassword) return 'password';
  return user.displayName ? 'app' : 'setup';
}
