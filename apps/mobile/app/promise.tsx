import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { shareVerse } from '@/features/home/shareVerse';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { VerseShareCard } from '@/features/home/VerseShareCard';
import { useLanguage } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Chip, Screen, Text } from '@/ui';
import { PROMISE_LANGUAGES, usePromiseLanguage } from '@/features/home/promiseLanguage';
import { headingSpacing, quoted } from '@/features/home/quote';
import { Scene, randomSceneVariant } from '@/ui/Scene';

const emblem = require('../assets/logo-emblem.png');

/** Today's promise on the sunrise, in English and one more language of the reader's choosing, with share and read actions. */
export default function PromiseScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  // English always leads; the second language is picked with the pills under the card.
  const verse = useVerseOfTheDay('en');
  const [second, setSecond] = usePromiseLanguage();
  const other = useVerseOfTheDay(second);
  const shareCard = useRef<View>(null);
  const now = new Date();
  const [sky] = useState(randomSceneVariant);

  return (
    <Screen edges={['bottom']} scroll className="gap-6 pt-4">
      {/* At least 440pt, and taller when the second language runs long, so no verse is cut off. */}
      <View className="overflow-hidden rounded-[16px]" style={{ minHeight: 440 }}>
        <Scene variant={sky} shape="tall" dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="flex-1 items-center justify-center gap-4 px-7 pb-12 pt-8">
          <Text variant="caption" color="cream" style={{ letterSpacing: headingSpacing(t('promise.today')) }}>
            {t('promise.today').toUpperCase()}
          </Text>
          <Text variant="scripture" color="cream" className="text-center text-[18px] leading-[27px]">
            {verse ? quoted(verse.text) : '…'}
          </Text>
          {verse ? (
            <Text variant="label" color="creamSoft" className="text-[13px]">
              {verse.reference}
            </Text>
          ) : null}
          {other ? (
            <>
              <View className="h-px w-8 bg-surface/50" />
              <Text variant="scripture" color="cream" className="text-center text-[17px] leading-[28px]">
                {quoted(other.text)}
              </Text>
              <Text variant="label" color="creamSoft" className="text-[13px]">
                {other.reference}
              </Text>
            </>
          ) : null}
        </View>
        {/* The same brand line as the shared image, so the card reads as ours on screen too. */}
        <View className="absolute bottom-3.5 left-0 right-0 flex-row items-center justify-center gap-1.5">
          <Image source={emblem} style={{ width: 18, height: 18 }} resizeMode="contain" />
          <Text variant="label" color="cream" className="text-[12px]">
            Prayer Warriors
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-grow items-center justify-center gap-2 px-5" className="-mx-5 -mt-2 flex-grow-0">
        {PROMISE_LANGUAGES.map((l) => (
          <Chip key={l.code} label={l.label} selected={second === l.code} onPress={() => setSecond(l.code)} />
        ))}
      </ScrollView>
      <View className="flex-row items-center justify-center gap-14">
        <Pressable accessibilityRole="button" onPress={() => verse && shareVerse(shareCard.current, verse.text, verse.reference)} className="items-center gap-1.5">
          <Ionicons name="share-outline" size={24} color={colors.primary} />
          <Text variant="caption">{t('home.shareVerse')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })} className="items-center gap-1.5">
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text variant="caption">{t('home.readChapter')}</Text>
        </Pressable>
      </View>
      <Button title={t('promise.viewAll')} onPress={() => router.push({ pathname: '/bible', params: { from: 'home' } })} />
      {verse ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: -1000, top: 0 }}>
          <VerseShareCard
            ref={shareCard}
            text={verse.text}
            reference={verse.reference}
            title={t('home.dailyBread')}
            date={now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            prayer={t('home.dailyBreadPrayer')}
            prayerReference={t('home.dailyBreadPrayerRef')}
            sky={sky}
            second={other ? { text: other.text, reference: other.reference } : null}
          />
        </View>
      ) : null}
    </Screen>
  );
}
