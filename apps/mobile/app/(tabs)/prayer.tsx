import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { categoryLabel, usePrayerRequests, type PrayerRequest, type PrayerStatus } from '@/features/prayer';
import { colors } from '@/theme/tokens';
import { Fab, Meta, Screen, Segments, Text, type MetaPart } from '@/ui';

function prayingLabel(n: number): string {
  if (n === 0) return 'No one praying yet';
  if (n === 1) return '1 praying';
  return `${n} praying`;
}

function RequestRow({ request, onPray, onOpen }: { request: PrayerRequest; onPray: () => void; onOpen: () => void }) {
  const answered = request.status === 'answered';
  const meta: MetaPart[] = [{ text: categoryLabel(request.category), dot: answered ? 'gold' : 'sage', color: 'muted' }];
  if (request.urgency === 'urgent' && !answered) meta.push({ text: 'Urgent', color: 'roseDeep' });
  if (answered) meta.push({ text: 'Answered', color: 'gold' });
  return (
    <View className="gap-2.5 py-4">
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${request.title}`} onPress={onOpen} className="gap-2">
        <Meta parts={meta} />
        <Text variant="title" className="text-[20px] leading-[26px]">
          {request.title}
        </Text>
        {request.description ? (
          <Text variant="muted" className="text-[15px] leading-[22px]" numberOfLines={2}>
            {request.description}
          </Text>
        ) : null}
        {answered && request.testimony ? (
          <Text variant="scripture" className="text-[16px] leading-[24px]" numberOfLines={2}>
            {request.testimony}
          </Text>
        ) : null}
      </Pressable>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="muted" className="flex-1 text-[13px]">
          {request.authorName} · {prayingLabel(request.prayingCount)}
        </Text>
        {answered ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={request.praying ? 'Stop praying' : "I'm praying"}
            onPress={onPray}
            hitSlop={8}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${request.praying ? 'bg-primary' : 'bg-blush'}`}
          >
            <Ionicons name={request.praying ? 'heart' : 'heart-outline'} size={15} color={request.praying ? colors.cream : colors.roseDeep} />
            <Text variant="label" color={request.praying ? 'cream' : 'roseDeep'} className="text-[13px]">
              {request.praying ? 'Praying' : "I'm praying"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function PrayerScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PrayerStatus>('active');
  const { requests, loading, error, refresh, togglePraying } = usePrayerRequests(status);

  return (
    <Screen className="px-0 pt-0 pb-0">
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow px-4 pb-28 pt-1"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <View className="flex-row items-end justify-between">
              <Segments
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'answered', label: 'Answered' },
                ]}
                value={status}
                onChange={setStatus}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="My private journal"
                onPress={() => router.push('/journal')}
                hitSlop={8}
                className="flex-row items-center gap-1.5 pb-2.5"
              >
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text variant="label" color="primary" className="text-[13px]">
                  Journal
                </Text>
              </Pressable>
            </View>
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
            <View className="mt-10 gap-2">
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
          <RequestRow
            request={item}
            onPray={() => togglePraying(item.id)}
            onOpen={() => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      />
      <Fab label="New request" onPress={() => router.push('/prayer/new')} />
    </Screen>
  );
}
