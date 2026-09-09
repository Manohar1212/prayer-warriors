import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { bookName, chapterCount, useBibleLanguage, useBooks, useChapter, type BibleVerse } from '@/features/bible';
import { BibleNav } from '@/features/bible/BibleNav';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

export default function ChapterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookId = Number(params.book);
  const chapter = Number(params.chapter);
  const [lang, setLang] = useBibleLanguage();
  const { books } = useBooks();
  const current = books.find((b) => b.id === bookId);
  const { verses, error } = useChapter(bookId, chapter, lang);
  const [selected, setSelected] = useState<BibleVerse | null>(null);
  const [copied, setCopied] = useState(false);

  const title = current ? `${bookName(current, lang, true)} ${chapter}` : '';
  const total = current ? chapterCount(current, lang) : 0;
  const reference = (v: BibleVerse) => (current ? `${bookName(current, lang, true)} ${chapter}:${v.label}` : '');

  function go(delta: number) {
    const next = chapter + delta;
    if (next < 1 || next > total) return;
    setSelected(null);
    router.replace({ pathname: '/bible/[book]/[chapter]', params: { book: String(bookId), chapter: String(next) } });
  }

  async function copy(v: BibleVerse) {
    await Clipboard.setStringAsync(`${v.text} — ${reference(v)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function postToGroup(v: BibleVerse) {
    setSelected(null);
    router.push({ pathname: '/resources/new', params: { type: 'scripture', title: reference(v), body: v.text } });
  }

  return (
    <Screen backdrop className="px-0 pt-0">
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <BibleNav
          crumbs={[
            { label: lang === 'te' ? 'గ్రంథాలు' : 'Books', href: '/bible' },
            { label: current ? bookName(current, lang, true) : '…', href: { pathname: '/bible/[book]', params: { book: String(bookId) } } },
          ]}
        />
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" onPress={() => go(-1)} disabled={chapter <= 1} hitSlop={8} className="p-2">
            <Ionicons name="chevron-back" size={22} color={chapter <= 1 ? colors.border : colors.primary} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setLang(lang === 'en' ? 'te' : 'en')} className="rounded-full border border-border bg-surface px-3 py-1.5">
            <Text variant="label" color="primary" className="text-[13px]">
              {lang === 'en' ? 'తెలుగు' : 'English'}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" onPress={() => go(1)} disabled={chapter >= total} hitSlop={8} className="p-2">
            <Ionicons name="chevron-forward" size={22} color={chapter >= total ? colors.border : colors.primary} />
          </Pressable>
        </View>

        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        {verses === null && !error ? <Text variant="muted">Loading…</Text> : null}

        <View className="gap-1">
          {verses?.map((v) => {
            const active = selected?.verse === v.verse;
            return (
              <Pressable
                key={v.verse}
                accessibilityRole="button"
                onPress={() => setSelected(active ? null : v)}
                className={`flex-row gap-3 rounded-xl px-2 py-1.5 ${active ? 'bg-honey' : ''}`}
              >
                <Text variant="label" color="gold" className="w-7 pt-1 text-right text-[12px]">
                  {v.label}
                </Text>
                <Text className={`flex-1 text-[17px] ${lang === 'te' ? 'leading-[30px]' : 'leading-[28px]'}`}>{v.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <Card className="gap-3">
            <Text variant="muted">{reference(selected)}</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button title={copied ? 'Copied' : 'Copy'} variant="secondary" onPress={() => copy(selected)} className="min-h-[44px] px-4" />
              <Button title="Share" variant="secondary" onPress={() => Share.share({ message: `${selected.text} — ${reference(selected)}` })} className="min-h-[44px] px-4" />
              <Button title="Post to group" onPress={() => postToGroup(selected)} className="min-h-[44px] px-4" />
            </View>
          </Card>
        ) : null}

        {verses && verses.length ? (
          <View className="flex-row gap-3">
            <Button title="Previous" variant="ghost" onPress={() => go(-1)} disabled={chapter <= 1} className="flex-1" />
            <Button title="Next chapter" onPress={() => go(1)} disabled={chapter >= total} className="flex-1" />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
