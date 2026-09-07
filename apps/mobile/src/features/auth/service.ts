import { mapParseError } from './errors';
import type { AuthService, AuthUser, ParseLike, ParseUserLike, ProfilePatch } from './types';

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toAuthUser(user: ParseUserLike): AuthUser {
  return {
    id: user.id ?? '',
    email: user.getEmail() ?? '',
    displayName: optionalString(user.get('displayName')),
    phone: optionalString(user.get('phone')),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createParseAuthService(parse: ParseLike): AuthService {
  return {
    getCurrentUser: () =>
      guarded(async () => {
        const user = await parse.User.currentAsync();
        return user ? toAuthUser(user) : null;
      }),

    signIn: (email, password) =>
      guarded(async () => toAuthUser(await parse.User.logIn(normalizeEmail(email), password))),

    signOut: () =>
      guarded(async () => {
        await parse.User.logOut();
      }),

    requestPasswordReset: (email) =>
      guarded(async () => {
        await parse.User.requestPasswordReset(normalizeEmail(email));
      }),

    updateProfile: (patch: ProfilePatch) =>
      guarded(async () => {
        const user = await parse.User.currentAsync();
        if (!user) throw Object.assign(new Error('signed out'), { code: 209 });
        if (patch.displayName !== undefined) user.set('displayName', patch.displayName.trim());
        if (patch.phone !== undefined) user.set('phone', patch.phone.trim());
        await user.save();
        return toAuthUser(user);
      }),
  };
}
