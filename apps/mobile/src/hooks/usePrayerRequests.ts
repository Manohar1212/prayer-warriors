import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createPrayerRequest,
  incrementPrayerCount,
  listPrayerRequests,
  type NewPrayerRequest,
  type PrayerRequest,
} from '../api/prayerRequests';
import { loadParseConfig } from '../config';

export type PrayerRequestsState = {
  requests: PrayerRequest[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (input: NewPrayerRequest) => Promise<void>;
  pray: (id: string) => Promise<void>;
};

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function usePrayerRequests(): PrayerRequestsState {
  const config = useMemo(loadParseConfig, []);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRequests(await listPrayerRequests(config));
    } catch (err) {
      setError(messageOf(err));
    }
  }, [config]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const add = useCallback(
    async (input: NewPrayerRequest) => {
      const created = await createPrayerRequest(config, input);
      setRequests((prev) => [created, ...prev]);
    },
    [config],
  );

  const pray = useCallback(
    async (id: string) => {
      // Optimistic update; server value wins once it responds.
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, prayerCount: r.prayerCount + 1 } : r)),
      );
      try {
        const prayerCount = await incrementPrayerCount(config, id);
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, prayerCount } : r)));
      } catch (err) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, prayerCount: r.prayerCount - 1 } : r)),
        );
        setError(messageOf(err));
      }
    },
    [config],
  );

  return { requests, loading, refreshing, error, refresh, add, pray };
}
