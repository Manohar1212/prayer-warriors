import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';

import { matchesQuery, RESOURCE_TYPES, useResources, type Resource, type ResourceType } from '@/features/resources';
import { shortDate } from '@/lib/time';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors, gradients } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Card, Chip, EmptyState, Fab, Screen, TabHeader, Text } from '@/ui';

type Tab = ResourceType | 'bible';

const emptyCopy: Record<ResourceType, { title: TranslationKey; body: TranslationKey }> = {
  song: { title: 'resources.emptySongTitle', body: 'resources.emptySongBody' },
  scripture: { title: 'resources.emptyScriptureTitle', body: 'resources.emptyScriptureBody' },
  prayer: { title: 'resources.emptyPrayerTitle', body: 'resources.emptyPrayerBody' },
};
const pluralKey: Record<ResourceType, TranslationKey> = { song: 'resources.songs', scripture: 'resources.scripture', prayer: 'resources.prayers' };

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
  const { t, locale } = useLanguage();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${resource.title}`} onPress={onOpen}>
      <Card className="flex-row items-center gap-3">
        <Thumb type={resource.type} />
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]" numberOfLines={1}>
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
            {t('resources.sharedBy', { name: resource.sharedBy })} · {shortDate(resource.createdAt, locale)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [type, setType] = useState<ResourceType>('song');
  const [query, setQuery] = useState('');
  const { resources, loading, error, refresh } = useResources(type);
  const visible = useMemo(() => resources.filter((r) => matchesQuery(r, query)), [resources, query]);
  const plural = t(pluralKey[type]);

  const onTab = (tab: Tab) => {
    if (tab === 'bible') router.push('/bible');
    else setType(tab);
  };

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerClassName="flex-grow gap-3 px-4 pb-24 pt-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <TabHeader title={t('resources.title')} subtitle={t('resources.subtitle')} right={<HeaderActions />} />
            <View className="flex-row gap-2">
              {[...RESOURCE_TYPES.map((r) => ({ value: r.id as Tab, label: t(pluralKey[r.id]) })), { value: 'bible' as Tab, label: t('resources.bible') }].map((o) => (
                <Chip key={o.value} label={o.label} selected={type === o.value} onPress={() => onTab(o.value)} />
              ))}
            </View>
            <View className="flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={t('resources.searchIn', { plural: plural.toLowerCase() })}
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
              {t('resources.noMatch', { query })}
            </Text>
          ) : (
            <EmptyState icon={type === 'song' ? 'musical-notes-outline' : type === 'scripture' ? 'book-outline' : 'hand-left-outline'} tone={type === 'song' ? 'lavender' : type === 'scripture' ? 'sage' : 'honey'} title={t(emptyCopy[type].title)} body={t(emptyCopy[type].body)} />
          )
        }
        renderItem={({ item }) => <ResourceCard resource={item} onOpen={() => router.push({ pathname: '/resources/[id]', params: { id: item.id } })} />}
      />
      <Fab label={t('resources.share')} onPress={() => router.push({ pathname: '/resources/new', params: { type } })} />
    </Screen>
  );
}
