import { mapParseError } from '../auth/errors';
import type { CallCredentials, CallStatus, CallsService, GroupCall, RawCall, RawParticipant } from './types';

type Deps = {
  fetchCalls: () => Promise<RawCall[]>;
  fetchParticipants: (callId?: string) => Promise<RawParticipant[]>;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
  now?: () => Date;
};

// Matches the server: a call nobody ended is over 12 hours after its scheduled start.
const CALL_OPEN_MS = 12 * 60 * 60 * 1000;

function toCall(row: RawCall, participantCount: number, now: Date): GroupCall {
  let status: CallStatus = row.status === 'live' || row.status === 'ended' || row.status === 'cancelled' ? row.status : 'scheduled';
  const stale = now.getTime() >= new Date(row.scheduledAt).getTime() + CALL_OPEN_MS;
  if (stale && (status === 'live' || status === 'scheduled')) status = 'ended';
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt,
    status,
    startedAt: row.startedAt ?? null,
    endedAt: row.endedAt ?? null,
    createdById: row.createdBy?.id ?? null,
    participantCount,
  };
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createCallsService({ fetchCalls, fetchParticipants, cloud, now = () => new Date() }: Deps): CallsService {
  return {
    list: () =>
      guarded(async () => {
        const [rows, parts] = await Promise.all([fetchCalls(), fetchParticipants()]);
        const counts = new Map<string, number>();
        parts.forEach((p) => counts.set(p.callId, (counts.get(p.callId) ?? 0) + 1));
        const current = now();
        const calls = rows.map((r) => toCall(r, counts.get(r.id) ?? 0, current));
        const upcoming = calls
          .filter((c) => c.status === 'scheduled' || c.status === 'live')
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
        const past = calls
          .filter((c) => c.status === 'ended' || c.status === 'cancelled')
          .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
        return { upcoming, past };
      }),

    participants: (callId) =>
      guarded(async () => {
        const parts = await fetchParticipants(callId);
        return parts.filter((p) => !p.leftAt).map((p) => p.user?.displayName?.trim() || 'Member');
      }),

    schedule: (title, scheduledAt) =>
      guarded(async () => {
        const dto = (await cloud.run('scheduleCall', { title, scheduledAt: scheduledAt.toISOString() })) as RawCall & { createdById: string | null };
        return toCall({ ...dto, createdBy: dto.createdById ? { id: dto.createdById } : null }, 0, now());
      }),

    cancel: (callId) =>
      guarded(async () => {
        await cloud.run('cancelCall', { callId });
      }),

    end: (callId) =>
      guarded(async () => {
        await cloud.run('endCall', { callId });
      }),

    join: (callId) => guarded(async () => (await cloud.run('joinCall', { callId })) as CallCredentials),

    leave: (callId) =>
      guarded(async () => {
        await cloud.run('leaveCall', { callId });
      }),
  };
}
