import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { matchesQuery, RESOURCE_TYPES, useResources, type Resource, type ResourceType } from '@/features/resources';
import { colors } from '@/theme/tokens';
import { Badge, Button, Card, Input, Screen, Segments, Text } from '@/ui';

const emptyCopy: Record<ResourceType, { title: string; body: string }> = {
  song: { title: 'No songs yet', body: 'Share a song that lifts the group up. A link to YouTube or Spotify is enough.' },
  scripture: { title: 'No scripture yet', body: 'Share a verse that spoke to you this week.' },
  prayer: { title: 'No prayers yet', body: 'Share a written prayer the group can pray together.' },
};

function ResourceCard({ resource, onOpen }: { resource: Resource; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${resource.title}`} onPress={onOpen}>
      <Card className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="title" className="text-[19px] leading-[25px]">
              {resource.title}
            </Text>
            {resource.reference ? <Text variant="muted">{resource.reference}</Text> : null}
          </View>
          {resource.url ? <Badge label="Link" tone="honey" /> : null}
        </View>
        {resource.body ? (
          <Text variant={resource.type === 'scripture' ? 'scripture' : 'body'} className="text-[15px] leading-[22px]" numberOfLines={3}>
            {resource.body}
          </Text>
        ) : null}
        <Text variant="muted" className="text-[13px]">
          Shared by {resource.sharedBy}
        </Text>
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

  return (
    <Screen backdrop className="px-0 pt-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-6 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <Segments options={RESOURCE_TYPES.map((t) => ({ value: t.id, label: t.plural }))} value={type} onChange={setType} />
            <Button title="Share something" onPress={() => router.push({ pathname: '/resources/new', params: { type } })} />
            <Pressable accessibilityRole="button" onPress={() => router.push('/bible')} className="flex-row items-center gap-2 self-start py-1">
              <Ionicons name="book-outline" size={18} color={colors.primary} />
              <Text variant="label" color="primary">
                Read the Bible
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <Input
                placeholder="Search"
                value={query}
                onChangeText={setQuery}
                className="flex-1"
                style={{ borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 }}
                autoCapitalize="none"
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
            <Text variant="muted" className="mt-6">
              Nothing matches "{query}".
            </Text>
          ) : (
            <View className="mt-6 gap-1">
              <Text variant="title">{emptyCopy[type].title}</Text>
              <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
                {emptyCopy[type].body}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ResourceCard resource={item} onOpen={() => router.push({ pathname: '/resources/[id]', params: { id: item.id } })} />
        )}
      />
    </Screen>
  );
}
