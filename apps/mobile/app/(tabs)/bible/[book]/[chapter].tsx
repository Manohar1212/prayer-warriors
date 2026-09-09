import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import {
  bibleService,
  bookName,
  chapterCount,
  saveLastRead,
  textSizeStyle,
  useBibleLanguage,
  useBibleTextSize,
  useBooks,
  useChapter,
  type BibleLanguage,
  type BibleVerse,
} from '@/features/bible';
import { BibleNav } from '@/features/bible/BibleNav';
import { LanguageToggle } from '@/features/bible/LanguageToggle';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

const other = (l: BibleLanguage): BibleLanguage => (l === 'en' ? 'te' : 'en');

export default function ChapterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookId = Number(params.book);
  const chapter = Number(params.chapter);
  const [lang, setLang] = useBibleLanguage();
  const [size, setSize] = useBibleTextSize();
  const { books } = useBooks();
  const current = books.find((b) => b.id === bookId);
  const { verses, error } = useChapter(bookId, chapter, lang);
  const [selected, setSelected] = useState<number | null>(null);
  const [otherVerses, setOtherVerses] = useState<BibleVerse[] | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const title = current ? `${bookName(current, lang, true)} ${chapter}` : '';
  const total = current ? chapterCount(current, lang) : 0;
  const style = textSizeStyle[size];

  useEffect(() => {
    setSelected(null);
    setOtherVerses(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (bookId && chapter) saveLastRead({ bookId, chapter });
  }, [bookId, chapter, lang]);

  useEffect(() => {
    if (selected === null || otherVerses !== null) return;
    bibleService.chapter(bookId, chapter, other(lang)).then(setOtherVerses).catch(() => setOtherVerses([]));
  }, [selected, otherVerses, bookId, chapter, lang]);

  const reference = (v: BibleVerse) => (current ? `${bookName(current, lang, true)} ${chapter}:${v.label}` : '');

  function go(delta: number) {
    const next = chapter + delta;
    if (next < 1 || next > total) return;
    router.replace({ pathname: '/bible/[book]/[chapter]', params: { book: String(bookId), chapter: String(next) } });
  }

  async function copy(v: BibleVerse) {
    await Clipboard.setStringAsync(`${v.text} — ${reference(v)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function postToGroup(v: BibleVerse) {
    router.push({ pathname: '/resources/new', params: { type: 'scripture', title: reference(v), body: v.text } });
  }

  const cycleSize = () => setSize(size === 'small' ? 'medium' : size === 'medium' ? 'large' : 'small');

  return (
    <Screen backdrop className="px-0 pt-0">
      <Stack.Screen options={{ title }} />
      <ScrollView ref={scrollRef} contentContainerClassName="gap-4 px-5 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3">
          <BibleNav
            crumbs={[
              { label: lang === 'te' ? 'గ్రంథాలు' : 'Books', href: '/bible' },
              { label: current ? bookName(current, lang, true) : '…', href: { pathname: '/bible/[book]', params: { book: String(bookId) } } },
            ]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Text size" onPress={cycleSize} hitSlop={8} className="flex-row items-end gap-0.5 rounded-full border border-border bg-surface px-3 py-1.5">
            <Text variant="label" className="text-[12px]">A</Text>
            <Text variant="label" className="text-[17px] leading-[19px]">A</Text>
          </Pressable>
        </View>

        <LanguageToggle value={lang} onChange={setLang} />

        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        {verses === null && !error ? <Text variant="muted">Loading…</Text> : null}

        <View className="gap-0.5">
          {verses?.map((v) => {
            const active = selected === v.verse;
            const twin = active ? otherVerses?.find((o) => o.verse === v.verse) : undefined;
            return (
              <View key={v.verse}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Verse ${v.label}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelected(active ? null : v.verse)}
                  className={`flex-row gap-3 rounded-xl px-2 py-1.5 ${active ? 'bg-honey' : ''}`}
                >
                  <Text variant="label" color="gold" className="min-w-[26px] pt-1 text-right text-[12px]">
                    {v.label}
                  </Text>
                  <Text className="flex-1" style={style}>
                    {v.text}
                  </Text>
                </Pressable>
                {active ? (
                  <View className="mb-2 ml-2 mr-2 gap-3 rounded-b-xl border border-t-0 border-honey bg-surface px-3 pb-3 pt-2">
                    {twin ? (
                      <Text variant="muted" className="text-[15px] leading-[24px]">
                        {twin.text}
                      </Text>
                    ) : otherVerses === null ? (
                      <Text variant="muted">…</Text>
                    ) : null}
                    <View className="flex-row flex-wrap gap-2">
                      <Button title={copied ? 'Copied' : 'Copy'} variant="secondary" onPress={() => copy(v)} className="min-h-[40px] px-4" />
                      <Button title="Share" variant="secondary" onPress={() => Share.share({ message: `${v.text} — ${reference(v)}` })} className="min-h-[40px] px-4" />
                      <Button title="Post to group" onPress={() => postToGroup(v)} className="min-h-[40px] px-4" />
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {verses && verses.length ? (
          <View className="mt-2 flex-row items-center justify-between gap-3">
            <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" onPress={() => go(-1)} disabled={chapter <= 1} className={`flex-1 flex-row items-center justify-center gap-1 rounded-[14px] border border-border bg-surface py-3 ${chapter <= 1 ? 'opacity-40' : ''}`}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
              <Text variant="label" color="primary">{lang === 'te' ? 'మునుపటి' : 'Previous'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" onPress={() => go(1)} disabled={chapter >= total} className={`flex-1 flex-row items-center justify-center gap-1 rounded-[14px] bg-primary py-3 ${chapter >= total ? 'opacity-40' : ''}`}>
              <Text variant="label" color="cream">{lang === 'te' ? 'తరువాతి' : 'Next'}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.cream} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
