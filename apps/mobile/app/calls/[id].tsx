import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { CallRoom } from '@/features/calls/CallRoom';
import { isJoinable, useCalls, type CallCredentials } from '@/features/calls';
import { useMembers } from '@/features/members';
import { goBackOr } from '@/lib/navigation';
import { callsService } from '@/lib/parse';
import { Button, Card, Screen, Text } from '@/ui';

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { upcoming, past, loading, refresh } = useCalls();
  const call = [...upcoming, ...past].find((c) => c.id === id) ?? null;
  const [names, setNames] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<CallCredentials | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    callsService.participants(id).then(setNames).catch(() => setNames([]));
  }, [id, credentials]);

  async function join() {
    if (!call) return;
    setBusy(true);
    setError(null);
    try {
      setCredentials(await callsService.join(call.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the call.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (call) await callsService.leave(call.id).catch(() => undefined);
    setCredentials(null);
    await refresh();
  }

  async function end() {
    if (!call) return;
    await callsService.end(call.id).catch((err) => setError(err instanceof Error ? err.message : 'Could not end the call.'));
    setCredentials(null);
    await refresh();
  }

  if (!call) {
    return (
      <Screen edges={['bottom']} backdrop className="justify-center gap-4">
        <Text variant="muted">{loading ? 'Loading…' : "That call isn't available."}</Text>
        <Button title="Back" variant="ghost" onPress={() => goBackOr(router, '/(tabs)/community')} className="self-start px-0" />
      </Screen>
    );
  }

  if (credentials) {
    return (
      <Screen edges={['bottom']} className="pt-4">
        <Text variant="title" className="mb-3">
          {call.title}
        </Text>
        <CallRoom credentials={credentials} displayName={user?.displayName ?? 'Member'} canEnd={isAdmin} onLeave={leave} onEnd={end} />
      </Screen>
    );
  }

  const joinable = isJoinable(call, new Date());
  const over = call.status === 'ended' || call.status === 'cancelled';

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="gap-1">
        <Text variant="display" color="primary" className="text-[30px] leading-[36px]">
          {call.title}
        </Text>
        <Text variant="muted">{when(call.scheduledAt)}</Text>
      </View>
      <Card className="gap-2">
        <Text variant="label">{call.status === 'live' ? 'Happening now' : over ? (call.status === 'cancelled' ? 'Cancelled' : 'Ended') : 'Scheduled'}</Text>
        <Text variant="muted">
          {names.length ? `On the call: ${names.join(', ')}` : call.status === 'live' ? 'No one has joined yet.' : over ? `${call.participantCount} joined.` : 'Nobody has joined yet.'}
        </Text>
      </Card>
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      {!over ? (
        <Button title={joinable ? 'Join call' : `Opens 15 minutes before ${when(call.scheduledAt)}`} onPress={join} loading={busy} disabled={!joinable} />
      ) : null}
      {isAdmin && !over ? (
        <Button title={call.status === 'live' ? 'End call for everyone' : 'Cancel this call'} variant="secondary" onPress={call.status === 'live' ? end : () => callsService.cancel(call.id).then(refresh).catch((err) => setError(err instanceof Error ? err.message : 'Could not cancel.'))} />
      ) : null}
      <Button title="Back" variant="ghost" onPress={() => goBackOr(router, '/(tabs)/community')} className="self-start px-0" />
    </Screen>
  );
}
