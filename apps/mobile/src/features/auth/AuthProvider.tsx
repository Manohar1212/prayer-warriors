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
import { clearQueryCache } from '../../lib/useCachedQuery';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<void>;
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

  const signOut = useCallback(async () => {
    await service.signOut();
    clearQueryCache();
    setUser(null);
    setStatus('signedOut');
  }, [service]);

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

  const value = useMemo(
    () => ({ status, user, signIn, signOut, requestPasswordReset, updateProfile }),
    [status, user, signIn, signOut, requestPasswordReset, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
