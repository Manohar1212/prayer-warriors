import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { categoryLabel, usePrayerRequests } from '@/features/prayer';
import { prayerService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Badge, Button, Card, Input, Screen, Text } from '@/ui';

function longDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PrayerRequestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const active = usePrayerRequests('active');
  const answered = usePrayerRequests('answered');
  const request = [...active.requests, ...answered.requests].find((r) => r.id === id) ?? null;
  const [names, setNames] = useState<string[]>([]);
  const [testimony, setTestimony] = useState('');
  const [answering, setAnswering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    prayerService.prayingMembers(id).then(setNames).catch(() => setNames([]));
  }, [id, request?.prayingCount]);

  if (!request) {
    return (
      <Screen backdrop className="justify-center">
        <Text variant="muted">{active.loading || answered.loading ? 'Loading…' : "That prayer request isn't available."}</Text>
      </Screen>
    );
  }

  const isAnswered = request.status === 'answered';
  const canAnswer = !isAnswered && (request.authorId === user?.id || isAdmin);

  async function submitAnswered() {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      await active.markAnswered(request.id, testimony);
      await answered.refresh();
      setAnswering(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll backdrop className="gap-6 pt-6">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          <Badge label={categoryLabel(request.category)} tone="sage" />
          {request.urgency === 'urgent' && !isAnswered ? <Badge label="Urgent" tone="blush" /> : null}
          {isAnswered ? <Badge label="Answered" tone="honey" /> : null}
        </View>
        <Text variant="display" color="primary" className="text-[30px] leading-[36px]">
          {request.title}
        </Text>
        <Text variant="muted">
          {request.authorName} · {longDate(request.createdAt)}
        </Text>
      </View>

      {request.description ? <Text className="text-[16px] leading-[26px]">{request.description}</Text> : null}

      {isAnswered ? (
        <Card className="gap-2 bg-honey">
          <Text variant="label" color="gold">
            Answered {request.answeredAt ? longDate(request.answeredAt) : ''}
          </Text>
          {request.testimony ? <Text variant="scripture">{request.testimony}</Text> : null}
        </Card>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => active.togglePraying(request.id)}
          className={`flex-row items-center justify-center gap-2 rounded-[14px] py-3.5 ${
            request.praying ? 'bg-primary' : 'bg-blush'
          }`}
        >
          <Ionicons
            name={request.praying ? 'heart' : 'heart-outline'}
            size={18}
            color={request.praying ? colors.cream : colors.roseDeep}
          />
          <Text variant="label" color={request.praying ? 'cream' : 'roseDeep'} className="text-[16px]">
            {request.praying ? "You're praying" : "I'm praying"}
          </Text>
        </Pressable>
      )}

      <View className="gap-2">
        <Text variant="title">
          {request.prayingCount === 0
            ? 'No one praying yet'
            : request.prayingCount === 1
              ? '1 member is praying'
              : `${request.prayingCount} members are praying`}
        </Text>
        {names.length ? <Text variant="muted">{names.join(', ')}</Text> : null}
      </View>

      {canAnswer ? (
        answering ? (
          <Card className="gap-4">
            <Text variant="title">Mark as answered</Text>
            <Input
              label="Testimony (optional)"
              value={testimony}
              onChangeText={setTestimony}
              maxLength={1000}
              multiline
              style={{ minHeight: 96, textAlignVertical: 'top' }}
            />
            {error ? (
              <Text variant="muted" color="rose">
                {error}
              </Text>
            ) : null}
            <Button title="Mark as answered" onPress={submitAnswered} loading={busy} />
            <Button title="Cancel" variant="ghost" onPress={() => setAnswering(false)} />
          </Card>
        ) : (
          <Button title="Mark as answered" variant="secondary" onPress={() => setAnswering(true)} />
        )
      ) : null}

      <Button title="Back" variant="ghost" onPress={() => router.back()} className="self-start px-0" />
    </Screen>
  );
}
