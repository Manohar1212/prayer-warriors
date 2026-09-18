import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { mapParseError } from '../auth/errors';

/** The month's all-night prayer as the server describes it. */
export type PrayerNight = {
  id: string;
  month: string;
  scheduledAt: string;
  note: string;
  /** The group call scheduled for the same time; null when calls are not set up. */
  callId: string | null;
  /** Whole days until the night, by Indian calendar day; 0 means tonight. */
  daysUntil: number;
  /** True in the last week, when everyone is reminded daily. */
  reminding: boolean;
};

export type ScheduledPrayerNight = PrayerNight & { shortNotice: boolean };

type Deps = { cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> } };

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createPrayerNightService({ cloud }: Deps) {
  return {
    get: () => guarded(() => cloud.run('getPrayerNight')) as Promise<PrayerNight | null>,
    schedule: (scheduledAt: Date, note: string) => guarded(() => cloud.run('schedulePrayerNight', { scheduledAt: scheduledAt.toISOString(), note })) as Promise<ScheduledPrayerNight>,
    cancel: (nightId: string) => guarded(() => cloud.run('cancelPrayerNight', { nightId })) as Promise<{ cancelled: boolean }>,
  };
}

export type PrayerNightService = ReturnType<typeof createPrayerNightService>;

/** Loads the upcoming all-night prayer and keeps it fresh whenever the screen is focused. */
export function usePrayerNight(service: PrayerNightService, onLoaded?: (night: PrayerNight | null) => void) {
  const [night, setNight] = useState<PrayerNight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await service.get();
      setNight(next);
      setError(null);
      onLoaded?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the prayer night.');
    } finally {
      setLoading(false);
    }
  }, [service, onLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { night, loading, error, refresh: load };
}
