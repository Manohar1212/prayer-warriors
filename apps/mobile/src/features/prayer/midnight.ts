import { useCachedQuery } from '../../lib/useCachedQuery';
import { mapParseError } from '../auth/errors';

/** One night of the midnight prayer: the 12:00 AM at the end of `day` (Indian calendar day). */
export type MidnightNight = { day: string; userId: string; name: string; prayed: boolean };

export type MidnightMonth = {
  month: string;
  nights: MidnightNight[];
  rotation: { userId: string; name: string }[];
  /** The next month's key once it can be opened (from the 20th), else null. */
  nextMonth: string | null;
};

export type MidnightTonight = {
  /** Today's Indian calendar day and hour, from the server's clock. */
  today: string;
  hour: number;
  tonight: MidnightNight | null;
  yesterday: MidnightNight | null;
  myNext: string | null;
  inRotation: boolean;
};

export type MidnightCard =
  | { kind: 'hidden' }
  | { kind: 'other'; name: string; myNext: string | null }
  | { kind: 'yours' }
  | { kind: 'confirm'; day: string }
  | { kind: 'prayed'; day: string };

type Deps = { cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> } };

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createMidnightService({ cloud }: Deps) {
  return {
    tonight: () => guarded(() => cloud.run('getMidnightTonight')) as Promise<MidnightTonight>,
    month: (month: string) => guarded(() => cloud.run('getMidnightMonth', { month })) as Promise<MidnightMonth>,
    markPrayed: (day: string) => guarded(() => cloud.run('markMidnightPrayed', { day })) as Promise<{ day: string; prayed: true }>,
    reassign: (day: string, userId: string) => guarded(() => cloud.run('reassignMidnightNight', { day, userId })) as Promise<MidnightNight>,
    setRotation: (userIds: string[]) => guarded(() => cloud.run('setMidnightRotation', { userIds })) as Promise<{ rotation: MidnightMonth['rotation'] }>,
  };
}

export type MidnightService = ReturnType<typeof createMidnightService>;

const PRAYED_FROM_HOUR = 23;

/** What the Home card shows for this member right now. */
export function midnightCard(state: MidnightTonight, me: string): MidnightCard {
  const { tonight, yesterday, hour } = state;
  if (yesterday && yesterday.userId === me && (!tonight || tonight.userId !== me || hour < PRAYED_FROM_HOUR)) {
    return yesterday.prayed ? { kind: 'prayed', day: yesterday.day } : { kind: 'confirm', day: yesterday.day };
  }
  if (!tonight) return { kind: 'hidden' };
  if (tonight.userId === me) {
    if (hour < PRAYED_FROM_HOUR) return { kind: 'yours' };
    return tonight.prayed ? { kind: 'prayed', day: tonight.day } : { kind: 'confirm', day: tonight.day };
  }
  return { kind: 'other', name: tonight.name, myNext: state.myNext };
}

/** "Sat, 10 Oct" for a day key. Day keys are Indian calendar days, so it is read and formatted in India time whatever the device's time zone. */
export function dayLabel(day: string, locale: string): string {
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

/**
 * The rotation to send: a saved rotation can still hold someone who has since left the group,
 * and the server refuses the whole list if any id is not an active member.
 */
export function rotationToSave(selected: string[], members: { userId: string; status: string }[]): string[] {
  return selected.filter((id) => members.some((m) => m.userId === id && m.status === 'active'));
}

export function useMidnightTonight(service: MidnightService) {
  return useCachedQuery<MidnightTonight>('prayer:midnightTonight', () => service.tonight(), { fallback: 'Could not load the midnight prayer.' });
}

export function useMidnightMonth(service: MidnightService, month: string) {
  return useCachedQuery<MidnightMonth>(`prayer:midnightMonth:${month}`, () => service.month(month), { fallback: 'Could not load the midnight prayer.' });
}
