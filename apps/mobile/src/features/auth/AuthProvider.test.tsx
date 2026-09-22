import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from './AuthProvider';
import type { AuthService, AuthUser } from './types';

const ana: AuthUser = { id: 'u1', email: 'a@b.c', displayName: 'Ana', phone: null, mustSetPassword: false };

function fakeService(current: AuthUser | null): AuthService {
  return {
    getCurrentUser: jest.fn(async () => current),
    signIn: jest.fn(async () => ana),
    signOut: jest.fn(async () => undefined),
    requestPasswordReset: jest.fn(async () => undefined),
    updateProfile: jest.fn(async (patch) => ({
      ...ana,
      ...patch,
      displayName: patch.displayName ?? ana.displayName,
    })),
    setPassword: jest.fn(async () => ({ ...ana, mustSetPassword: false })),
  };
}

function wrapperFor(service: AuthService) {
  return ({ children }: PropsWithChildren) => (
    <AuthProvider service={service}>{children}</AuthProvider>
  );
}

describe('AuthProvider', () => {
  it('restores the session on mount', async () => {
    const service = fakeService(ana);
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user).toEqual(ana);
  });

  it('is signedOut when there is no session', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(fakeService(null)) });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it('signs in and out', async () => {
    const service = fakeService(null);
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(() => result.current.signIn('a@b.c', 'pw'));
    expect(result.current.status).toBe('signedIn');
    await act(() => result.current.signOut());
    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
  });

  it('still signs out when the server call fails (offline or expired session)', async () => {
    const service = fakeService(ana);
    (service.signOut as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('x'), { code: 209 }));
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    await act(() => result.current.signOut());
    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
  });

  it('returns to sign-in when any screen hears the session has expired', async () => {
    const { reportIfSessionExpired } = jest.requireActual('../../lib/session') as typeof import('../../lib/session');
    const service = fakeService(ana);
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    await act(async () => reportIfSessionExpired(Object.assign(new Error('x'), { code: 209 })));
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it('updates the user after a profile change', async () => {
    const service = fakeService({ ...ana, displayName: null });
    const { result } = await renderHook(() => useAuth(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    await act(() => result.current.updateProfile({ displayName: 'Ana' }));
    expect(result.current.user?.displayName).toBe('Ana');
  });

  it('throws when used outside the provider', async () => {
    await expect(renderHook(() => useAuth())).rejects.toThrow(
      'useAuth must be used inside <AuthProvider>',
    );
  });
});
