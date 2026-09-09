import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { callsService } from '../../lib/parse';
import { syncCallReminders } from '../notifications/reminders';
import type { GroupCall } from './types';

export type CallsState = {
  upcoming: GroupCall[];
  past: GroupCall[];
  next: GroupCall | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useCalls(): CallsState {
  const [upcoming, setUpcoming] = useState<GroupCall[]>([]);
  const [past, setPast] = useState<GroupCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await callsService.list();
      setUpcoming(result.upcoming);
      setPast(result.past);
      syncCallReminders(result.upcoming);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load calls.');
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

  return { upcoming, past, next: upcoming[0] ?? null, loading, error, refresh: load };
}
