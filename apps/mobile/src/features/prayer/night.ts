import { useCachedQuery } from '../../lib/useCachedQuery';
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
  // The night is wrapped so "no night scheduled" is a cached answer too, not a missing one.
  const { data, loading, error, refresh } = useCachedQuery<{ night: PrayerNight | null }>('prayer:night', async () => ({ night: await service.get() }), {
    fallback: 'Could not load the prayer night.',
    onLoaded: (result) => onLoaded?.(result.night),
  });
  return { night: data?.night ?? null, loading, error, refresh };
}
