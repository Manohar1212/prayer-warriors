import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { bookName, chapterCount, useBibleLanguage, useBooks } from '@/features/bible';
import { Screen, Text } from '@/ui';

export default function BookScreen() {
  const router = useRouter();
  const { book } = useLocalSearchParams<{ book: string }>();
  const [lang] = useBibleLanguage();
  const { books } = useBooks();
  const current = books.find((b) => b.id === Number(book));

  if (!current) {
    return (
      <Screen backdrop className="justify-center">
        <Text variant="muted">Loading…</Text>
      </Screen>
    );
  }

  const chapters = Array.from({ length: chapterCount(current, lang) }, (_, i) => i + 1);

  return (
    <Screen backdrop className="px-0 pt-0">
      <Stack.Screen options={{ title: bookName(current, lang) }} />
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <Text variant="muted">{lang === 'te' ? 'అధ్యాయం ఎంచుకోండి' : 'Choose a chapter'}</Text>
        <View className="flex-row flex-wrap gap-2">
          {chapters.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${c}`}
              onPress={() => router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(current.id), chapter: String(c) } })}
              className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface active:bg-sage"
            >
              <Text variant="label" className="text-[15px]">
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
