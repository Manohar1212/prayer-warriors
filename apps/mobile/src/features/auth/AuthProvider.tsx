import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthStatus } from './gate';
import type { AuthService, AuthUser, ProfilePatch } from './types';
import { onSessionExpired } from '../../lib/session';
import { clearQueryCache } from '../../lib/useCachedQuery';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<void>;
  setPassword(password: string): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ service, children }: PropsWithChildren<{ service: AuthService }>) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    service
      .getCurrentUser()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus(current ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (!cancelled) setStatus('signedOut');
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const signedIn = await service.signIn(email, password);
      setUser(signedIn);
      setStatus('signedIn');
    },
    [service],
  );

  // Always completes: offline or with an expired session the server call fails, but the phone
  // has already forgotten the session, so the member must land on sign-in either way.
  const signOut = useCallback(async () => {
    try {
      await service.signOut();
    } catch {
      // Nothing to undo; the local session is gone.
    } finally {
      clearQueryCache();
      setUser(null);
      setStatus('signedOut');
    }
  }, [service]);

  useEffect(() => onSessionExpired(() => void signOut()), [signOut]);

  const requestPasswordReset = useCallback(
    (email: string) => service.requestPasswordReset(email),
    [service],
  );

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      setUser(await service.updateProfile(patch));
    },
    [service],
  );

  const setPassword = useCallback(
    async (password: string) => {
      setUser(await service.setPassword(password));
    },
    [service],
  );

  const value = useMemo(
    () => ({ status, user, signIn, signOut, requestPasswordReset, updateProfile, setPassword }),
    [status, user, signIn, signOut, requestPasswordReset, updateProfile, setPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
