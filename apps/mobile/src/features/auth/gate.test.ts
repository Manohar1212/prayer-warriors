import { resolveGate } from './gate';

const user = { id: 'u1', email: 'a@b.c', displayName: 'Ana', phone: null };

describe('resolveGate', () => {
  it('is loading while the session is being restored', () => {
    expect(resolveGate('loading', null)).toBe('loading');
  });
  it('sends signed-out users to auth', () => {
    expect(resolveGate('signedOut', null)).toBe('auth');
  });
  it('sends signed-in users without a display name to setup', () => {
    expect(resolveGate('signedIn', { ...user, displayName: null })).toBe('setup');
  });
  it('sends complete users into the app', () => {
    expect(resolveGate('signedIn', user)).toBe('app');
  });
});
