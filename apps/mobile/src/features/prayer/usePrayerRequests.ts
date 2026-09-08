import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { prayerService } from '../../lib/parse';
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

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function usePrayerRequests(status: PrayerStatus): PrayerRequestsState {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRequests(await prayerService.list(status));
    } catch (err) {
      setError(messageOf(err, 'Could not load prayer requests.'));
    }
  }, [status]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = useCallback(
    async (input: NewPrayerRequest) => {
      const created = await prayerService.create(input);
      await load();
      return created;
    },
    [load],
  );

  const togglePraying = useCallback(async (id: string) => {
    // Optimistic flip; the server's answer wins.
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, praying: !r.praying, prayingCount: r.prayingCount + (r.praying ? -1 : 1) }
          : r,
      ),
    );
    try {
      const result = await prayerService.togglePraying(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...result } : r)));
    } catch (err) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, praying: !r.praying, prayingCount: r.prayingCount + (r.praying ? -1 : 1) }
            : r,
        ),
      );
      setError(messageOf(err, 'Could not update.'));
    }
  }, []);

  const markAnswered = useCallback(
    async (id: string, testimony: string) => {
      const updated = await prayerService.markAnswered(id, testimony);
      await load();
      return updated;
    },
    [load],
  );

  return { requests, loading, error, refresh: load, create, togglePraying, markAnswered };
}
