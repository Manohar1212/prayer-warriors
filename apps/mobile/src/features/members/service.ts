import { mapParseError } from '../auth/errors';
import type { AddedMember, Member, MembersService, NewMember, RawMembership } from './types';

type Deps = {
  fetchMemberships: () => Promise<RawMembership[]>;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
};

function toMember(row: RawMembership): Member | null {
  if (!row.user) return null;
  const name = row.user.displayName?.trim();
  return {
    id: row.id,
    userId: row.user.id,
    displayName: name || 'Member',
    role: row.role === 'admin' ? 'admin' : 'member',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    phone: null,
  };
}

function toPhones(result: unknown): { userId: string; phone: string }[] {
  const phones = (result as { phones?: unknown } | null)?.phones;
  if (!Array.isArray(phones)) return [];
  return phones.filter((p): p is { userId: string; phone: string } => typeof p?.userId === 'string' && typeof p?.phone === 'string');
}

function byRoleThenName(a: Member, b: Member): number {
  if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
  return a.displayName.localeCompare(b.displayName);
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createMembersService({ fetchMemberships, cloud }: Deps): MembersService {
  return {
    list: () =>
      guarded(async () => {
        // Numbers are a protected field, so they come from memberPhones; the list still shows without them.
        const [rows, phones] = await Promise.all([fetchMemberships(), Promise.resolve().then(() => cloud.run('memberPhones')).catch(() => null)]);
        const phoneOf = new Map(toPhones(phones).map((p) => [p.userId, p.phone]));
        return rows
          .map(toMember)
          .filter((m): m is Member => m !== null && m.status === 'active')
          .map((m) => ({ ...m, phone: phoneOf.get(m.userId) ?? null }))
          .sort(byRoleThenName);
      }),

    add: (input: NewMember) =>
      guarded(async () => {
        const result = (await cloud.run('addMember', {
          displayName: input.displayName,
          email: input.email,
          phone: input.phone,
        })) as AddedMember;
        return result;
      }),

    remove: (userId: string) =>
      guarded(async () => {
        await cloud.run('removeMember', { userId });
      }),
  };
}
