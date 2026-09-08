import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { journalService } from '../../lib/parse';
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
  const [active, setActive] = useState<JournalEntry[]>([]);
  const [answered, setAnswered] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await journalService.list();
      setActive(result.active);
      setAnswered(result.answered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your journal.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = useCallback(
    async (input: JournalInput) => {
      const saved = await journalService.save(input);
      await load();
      return saved;
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await journalService.remove(id);
      await load();
    },
    [load],
  );

  return { active, answered, loading, error, refresh: load, save, remove };
}
