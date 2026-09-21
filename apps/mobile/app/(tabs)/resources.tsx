import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { firstLine, HYMN_BOOKS, loadHymnBook, numberSongs, searchHymns, searchSongs, useResources, useSongBook, type Hymn, type Song, type SongBook } from '@/features/resources';
import { useLanguage } from '@/i18n';
import { colors } from '@/theme/tokens';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { Chip, EmptyState, Fab, Screen, TabHeader, Text } from '@/ui';

/**
 * A line in a songbook, set like a hymn book index: the number in its own column, the title
 * in full. No card, no chevron and no preview - a hymn's first line is its title, so a preview
 * only repeated it, and six hundred bordered cards read as a wall.
 */
function SongRow({ number, title, line, onOpen }: { number: number; title: string; line?: string; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${number}. ${title}`} onPress={onOpen} className="flex-row items-baseline gap-3 px-1 py-3 active:opacity-60">
      <Text variant="caption" color="muted" className="w-8 text-right text-[13px]">
        {number}
      </Text>
      <View className="flex-1 gap-0.5">
        <Text variant="body" className="text-[16px] leading-[23px]" numberOfLines={2}>
          {title}
        </Text>
        {line ? (
          <Text variant="caption" numberOfLines={1}>
            {line}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Hairline between index lines, indented past the number column. */
function RowDivider() {
  return <View className="ml-12 h-px bg-border" />;
}

/** A shared song's second line: who sings it, or its opening line when that is not the title again. */
function subtitleOf(song: Song): string | undefined {
  if (song.reference) return song.reference;
  const opening = song.body ? firstLine(song.body) : '';
  return opening && opening !== song.title ? opening : undefined;
}

type Row = Song | Hymn;
const isHymn = (r: Row): r is Hymn => 'n' in r;

export default function ResourcesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [book, setBook] = useSongBook();
  const [query, setQuery] = useState('');
  // Songs only: shared verses and prayers were taken off this page (any already shared stay in the database).
  const { resources, loading, error, refresh } = useResources('song');
  const visible = useMemo<Row[]>(() => (book === 'group' ? searchSongs(numberSongs(resources), query) : searchHymns(book, query)), [resources, query, book]);
  const chips: { value: SongBook; label: string }[] = [
    { value: 'group', label: t('resources.book.group') },
    ...HYMN_BOOKS.map((b) => ({ value: b.id as SongBook, label: t(b.label) })),
  ];

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0 pb-0">
      <FlatList
        data={visible}
        keyExtractor={(r) => (isHymn(r) ? `${book}-${r.n}` : r.id)}
        initialNumToRender={12}
        windowSize={7}
        contentContainerClassName="flex-grow px-4 pb-24 pt-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={RowDivider}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <TabHeader title={t('resources.title')} subtitle={t('resources.subtitle')} right={<HeaderActions />} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4" className="-mr-4">
              {chips.map((o) => (
                <Chip key={o.value} label={o.label} selected={book === o.value} onPress={() => setBook(o.value)} />
              ))}
            </ScrollView>
            <Text variant="caption" color="muted" className="px-1 text-[12px]">
              {/* The full name, unless the pill already spells it out (it does in Telugu). */}
              {book === 'akk' && t('resources.book.akk') !== t('resources.book.akkFull') ? `${t('resources.book.akkFull')} · ` : ''}
              {t('resources.book.count', { n: book === 'group' ? numberSongs(resources).length : loadHymnBook(book).length })}
            </Text>
            <View className="flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3.5">
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                placeholder={t('resources.song.searchPlaceholder')}
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
              {t('resources.book.noMatch', { query })}
            </Text>
          ) : (
            <EmptyState icon="musical-notes-outline" tone="lavender" title={t('resources.emptySongTitle')} body={t('resources.emptySongBody')} />
          )
        }
        renderItem={({ item }) =>
          isHymn(item) ? (
            <SongRow number={item.n} title={item.title} onOpen={() => router.push({ pathname: '/resources/hymn', params: { book, n: String(item.n) } })} />
          ) : (
            <SongRow number={item.number} title={item.title} line={subtitleOf(item)} onOpen={() => router.push({ pathname: '/resources/song', params: { id: item.id } })} />
          )
        }
      />
      {book !== 'group' ? null : <Fab label={t('resources.share')} onPress={() => router.push({ pathname: '/resources/new', params: { type: 'song' } })} />}
    </Screen>
  );
}
