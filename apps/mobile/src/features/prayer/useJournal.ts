import { useCallback } from 'react';

import { journalService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import type { JournalEntry, JournalInput } from './types';

export type JournalState = {
  active: JournalEntry[];
  answered: JournalEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: JournalInput) => Promise<JournalEntry>;
  remove: (id: string) => Promise<void>;
};

export function useJournal(): JournalState {
  const { data, loading, error, refresh } = useCachedQuery('journal', () => journalService.list(), { fallback: 'Could not load your journal.' });

  const save = useCallback(
    async (input: JournalInput) => {
      const saved = await journalService.save(input);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await journalService.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { active: data?.active ?? [], answered: data?.answered ?? [], loading, error, refresh, save, remove };
}
