import { createParseAuthService } from './service';
import type { ParseLike, ParseUserLike } from './types';

type Fields = { email: string; displayName?: string; phone?: string };

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
    });
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
