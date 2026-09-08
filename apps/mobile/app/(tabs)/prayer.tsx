import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { categoryLabel, usePrayerRequests, type PrayerRequest, type PrayerStatus } from '@/features/prayer';
import { colors } from '@/theme/tokens';
import { Badge, Button, Card, Screen, Segments, Text } from '@/ui';

function prayingLabel(n: number): string {
  if (n === 0) return 'No one praying yet';
  if (n === 1) return '1 member praying';
  return `${n} members praying`;
}

function RequestCard({ request, onPray, onOpen }: { request: PrayerRequest; onPray: () => void; onOpen: () => void }) {
  const answered = request.status === 'answered';
  return (
    <Card className="gap-3">
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${request.title}`} onPress={onOpen} className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          <Badge label={categoryLabel(request.category)} tone="sage" />
          {request.urgency === 'urgent' && !answered ? <Badge label="Urgent" tone="blush" /> : null}
          {answered ? <Badge label="Answered" tone="honey" /> : null}
        </View>
        <View className="gap-1">
          <Text variant="title" className="text-[19px] leading-[25px]">
            {request.title}
          </Text>
          {request.description ? (
            <Text variant="muted" className="text-[15px] leading-[22px]" numberOfLines={3}>
              {request.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="muted" className="text-[13px]">
              {request.authorName}
            </Text>
            <Text variant="label" color="muted" className="text-[13px]">
              {prayingLabel(request.prayingCount)}
            </Text>
          </View>
          {answered ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={request.praying ? 'Stop praying' : "I'm praying"}
              onPress={onPray}
              hitSlop={8}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                request.praying ? 'bg-primary' : 'bg-blush'
              }`}
            >
              <Ionicons
                name={request.praying ? 'heart' : 'heart-outline'}
                size={16}
                color={request.praying ? colors.cream : colors.roseDeep}
              />
              <Text variant="label" color={request.praying ? 'cream' : 'roseDeep'} className="text-[13px]">
                {request.praying ? 'Praying' : "I'm praying"}
              </Text>
            </Pressable>
          )}
      </View>
    </Card>
  );
}

export default function PrayerScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PrayerStatus>('active');
  const { requests, loading, error, refresh, togglePraying } = usePrayerRequests(status);

  return (
    <Screen backdrop className="px-0 pt-0">
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-6 pb-8 pt-2"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <Segments
              options={[
                { value: 'active', label: 'Active' },
                { value: 'answered', label: 'Answered' },
              ]}
              value={status}
              onChange={setStatus}
            />
            <Button title="New request" onPress={() => router.push('/prayer/new')} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/journal')}
              className="flex-row items-center gap-2 self-start py-1"
            >
              <Ionicons name="book-outline" size={18} color={colors.primary} />
              <Text variant="label" color="primary">
                My private journal
              </Text>
            </Pressable>
            {error ? (
              <Text variant="muted" color="rose">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} className="mt-10" />
          ) : (
            <View className="mt-8 gap-1">
              <Text variant="title">{status === 'active' ? 'No requests yet' : 'No answered prayers yet'}</Text>
              <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
                {status === 'active'
                  ? 'Share what is on your heart and the group will pray with you.'
                  : 'When a request is answered, it moves here with its testimony.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPray={() => togglePraying(item.id)}
            onOpen={() => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })}
          />
        )}
      />
    </Screen>
  );
}
