import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { mapParseError } from '../auth/errors';

/** One of the regular things the group prays for every month, with this month's claim if any. */
export type PrayerPoint = {
  id: string;
  title: string;
  order: number;
  claim: { userId: string; userName: string; doneAt: string | null } | null;
  /** True when the claim belongs to the signed-in member. */
  mine: boolean;
  /** Set when an admin promoted a one-off request to the monthly list. */
  requestId: string | null;
};

export type PrayerPointsResult = { month: string; points: PrayerPoint[] };

/** A point the group has seen answered; it no longer returns each month. */
export type AnsweredPrayerPoint = { id: string; title: string; answeredAt: string; testimony: string };

type RawList = { month: string; points: { id: string; title: string; order: number; requestId?: string | null; claim: { userId: string; userName: string; doneAt: string | null } | null }[] };

type Deps = {
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
  currentUserId: () => string | null;
};

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createPrayerPointsService({ cloud, currentUserId }: Deps) {
  return {
    async list(): Promise<PrayerPointsResult> {
      const raw = (await guarded(() => cloud.run('listPrayerPoints'))) as RawList;
      const me = currentUserId();
      return {
        month: raw.month,
        points: raw.points.map((p) => ({ ...p, requestId: p.requestId ?? null, mine: Boolean(p.claim && me && p.claim.userId === me) })),
      };
    },
    add: (title: string) => guarded(() => cloud.run('addPrayerPoint', { title })),
    addRequest: (requestId: string) => guarded(() => cloud.run('addRequestToMonthly', { requestId })),
    update: (pointId: string, title: string) => guarded(() => cloud.run('updatePrayerPoint', { pointId, title })),
    remove: (pointId: string) => guarded(() => cloud.run('removePrayerPoint', { pointId })),
    claim: (pointId: string) => guarded(() => cloud.run('claimPrayerPoint', { pointId })),
    release: (pointId: string) => guarded(() => cloud.run('releasePrayerPoint', { pointId })),
    markDone: (pointId: string) => guarded(() => cloud.run('markPrayerPointDone', { pointId })),
    markAnswered: (pointId: string, testimony: string) => guarded(() => cloud.run('markPrayerPointAnswered', { pointId, testimony })),
    listAnswered: () => guarded(() => cloud.run('listAnsweredPrayerPoints')) as Promise<AnsweredPrayerPoint[]>,
  };
}

export type PrayerPointsService = ReturnType<typeof createPrayerPointsService>;

export type PrayerPointsState = {
  month: string;
  points: PrayerPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  claim: (id: string) => Promise<void>;
  release: (id: string) => Promise<void>;
  markDone: (id: string) => Promise<void>;
};

export function usePrayerPoints(service: PrayerPointsService): PrayerPointsState {
  const [month, setMonth] = useState('');
  const [points, setPoints] = useState<PrayerPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await service.list();
      setMonth(result.month);
      setPoints(result.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load prayer points.');
    }
  }, [service]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = useCallback(
    async (work: () => Promise<unknown>) => {
      let message: string | null = null;
      try {
        await work();
      } catch (err) {
        message = err instanceof Error ? err.message : 'Could not update.';
      }
      // Refresh first (it clears the error), then surface the refusal so it stays visible.
      await load();
      if (message) setError(message);
    },
    [load],
  );

  return {
    month,
    points,
    loading,
    error,
    refresh: load,
    claim: (id) => act(() => service.claim(id)),
    release: (id) => act(() => service.release(id)),
    markDone: (id) => act(() => service.markDone(id)),
  };
}
