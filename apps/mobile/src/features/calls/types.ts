export type CallStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export type GroupCall = {
  id: string;
  title: string;
  scheduledAt: string;
  status: CallStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdById: string | null;
  participantCount: number;
};

export type CallCredentials = { url: string; token: string; roomName: string };

export type RawCall = {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdBy: { id: string } | null;
};

export type RawParticipant = { callId: string; user: { id: string; displayName?: string } | null; leftAt: string | null };

export type CallsService = {
  list(): Promise<{ upcoming: GroupCall[]; past: GroupCall[] }>;
  participants(callId: string): Promise<string[]>;
  schedule(title: string, scheduledAt: Date): Promise<GroupCall>;
  cancel(callId: string): Promise<void>;
  end(callId: string): Promise<void>;
  join(callId: string): Promise<CallCredentials>;
  leave(callId: string): Promise<void>;
};

/** A call is joinable from 15 minutes before its start until it ends. */
export function isJoinable(call: GroupCall, now: Date): boolean {
  if (call.status === 'live') return true;
  if (call.status !== 'scheduled') return false;
  return now.getTime() >= new Date(call.scheduledAt).getTime() - 15 * 60 * 1000;
}
