import { useCallback, useState } from 'react';

import { useCachedQuery } from '../../lib/useCachedQuery';
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

/**
 * "గర్భిణీల కొరకు ప్రార్థన — బిందు, నేహా" → the point and the people it is for, so each name can
 * sit on its own line. The point is stored as one line, which keeps it easy to edit.
 */
export function splitPointTitle(title: string): { heading: string; names: string[] } {
  const at = title.indexOf(' — ');
  if (at < 0) return { heading: title, names: [] };
  const names = title
    .slice(at + 3)
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  return { heading: title.slice(0, at).trim(), names };
}

/** The reverse of splitPointTitle: the point, then its names after " — ", comma-separated. */
export function joinPointTitle(heading: string, names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  return clean.length ? `${heading.trim()} — ${clean.join(', ')}` : heading.trim();
}

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
    /** Admin: every active point's id, top first. */
    reorder: (ids: string[]) => guarded(() => cloud.run('reorderPrayerPoints', { ids })),
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
  reorder: (ids: string[]) => Promise<void>;
};

export function usePrayerPoints(service: PrayerPointsService): PrayerPointsState {
  const [actionError, setActionError] = useState<string | null>(null);
  // A fresh load clears an old refusal; an action sets its own message after its reload.
  const { data, loading, error, refresh } = useCachedQuery('prayer:points', () => service.list(), { fallback: 'Could not load prayer points.', onLoaded: () => setActionError(null) });

  // Run the change, reload, and only then surface a refusal so it is not wiped by the reload.
  const act = useCallback(
    async (work: () => Promise<unknown>) => {
      let message: string | null = null;
      try {
        await work();
      } catch (err) {
        message = err instanceof Error ? err.message : 'Could not update.';
      }
      await refresh();
      setActionError(message);
    },
    [refresh],
  );

  return {
    month: data?.month ?? '',
    points: data?.points ?? [],
    loading,
    error: actionError ?? error,
    refresh,
    claim: (id) => act(() => service.claim(id)),
    release: (id) => act(() => service.release(id)),
    markDone: (id) => act(() => service.markDone(id)),
    reorder: (ids) => act(() => service.reorder(ids)),
  };
}
