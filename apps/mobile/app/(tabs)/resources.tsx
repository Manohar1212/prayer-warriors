import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';

import { matchesQuery, RESOURCE_TYPES, useResources, type Resource, type ResourceType } from '@/features/resources';
import { shortDate } from '@/lib/time';
import { colors, gradients } from '@/theme/tokens';
import { Card, Fab, Screen, Segments, Text } from '@/ui';

type Tab = ResourceType | 'bible';

const emptyCopy: Record<ResourceType, { title: string; body: string }> = {
  song: { title: 'No songs yet', body: 'Share a song that lifts the group up. A link to YouTube or Spotify is enough.' },
  scripture: { title: 'No scripture yet', body: 'Share a verse that spoke to you this week.' },
  prayer: { title: 'No prayers yet', body: 'Share a written prayer the group can pray together.' },
};

function Thumb({ type }: { type: ResourceType }) {
  if (type === 'song') {
    return (
      <LinearGradient colors={[...gradients.song]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-surface/90">
          <Ionicons name="play" size={16} color={colors.primary} style={{ marginLeft: 2 }} />
        </View>
      </LinearGradient>
    );
  }
  const scripture = type === 'scripture';
  return (
    <View className={`h-[60px] w-[60px] items-center justify-center rounded-[14px] ${scripture ? 'bg-sage' : 'bg-honey'}`}>
      <Ionicons name={scripture ? 'book' : 'hand-left'} size={22} color={scripture ? colors.leaf : colors.gold} />
    </View>
  );
}

function ResourceCard({ resource, onOpen }: { resource: Resource; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${resource.title}`} onPress={onOpen}>
      <Card className="flex-row items-center gap-3">
        <Thumb type={resource.type} />
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[16px]" numberOfLines={1}>
            {resource.title}
          </Text>
          {resource.reference ? (
            <Text variant="caption" numberOfLines={1}>
              {resource.reference}
            </Text>
          ) : resource.body ? (
            <Text variant="caption" numberOfLines={1}>
              {resource.body}
            </Text>
          ) : null}
          <Text variant="caption" className="text-[12px]">
            Shared by {resource.sharedBy} · {shortDate(resource.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const [type, setType] = useState<ResourceType>('song');
  const [query, setQuery] = useState('');
  const { resources, loading, error, refresh } = useResources(type);
  const visible = useMemo(() => resources.filter((r) => matchesQuery(r, query)), [resources, query]);
  const plural = RESOURCE_TYPES.find((t) => t.id === type)?.plural ?? '';

  const onTab = (tab: Tab) => {
    if (tab === 'bible') router.push('/bible');
    else setType(tab);
  };

  return (
    <Screen className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-4 pb-28 pt-2"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <Segments<Tab> options={[...RESOURCE_TYPES.map((t) => ({ value: t.id as Tab, label: t.plural })), { value: 'bible', label: 'Bible' }]} value={type} onChange={onTab} />
            <View className="flex-row items-center gap-2 rounded-full bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={`Search ${plural.toLowerCase()}`}
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                className="min-h-[40px] flex-1 font-sans text-[15px] text-ink"
              />
            </View>
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
          ) : query ? (
            <Text variant="muted" className="mt-8">
              Nothing matches "{query}".
            </Text>
          ) : (
            <View className="mt-8 gap-2">
              <Text variant="title">{emptyCopy[type].title}</Text>
              <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
                {emptyCopy[type].body}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <ResourceCard resource={item} onOpen={() => router.push({ pathname: '/resources/[id]', params: { id: item.id } })} />}
      />
      <Fab label="Share something" onPress={() => router.push({ pathname: '/resources/new', params: { type } })} />
    </Screen>
  );
}
