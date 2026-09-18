import { useCallback } from 'react';

import { prayerService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import type { NewPrayerRequest, PrayerRequest, PrayerStatus } from './types';

export type PrayerRequestsState = {
  requests: PrayerRequest[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: NewPrayerRequest) => Promise<PrayerRequest>;
  togglePraying: (id: string) => Promise<void>;
  markAnswered: (id: string, testimony: string) => Promise<PrayerRequest>;
};

function flip(r: PrayerRequest): PrayerRequest {
  return { ...r, praying: !r.praying, prayingCount: r.prayingCount + (r.praying ? -1 : 1) };
}

export function usePrayerRequests(status: PrayerStatus): PrayerRequestsState {
  const { data, loading, error, refresh, setData } = useCachedQuery(`prayer:${status}`, () => prayerService.list(status), { fallback: 'Could not load prayer requests.' });

  const create = useCallback(
    async (input: NewPrayerRequest) => {
      const created = await prayerService.create(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const togglePraying = useCallback(
    async (id: string) => {
      // Optimistic flip; the server's answer wins.
      setData((prev) => (prev ?? []).map((r) => (r.id === id ? flip(r) : r)));
      try {
        const result = await prayerService.togglePraying(id);
        setData((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, ...result } : r)));
      } catch {
        setData((prev) => (prev ?? []).map((r) => (r.id === id ? flip(r) : r)));
      }
    },
    [setData],
  );

  const markAnswered = useCallback(
    async (id: string, testimony: string) => {
      const updated = await prayerService.markAnswered(id, testimony);
      await refresh();
      return updated;
    },
    [refresh],
  );

  return { requests: data ?? [], loading, error, refresh, create, togglePraying, markAnswered };
}
