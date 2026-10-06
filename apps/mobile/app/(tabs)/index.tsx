import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { callTitle, isJoinable, useCalls } from '@/features/calls';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { MidnightPrayerCard, nightCallOpen, nightWhen, usePrayerNight, type PrayerNight } from '@/features/prayer';
import { syncPrayerNightReminders } from '@/features/notifications';
import { useDailyQuiz } from '@/features/quiz';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { useLanguage, type TranslationKey } from '@/i18n';
import { prayerNightService, quizService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';
import { PrayIcon } from '@/ui/PrayIcon';
import { Scene, randomSceneVariant, type SceneVariant } from '@/ui/Scene';

type IconName = keyof typeof Ionicons.glyphMap;

function greetingKey(date: Date): TranslationKey {
  const h = date.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

/** Shortcuts to things that are not one tap away on the tab bar. */
const tiles: { label: TranslationKey; icon: IconName | 'pray'; bg: string; fg: string; href: Href }[] = [
  { label: 'home.action.word', icon: 'book', bg: 'bg-honey', fg: colors.gold, href: { pathname: '/bible', params: { from: 'home' } } },
  { label: 'home.action.journal', icon: 'create', bg: 'bg-sky', fg: colors.skyDeep, href: '/journal' },
  { label: 'home.action.call', icon: 'call', bg: 'bg-sage', fg: colors.leaf, href: '/(tabs)/community' },
  { label: 'home.action.leaderboard', icon: 'trophy', bg: 'bg-lavender', fg: colors.violet, href: '/quiz/leaderboard' },
];

type RowIcon = IconName | 'prayNight' | 'quiz';

/** A small second glyph at the disc's lower right, so one icon can say two things. */
function Corner({ name, color }: { name: IconName; color: string }) {
  return (
    <View className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] items-center justify-center rounded-full bg-surface">
      <Ionicons name={name} size={11} color={color} />
    </View>
  );
}

function RowGlyph({ icon, fg }: { icon: RowIcon; fg: string }) {
  // Prayer, at night: praying hands with a crescent.
  if (icon === 'prayNight') {
    return (
      <>
        <PrayIcon size={20} color={fg} />
        <Corner name="moon" color={fg} />
      </>
    );
  }
  // Knowing the Bible: an open book with a bulb.
  if (icon === 'quiz') {
    return (
      <>
        <MaterialCommunityIcons name="book-open-page-variant" size={20} color={fg} />
        <Corner name="bulb" color={fg} />
      </>
    );
  }
  return <Ionicons name={icon} size={19} color={fg} />;
}

/**
 * One line in the day's list. The three used to be separate cards, which read as three
 * competing boxes; they are rows in one card now, so the page has a single block to scan.
 */
function ActionRow({ icon, bg, fg, title, body, badge, onPress }: { icon: RowIcon; bg: string; fg: string; title: string; body?: string; badge?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3.5 px-4 py-3.5 active:opacity-70">
      <View className={`h-10 w-10 items-center justify-center rounded-full ${bg}`}>
        <RowGlyph icon={icon} fg={fg} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" className="text-[15px]">
          {title}
        </Text>
        {body ? <Text variant="caption">{body}</Text> : null}
      </View>
      {badge ? (
        <View className="rounded-full bg-primary px-3 py-1.5">
          <Text variant="label" color="cream" className="text-[12px]">
            {badge}
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  // The promise card speaks the app's language; the Bible's own switch only changes the Bible.
  const { t, locale, language: lang } = useLanguage();
  const { user } = useAuth();
  const verse = useVerseOfTheDay(lang);
  const { next: nextCall } = useCalls();
  const { quiz, refresh: refreshQuiz } = useDailyQuiz(quizService);
  const onNight = useCallback(
    (n: PrayerNight | null) =>
      syncPrayerNightReminders(n, {
        daysAway: (d) => t('prayer.night.reminder.days', { n: d }),
        tonight: t('prayer.night.reminder.tonight'),
        soon: t('prayer.night.reminder.soon'),
        body: t('prayer.night.reminder.body'),
      }),
    [t],
  );
  const { night } = usePrayerNight(prayerNightService, onNight);
  const nightCountdown = night ? (night.daysUntil === 0 ? t('prayer.night.tonight') : night.daysUntil === 1 ? t('prayer.night.tomorrow') : t('prayer.night.inDays', { n: night.daysUntil })) : null;
  // The all-night prayer's own call is part of its card, so it is not repeated as the next call below.
  const nightCallOpenNow = Boolean(night && nightCallOpen(night, new Date()));
  const nextCallIsNight = Boolean(nextCall && night && nextCall.id === night.callId);
  const name = user?.displayName ?? t('home.friend');
  const firstName = name.split(' ')[0];
  const now = new Date();
  // A different picture each time Home comes into view.
  const [sky, setSky] = useState<SceneVariant>(randomSceneVariant);
  useFocusEffect(
    useCallback(() => {
      setSky(randomSceneVariant());
      refreshQuiz();
    }, [refreshQuiz]),
  );

  return (
    <Screen edges={['top']} scroll className="gap-4 px-5 pt-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="body" color="muted">
            {t(greetingKey(now))},
          </Text>
          <Text variant="display" className="text-[26px] leading-[32px]" numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <HeaderActions />
      </View>

      <MidnightPrayerCard />

      {/* Today's promise on the sunrise. */}
      <Pressable accessibilityRole="button" accessibilityLabel={t('home.dailyPromise')} onPress={() => router.push('/promise')} className="overflow-hidden rounded-[16px] active:opacity-90" style={{ height: 176 }}>
        <Scene variant={sky} dim style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="flex-1 justify-end gap-1.5 p-5">
          <Text variant="caption" color="creamSoft">
            {t('home.dailyPromise')}
          </Text>
          {verse ? (
            <>
              <Text variant="label" color="cream" className={lang === 'te' ? 'text-[17px] leading-[27px]' : 'text-[18px] leading-[26px]'} numberOfLines={3}>
                {verse.text}
              </Text>
              <Text variant="caption" color="creamSoft">
                {verse.reference}
              </Text>
            </>
          ) : (
            /* The verse comes from the offline Bible, which takes a moment on first open. */
            <View className="gap-2 pb-1">
              <View className="h-3.5 w-11/12 rounded-full bg-white/25" />
              <View className="h-3.5 w-7/12 rounded-full bg-white/15" />
            </View>
          )}
        </View>
      </Pressable>

      {/* The day in one block: the month's prayer and today's quiz. */}
      <Card className="gap-0 p-0">
        <ActionRow
          icon="prayNight"
          bg="bg-lavender"
          fg={colors.violet}
          title={night ? t('prayer.night.title') : t('home.monthlyPrayer')}
          body={night ? nightWhen(night, locale, true) : t('home.monthlyPrayerBody')}
          badge={nightCallOpenNow ? t('home.join') : (nightCountdown ?? undefined)}
          onPress={() => (nightCallOpenNow && night?.callId ? router.push({ pathname: '/calls/[id]', params: { id: night.callId } }) : router.push({ pathname: '/(tabs)/prayer', params: { tab: 'monthly' } }))}
        />
        <View className="ml-[66px] h-px bg-border" />
        <ActionRow
          icon="quiz"
          bg="bg-honey"
          fg={colors.gold}
          title={t('home.quiz')}
          body={quiz?.result ? `${t('home.quizDone', { score: quiz.result.score, total: quiz.questions.length })}${quiz.streak > 1 ? ` · ${t('home.quizStreak', { n: quiz.streak })}` : ''}` : t('home.quizBody')}
          badge={quiz?.result ? t('home.quizScore', { score: quiz.result.score, total: quiz.questions.length }) : t('home.quizPlay')}
          onPress={() => router.push('/quiz')}
        />
      </Card>

      <View className="flex-row justify-between">
        {tiles.map((tile) => (
          <Pressable key={tile.label} accessibilityRole="button" onPress={() => router.push(tile.href)} className="items-center gap-2 active:opacity-80">
            <View className={`h-[68px] w-[68px] items-center justify-center rounded-[16px] ${tile.bg}`}>
              {tile.icon === 'pray' ? <PrayIcon size={28} color={tile.fg} /> : <Ionicons name={tile.icon} size={26} color={tile.fg} />}
            </View>
            <Text variant="caption" color="ink">
              {t(tile.label)}
            </Text>
          </Pressable>
        ))}
      </View>

      {nextCall && !nextCallIsNight ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: nextCall.id } })} className="active:opacity-80">
          <Card className="flex-row items-center gap-3.5 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-sage">
              <Ionicons name="call" size={20} color={colors.leaf} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="label" className="text-[15px]" numberOfLines={1}>
                {callTitle(nextCall.title, t)}
              </Text>
              <Text variant="caption">{new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</Text>
            </View>
            <View className="rounded-full bg-primary px-3.5 py-1.5">
              <Text variant="label" color="cream" className="text-[12px]">
                {isJoinable(nextCall, now) ? t('home.join') : t('home.view')}
              </Text>
            </View>
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}
