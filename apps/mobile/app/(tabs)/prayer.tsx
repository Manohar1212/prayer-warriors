import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { CATEGORIES, usePrayerRequests, type PrayerCategory, type PrayerRequest, type PrayerStatus } from '@/features/prayer';
import { timeAgoShort } from '@/lib/time';
import { colors } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Avatar, Badge, Card, Chip, EmptyState, Fab, Screen, Segments, TabHeader, Text } from '@/ui';

type Tab = PrayerStatus | 'journal';

function RequestCard({ request, onPray, onOpen }: { request: PrayerRequest; onPray: () => void; onOpen: () => void }) {
  const answered = request.status === 'answered';
  return (
    <Card className="gap-3">
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${request.title}`} onPress={onOpen} className="gap-3">
        <View className="flex-row items-center gap-3">
          <Avatar name={request.authorName} size={40} />
          <View className="flex-1 gap-0.5">
            <Text variant="label" className="text-[16px]" numberOfLines={2}>
              {request.title}
            </Text>
            <Text variant="caption">
              {request.authorName} · {timeAgoShort(request.createdAt)}
            </Text>
          </View>
          {request.urgency === 'urgent' && !answered ? <Badge label="Urgent" tone="blush" /> : null}
          {answered ? <Badge label="Answered" tone="sage" /> : null}
        </View>
        {request.description ? (
          <Text variant="muted" className="text-[14px] leading-[21px]" numberOfLines={2}>
            {request.description}
          </Text>
        ) : null}
        {answered && request.testimony ? (
          <Text variant="scripture" className="text-[15px] leading-[23px]" numberOfLines={2}>
            {request.testimony}
          </Text>
        ) : null}
      </Pressable>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={request.praying ? 'heart' : 'heart-outline'} size={16} color={colors.roseDeep} />
          <Text variant="caption">{request.prayingCount} praying</Text>
        </View>
        {answered ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={request.praying ? 'Stop praying' : "I'm praying"}
            onPress={onPray}
            hitSlop={8}
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${request.praying ? 'bg-primary' : 'bg-lavender'}`}
          >
            {request.praying ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
            <Text variant="label" color={request.praying ? 'cream' : 'primary'} className="text-[13px]">
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PrayerCategory | 'all'>('all');
  const { requests, loading, error, refresh, togglePraying } = usePrayerRequests(status);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => (category === 'all' || r.category === category) && (!q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
  }, [requests, query, category]);

  const onTab = (tab: Tab) => {
    if (tab === 'journal') router.push('/journal');
    else setStatus(tab);
  };

  return (
    <Screen edges={['top']} className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-4 pb-36 pt-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <TabHeader title="Prayer" subtitle={status === 'active' ? `${requests.length} open ${requests.length === 1 ? 'request' : 'requests'}` : `${requests.length} answered`} right={<HeaderActions />} />
            <Segments<Tab>
              options={[
                { value: 'active', label: 'Active' },
                { value: 'answered', label: 'Answered' },
                { value: 'journal', label: 'Journal' },
              ]}
              value={status}
              onChange={onTab}
            />
            <View className="flex-row items-center gap-2 rounded-full bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder="Search prayer requests"
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                className="min-h-[40px] flex-1 font-sans text-[15px] text-ink"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              <Chip label="All" selected={category === 'all'} onPress={() => setCategory('all')} />
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
              ))}
            </ScrollView>
            {error ? (
              <Text variant="caption" color="roseDeep">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} className="mt-10" />
          ) : (
            <EmptyState
              icon={status === 'active' ? 'heart-outline' : 'sparkles-outline'}
              tone={status === 'active' ? 'blush' : 'honey'}
              title={status === 'active' ? 'No requests yet' : 'No answered prayers yet'}
              body={status === 'active' ? 'Share what is on your heart and the group will pray with you.' : 'When a request is answered, it moves here with its testimony.'}
            />
          )
        }
        renderItem={({ item }) => (
          <RequestCard request={item} onPray={() => togglePraying(item.id)} onOpen={() => router.push({ pathname: '/prayer/[id]', params: { id: item.id } })} />
        )}
      />
      <Fab label="New request" onPress={() => router.push('/prayer/new')} />
    </Screen>
  );
}
