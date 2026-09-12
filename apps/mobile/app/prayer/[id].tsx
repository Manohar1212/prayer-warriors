import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { categoryLabel, usePrayerRequests } from '@/features/prayer';
import { prayerService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Input, Meta, Rule, Screen, Text, type MetaPart } from '@/ui';

function longDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PrayerRequestScreen() {
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
      <Screen edges={['bottom']} backdrop className="justify-center">
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
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="gap-3">
        <Meta
          parts={(() => {
            const parts: MetaPart[] = [{ text: categoryLabel(request.category), dot: isAnswered ? 'gold' : 'sage' }];
            if (request.urgency === 'urgent' && !isAnswered) parts.push({ text: 'Urgent', color: 'roseDeep' });
            if (isAnswered) parts.push({ text: 'Answered', color: 'gold' });
            return parts;
          })()}
        />
        <Text variant="display" color="primary" className="text-[28px] leading-[34px]">
          {request.title}
        </Text>
        <Text variant="caption">
          {request.authorName} · {longDate(request.createdAt)}
        </Text>
      </View>

      {request.description ? <Text className="text-[17px] leading-[27px]">{request.description}</Text> : null}

      {isAnswered ? (
        <View className="gap-3 border-l-2 border-gold pl-4">
          <Text variant="label" color="gold" className="text-[13px]">
            Answered {request.answeredAt ? longDate(request.answeredAt) : ''}
          </Text>
          {request.testimony ? <Text variant="scripture" className="text-[19px] leading-[29px]">{request.testimony}</Text> : null}
        </View>
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

      <View className="gap-2 border-t border-border pt-5">
        <Rule />
        <Text variant="title" className="text-[20px]">
          {request.prayingCount === 0
            ? 'No one praying yet'
            : request.prayingCount === 1
              ? '1 member is praying'
              : `${request.prayingCount} members are praying`}
        </Text>
        {names.length ? <Text variant="muted" className="text-[15px] leading-[22px]">{names.join(', ')}</Text> : null}
      </View>

      {canAnswer ? (
        answering ? (
          <View className="gap-4 border-t border-border pt-5">
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
          </View>
        ) : (
          <Button title="Mark as answered" variant="secondary" onPress={() => setAnswering(true)} />
        )
      ) : null}

    </Screen>
  );
}
