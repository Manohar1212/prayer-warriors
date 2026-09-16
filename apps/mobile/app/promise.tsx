import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { useBibleLanguage } from '@/features/bible';
import { shareVerse } from '@/features/home/shareVerse';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { VerseShareCard } from '@/features/home/VerseShareCard';
import { useLanguage } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';
import { Scene } from '@/ui/Scene';

/** Today's promise on the sunrise, with share and read actions. */
export default function PromiseScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  const shareCard = useRef<View>(null);
  const now = new Date();

  return (
    <Screen edges={['bottom']} scroll className="gap-6 pt-4">
      <View className="overflow-hidden rounded-[16px]" style={{ height: 380 }}>
        <Scene dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="flex-1 items-center justify-center gap-4 px-7">
          <Text variant="caption" color="cream" style={{ letterSpacing: 2.5 }}>
            {t('promise.today').toUpperCase()}
          </Text>
          <Text variant="scripture" color="cream" className={`text-center ${lang === 'te' ? 'text-[19px] leading-[31px]' : 'text-[21px] leading-[32px]'}`}>
            {verse ? `“${verse.text}”` : '…'}
          </Text>
          {verse ? (
            <Text variant="label" color="creamSoft" className="text-[14px]">
              {verse.reference}
            </Text>
          ) : null}
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
      <Button title={t('promise.viewAll')} onPress={() => router.push('/bible')} />
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
            telugu={lang === 'te'}
          />
        </View>
      ) : null}
    </Screen>
  );
}
