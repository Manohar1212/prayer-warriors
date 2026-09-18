import { callsService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
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
  const { data, loading, error, refresh } = useCachedQuery('calls', () => callsService.list(), { fallback: 'Could not load calls.', onLoaded: (result) => syncCallReminders(result.upcoming) });
  const upcoming: GroupCall[] = data?.upcoming ?? [];
  return { upcoming, past: data?.past ?? [], next: upcoming[0] ?? null, loading, error, refresh };
}
