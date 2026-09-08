import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../auth';
import { membersService } from '../../lib/parse';
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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setMembers(await membersService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load members.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const add = useCallback(
    async (input: NewMember) => {
      const added = await membersService.add(input);
      await load();
      return added;
    },
    [load],
  );

  const isAdmin = members.some((m) => m.userId === user?.id && m.role === 'admin');

  return { members, loading, error, isAdmin, refresh: load, add };
}
