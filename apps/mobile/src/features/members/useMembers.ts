import { useCallback } from 'react';

import { useAuth } from '../auth';
import { membersService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import type { AddedMember, Member, NewMember } from './types';

export type MembersState = {
  members: Member[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  add: (input: NewMember) => Promise<AddedMember>;
};

export function useMembers(): MembersState {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useCachedQuery('members', () => membersService.list(), { fallback: 'Could not load members.' });
  const members: Member[] = data ?? [];

  const add = useCallback(
    async (input: NewMember) => {
      const added = await membersService.add(input);
      await refresh();
      return added;
    },
    [refresh],
  );

  const isAdmin = members.some((m) => m.userId === user?.id && m.role === 'admin');

  return { members, loading, error, isAdmin, refresh, add };
}
