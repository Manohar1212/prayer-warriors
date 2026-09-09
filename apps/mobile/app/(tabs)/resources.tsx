import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';

import { matchesQuery, RESOURCE_TYPES, useResources, type Resource, type ResourceType } from '@/features/resources';
import { colors } from '@/theme/tokens';
import { Fab, Meta, Screen, Segments, Text, type MetaPart } from '@/ui';

const emptyCopy: Record<ResourceType, { title: string; body: string }> = {
  song: { title: 'No songs yet', body: 'Share a song that lifts the group up. A link to YouTube or Spotify is enough.' },
  scripture: { title: 'No scripture yet', body: 'Share a verse that spoke to you this week.' },
  prayer: { title: 'No prayers yet', body: 'Share a written prayer the group can pray together.' },
};

function ResourceRow({ resource, onOpen }: { resource: Resource; onOpen: () => void }) {
  const meta: MetaPart[] = [{ text: `Shared by ${resource.sharedBy}` }];
  if (resource.url) meta.push({ text: 'Link', color: 'gold' });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${resource.title}`} onPress={onOpen} className="gap-2 py-4">
      <View className="gap-0.5">
        <Text variant="title" className="text-[20px] leading-[26px]">
          {resource.title}
        </Text>
        {resource.reference ? (
          <Text variant="label" color="gold" className="text-[13px]">
            {resource.reference}
          </Text>
        ) : null}
      </View>
      {resource.body ? (
        <Text
          variant={resource.type === 'scripture' ? 'scripture' : 'body'}
          color={resource.type === 'scripture' ? 'ink' : 'muted'}
          className={resource.type === 'scripture' ? 'text-[17px] leading-[26px]' : 'text-[15px] leading-[22px]'}
          numberOfLines={3}
        >
          {resource.body}
        </Text>
      ) : null}
      <Meta parts={meta} />
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const [type, setType] = useState<ResourceType>('song');
  const [query, setQuery] = useState('');
  const { resources, loading, error, refresh } = useResources(type);
  const visible = useMemo(() => resources.filter((r) => matchesQuery(r, query)), [resources, query]);

  return (
    <Screen className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow px-4 pb-28 pt-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <View className="flex-row items-end justify-between">
              <Segments options={RESOURCE_TYPES.map((t) => ({ value: t.id, label: t.plural }))} value={type} onChange={setType} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Read the Bible"
                onPress={() => router.push('/bible')}
                hitSlop={8}
                className="flex-row items-center gap-1.5 pb-2.5"
              >
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text variant="label" color="primary" className="text-[13px]">
                  Bible
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2 rounded-full border border-border bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={`Search ${RESOURCE_TYPES.find((t) => t.id === type)?.plural.toLowerCase()}`}
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                className="min-h-[40px] flex-1 font-sans text-[15px] text-ink"
              />
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
        renderItem={({ item }) => (
          <ResourceRow resource={item} onOpen={() => router.push({ pathname: '/resources/[id]', params: { id: item.id } })} />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
      />
      <Fab label="Share something" onPress={() => router.push({ pathname: '/resources/new', params: { type } })} />
    </Screen>
  );
}
