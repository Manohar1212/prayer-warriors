import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { useBibleLanguage } from '@/features/bible';
import { shareVerse } from '@/features/home/shareVerse';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { VerseShareCard } from '@/features/home/VerseShareCard';
import { useLanguage } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';
import { headingSpacing, quoted } from '@/features/home/quote';
import { Scene, randomSceneVariant } from '@/ui/Scene';

const emblem = require('../assets/logo-emblem.png');

/** Today's promise on the sunrise, with share and read actions. */
export default function PromiseScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  // The other language, so the card and the shared image read in both English and Telugu.
  const other = useVerseOfTheDay(lang === 'te' ? 'en' : 'te');
  const shareCard = useRef<View>(null);
  const now = new Date();
  const [sky] = useState(randomSceneVariant);

  return (
    <Screen edges={['bottom']} scroll className="gap-6 pt-4">
      <View className="overflow-hidden rounded-[16px]" style={{ height: 440 }}>
        <Scene variant={sky} shape="tall" dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="flex-1 items-center justify-center gap-4 px-7 pb-8">
          <Text variant="caption" color="cream" style={{ letterSpacing: headingSpacing(t('promise.today')) }}>
            {t('promise.today').toUpperCase()}
          </Text>
          <Text variant="scripture" color="cream" className={`text-center ${lang === 'te' ? 'text-[17px] leading-[28px]' : 'text-[18px] leading-[27px]'}`}>
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
              <Text variant="scripture" color="cream" className={`text-center ${lang === 'te' ? 'text-[17px] leading-[26px]' : 'text-[17px] leading-[28px]'}`}>
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
            telugu={lang === 'te'}
          />
        </View>
      ) : null}
    </Screen>
  );
}
