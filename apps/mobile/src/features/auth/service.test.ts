import { createParseAuthService } from './service';
import type { ParseLike, ParseUserLike } from './types';

type Fields = { email: string; displayName?: string; phone?: string; mustSetPassword?: boolean; password?: string };

function fakeUser(id: string, fields: Fields): ParseUserLike & { fields: Fields; saved: number } {
  const user = {
    id,
    fields,
    saved: 0,
    getEmail: () => fields.email,
    get: (key: string) => (fields as Record<string, unknown>)[key],
    set: (key: string, value: unknown) => {
      (fields as Record<string, unknown>)[key] = value;
    },
    save: async () => {
      user.saved += 1;
      return user;
    },
  };
  return user;
}

function fakeParse(current: ParseUserLike | null) {
  const User = {
    currentAsync: jest.fn(async () => current),
    logIn: jest.fn(async () => current as ParseUserLike),
    logOut: jest.fn(async () => undefined),
    requestPasswordReset: jest.fn(async () => undefined),
  };
  return { parse: { User } as ParseLike, User };
}

describe('createParseAuthService', () => {
  it('returns null when nobody is signed in', async () => {
    const { parse } = fakeParse(null);
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toBeNull();
  });

  it('maps the current Parse user to AuthUser', async () => {
    const { parse } = fakeParse(fakeUser('u1', { email: 'a@b.c', displayName: 'Ana' }));
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toEqual({
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ana',
      phone: null,
      mustSetPassword: false,
    });
  });

  it('re-reads the account from the server so a newly set flag is seen', async () => {
    const user = fakeUser('u1', { email: 'a@b.c', displayName: 'Ana' });
    const fetch = jest.fn(async () => {
      user.fields.mustSetPassword = true;
    });
    const { parse } = fakeParse(Object.assign(user, { fetch }));
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toMatchObject({ mustSetPassword: true });
  });

  it('keeps the stored account when the server cannot be reached', async () => {
    const user = Object.assign(fakeUser('u1', { email: 'a@b.c', displayName: 'Ana' }), { fetch: jest.fn(async () => Promise.reject(new Error('offline'))) });
    const { parse } = fakeParse(user);
    await expect(createParseAuthService(parse).getCurrentUser()).resolves.toMatchObject({ id: 'u1', displayName: 'Ana' });
  });

  it('sets the password, clears the flag, and signs in again with the new password', async () => {
    const user = fakeUser('u1', { email: 'a@b.c', displayName: 'Ana', mustSetPassword: true });
    const { parse, User } = fakeParse(user);
    const result = await createParseAuthService(parse).setPassword('new-secret');
    expect(user.fields.password).toBe('new-secret');
    expect(user.fields.mustSetPassword).toBe(false);
    expect(user.saved).toBe(1);
    expect(User.logIn).toHaveBeenCalledWith('a@b.c', 'new-secret');
    expect(result.mustSetPassword).toBe(false);
  });

  it('signs in with a trimmed, lower-cased email', async () => {
    const { parse, User } = fakeParse(fakeUser('u1', { email: 'a@b.c' }));
    const user = await createParseAuthService(parse).signIn('  A@B.C ', 'pw');
    expect(User.logIn).toHaveBeenCalledWith('a@b.c', 'pw');
    expect(user.displayName).toBeNull();
  });

  it('translates Parse errors on sign-in', async () => {
    const { parse, User } = fakeParse(null);
    User.logIn.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 101 }));
    await expect(createParseAuthService(parse).signIn('a@b.c', 'bad')).rejects.toThrow(
      'Incorrect email or password.',
    );
  });

  it('signs out', async () => {
    const { parse, User } = fakeParse(null);
    await createParseAuthService(parse).signOut();
    expect(User.logOut).toHaveBeenCalled();
  });

  it('requests a password reset', async () => {
    const { parse, User } = fakeParse(null);
    await createParseAuthService(parse).requestPasswordReset(' A@B.C ');
    expect(User.requestPasswordReset).toHaveBeenCalledWith('a@b.c');
  });

  it('updates and saves the profile', async () => {
    const current = fakeUser('u1', { email: 'a@b.c' });
    const { parse } = fakeParse(current);
    const updated = await createParseAuthService(parse).updateProfile({ displayName: '  Ana ' });
    expect(current.saved).toBe(1);
    expect(updated.displayName).toBe('Ana');
  });

  it('refuses to update the profile when signed out', async () => {
    const { parse } = fakeParse(null);
    await expect(
      createParseAuthService(parse).updateProfile({ displayName: 'Ana' }),
    ).rejects.toThrow('Your session has expired. Please sign in again.');
  });
});
