import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';

import { firstLine, HYMN_BOOKS, loadHymnBook, matchesQuery, numberSongs, RESOURCE_TYPES, searchHymns, searchSongs, useResources, useSongBook, type Hymn, type Resource, type ResourceType, type Song } from '@/features/resources';
import { shortDate } from '@/lib/time';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors, gradients } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Card, Chip, EmptyState, Fab, Screen, Segments, TabHeader, Text } from '@/ui';

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

/** A line in a songbook: number, title, opening line. */
function SongRow({ number, title, line, onOpen }: { number: number; title: string; line: string; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${number}. ${title}`} onPress={onOpen} className="active:opacity-80">
      <Card className="flex-row items-center gap-3 py-3.5">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-honey">
          <Text variant="label" color="gold" className={number >= 100 ? 'text-[13px]' : 'text-[15px]'}>
            {number}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[16px]" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {line}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

type Row = Resource | Song | Hymn;
const isHymn = (r: Row): r is Hymn => 'n' in r;
const isSong = (r: Row): r is Song => 'number' in r;

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
  const [book, setBook] = useSongBook();
  const [query, setQuery] = useState('');
  const { resources, loading, error, refresh } = useResources(type);
  const visible = useMemo<Row[]>(() => {
    if (type !== 'song') return resources.filter((r) => matchesQuery(r, query));
    if (book === 'group') return searchSongs(numberSongs(resources), query);
    return searchHymns(book, query);
  }, [resources, query, type, book]);
  const bookOptions = [{ value: 'group' as const, label: t('resources.book.group') }, ...HYMN_BOOKS.map((b) => ({ value: b.id, label: t(b.label) }))];
  const songLike = type === 'song';
  const plural = t(pluralKey[type]);

  const onTab = (tab: Tab) => {
    if (tab === 'bible') router.push({ pathname: '/bible', params: { from: 'resources' } });
    else setType(tab);
  };

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => (isHymn(r) ? `${book}-${r.n}` : r.id)}
        initialNumToRender={12}
        windowSize={7}
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
            {songLike ? (
              <View className="gap-1.5">
                <Segments options={bookOptions} value={book} onChange={setBook} />
                <Text variant="caption" color="muted" className="px-1">
                  {book === 'akk' ? `${t('resources.book.akkFull')} · ` : ''}
                  {t('resources.book.count', { n: book === 'group' ? numberSongs(resources).length : loadHymnBook(book).length })}
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={type === 'song' ? t('resources.song.searchPlaceholder') : t('resources.searchIn', { plural: plural.toLowerCase() })}
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
              {songLike ? t('resources.book.noMatch', { query }) : t('resources.noMatch', { query })}
            </Text>
          ) : (
            <EmptyState icon={type === 'song' ? 'musical-notes-outline' : type === 'scripture' ? 'book-outline' : 'hand-left-outline'} tone={type === 'song' ? 'lavender' : type === 'scripture' ? 'sage' : 'honey'} title={t(emptyCopy[type].title)} body={t(emptyCopy[type].body)} />
          )
        }
        renderItem={({ item }) =>
          isHymn(item) ? (
            <SongRow number={item.n} title={item.title} line={firstLine(item.body)} onOpen={() => router.push({ pathname: '/resources/hymn', params: { book, n: String(item.n) } })} />
          ) : isSong(item) ? (
            <SongRow number={item.number} title={item.title} line={item.body ? firstLine(item.body) : item.reference || '—'} onOpen={() => router.push({ pathname: '/resources/song', params: { id: item.id } })} />
          ) : (
            <ResourceCard resource={item} onOpen={() => router.push({ pathname: '/resources/[id]', params: { id: item.id } })} />
          )
        }
      />
      {songLike && book !== 'group' ? null : <Fab label={t('resources.share')} onPress={() => router.push({ pathname: '/resources/new', params: { type } })} />}
    </Screen>
  );
}
