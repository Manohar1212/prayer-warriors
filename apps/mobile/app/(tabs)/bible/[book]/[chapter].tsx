import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, Text as RNText, View } from 'react-native';

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
import { useT } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

const other = (l: BibleLanguage): BibleLanguage => (l === 'en' ? 'te' : 'en');

export default function ChapterScreen() {
  const t = useT();
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
      <ScrollView ref={scrollRef} contentContainerClassName="gap-4 px-3 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3 px-1">
          <BibleNav
            crumbs={[
              { label: t('bible.books'), href: '/bible' },
              { label: current ? bookName(current, lang, true) : '…', href: { pathname: '/bible/[book]', params: { book: String(bookId) } } },
            ]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel={t('bible.textSize')} onPress={cycleSize} hitSlop={8} className="flex-row items-end gap-0.5 rounded-full border border-border bg-surface px-3 py-1.5">
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
        {verses === null && !error ? <Text variant="muted">{t('common.loading')}</Text> : null}

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
                  className={`rounded-xl px-2 py-1.5 ${active ? 'bg-honey' : ''}`}
                >
                  <Text style={style}>
                    <RNText style={{ fontFamily: 'Inter_600SemiBold', color: colors.gold, fontSize: Math.round(style.fontSize * 0.7) }}>
                      {v.label}
                    </RNText>
                    {' '}
                    {v.text}
                  </Text>
                </Pressable>
                {active ? (
                  <View className="mb-2 mx-2 gap-3 rounded-b-xl border border-t-0 border-honey bg-surface px-3 pb-3 pt-2">
                    {twin ? (
                      <Text variant="muted" className="text-[15px] leading-[24px]">
                        {twin.text}
                      </Text>
                    ) : otherVerses === null ? (
                      <Text variant="muted">…</Text>
                    ) : null}
                    <View className="flex-row flex-wrap gap-2">
                      <Button title={copied ? t('bible.copied') : t('bible.copy')} variant="secondary" onPress={() => copy(v)} className="min-h-[40px] px-4" />
                      <Button title={t('bible.share')} variant="secondary" onPress={() => Share.share({ message: `${v.text} — ${reference(v)}` })} className="min-h-[40px] px-4" />
                      <Button title={t('bible.postToGroup')} onPress={() => postToGroup(v)} className="min-h-[40px] px-4" />
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
              <Text variant="label" color="primary">{t('bible.previous')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" onPress={() => go(1)} disabled={chapter >= total} className={`flex-1 flex-row items-center justify-center gap-1 rounded-[14px] bg-primary py-3 ${chapter >= total ? 'opacity-40' : ''}`}>
              <Text variant="label" color="cream">{t('bible.next')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.cream} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
