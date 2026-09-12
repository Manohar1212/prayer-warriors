import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { bookName, useAttribution, useBibleLanguage, useBooks, useLastRead, type BibleBook } from '@/features/bible';
import { HeaderHome } from '@/features/bible/BibleNav';
import { LanguageToggle } from '@/features/bible/LanguageToggle';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';

function BookGrid({ books, lang, onOpen }: { books: BibleBook[]; lang: 'en' | 'te'; onOpen: (b: BibleBook) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {books.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          accessibilityLabel={bookName(b, lang)}
          onPress={() => onOpen(b)}
          className="rounded-[12px] bg-lavender px-3.5 py-2.5 active:bg-primary-light"
        >
          <Text variant="label" className="text-[14px]">
            {bookName(b, lang, true)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function BibleScreen() {
  const router = useRouter();
  const [lang, setLang] = useBibleLanguage();
  const { books, error } = useBooks();
  const attribution = useAttribution(lang);
  const lastRead = useLastRead();
  const lastBook = lastRead ? books.find((b) => b.id === lastRead.bookId) : undefined;
  const open = (b: BibleBook) => router.push({ pathname: '/bible/[book]', params: { book: String(b.id) } });

  return (
    <Screen backdrop className="px-0 pt-0">
      <Stack.Screen options={{ headerLeft: () => <HeaderHome /> }} />
      <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <LanguageToggle value={lang} onChange={setLang} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/bible/search')}
          className="flex-row items-center gap-3 rounded-full border border-border bg-surface px-4 py-2.5"
        >
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <Text variant="muted">{lang === 'te' ? 'బైబిల్‌లో వెతకండి' : 'Search the Bible'}</Text>
        </Pressable>
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        {lastRead && lastBook ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(lastRead.bookId), chapter: String(lastRead.chapter) } })}
          >
            <Card tone="honey" className="flex-row items-center justify-between gap-3">
              <View className="gap-0.5">
                <Text variant="label" color="gold" className="text-[12px]">
                  {lang === 'te' ? 'చదవడం కొనసాగించండి' : 'Continue reading'}
                </Text>
                <Text variant="title" className="text-[20px]">
                  {bookName(lastBook, lang, true)} {lastRead.chapter}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color={colors.primary} />
            </Card>
          </Pressable>
        ) : null}
        {books.length ? (
          <>
            <View className="gap-3">
              <Text variant="title">{lang === 'te' ? 'పాత నిబంధన' : 'Old Testament'}</Text>
              <BookGrid books={books.filter((b) => b.testament === 'OT')} lang={lang} onOpen={open} />
            </View>
            <View className="gap-3">
              <Text variant="title">{lang === 'te' ? 'కొత్త నిబంధన' : 'New Testament'}</Text>
              <BookGrid books={books.filter((b) => b.testament === 'NT')} lang={lang} onOpen={open} />
            </View>
          </>
        ) : !error ? (
          <Text variant="muted">Loading…</Text>
        ) : null}
        {attribution ? (
          <Text variant="muted" className="text-[12px] leading-[18px]">
            {attribution}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
