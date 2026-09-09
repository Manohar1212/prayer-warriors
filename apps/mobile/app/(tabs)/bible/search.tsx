import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { useBibleLanguage, useSearch, type SearchHit } from '@/features/bible';
import { Highlight } from '@/features/bible/Highlight';
import { LanguageToggle } from '@/features/bible/LanguageToggle';
import { colors } from '@/theme/tokens';
import { Input, Screen, Text } from '@/ui';

export default function BibleSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [lang, setLang] = useBibleLanguage();
  const [query, setQuery] = useState(params.q ?? '');
  const { hits, searching, error } = useSearch(query, lang);

  const open = (h: SearchHit) => router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(h.bookId), chapter: String(h.chapter) } });

  return (
    <Screen backdrop className="px-0 pt-0">
      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.bookId}-${h.chapter}-${h.verse}`}
        contentContainerClassName="flex-grow gap-2 px-6 pb-10 pt-2"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <LanguageToggle value={lang} onChange={setLang} />
            <Input placeholder={lang === 'te' ? 'పదం లేదా వాక్యం' : 'A word or phrase'} value={query} onChangeText={setQuery} autoFocus autoCapitalize="none" returnKeyType="search" />
            {error ? (
              <Text variant="muted" color="rose">
                {error}
              </Text>
            ) : null}
            {searching ? <ActivityIndicator color={colors.primary} /> : null}
            {!searching && query.trim().length >= 2 ? (
              <Text variant="muted">{hits.length === 200 ? 'Showing the first 200 matches' : `${hits.length} ${hits.length === 1 ? 'match' : 'matches'}`}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => open(item)} className="gap-1 rounded-xl border border-border bg-surface px-4 py-3">
            <Text variant="label" color="primary" className="text-[13px]">
              {item.bookName} {item.chapter}:{item.label}
            </Text>
            <Highlight text={item.text} query={query} className="text-[15px] leading-[23px]" numberOfLines={3} />
          </Pressable>
        )}
      />
    </Screen>
  );
}
