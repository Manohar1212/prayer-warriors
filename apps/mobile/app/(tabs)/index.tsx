import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth';
import { useBibleLanguage } from '@/features/bible';
import { isJoinable, useCalls } from '@/features/calls';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { usePrayerRequests } from '@/features/prayer';
import { type Resource } from '@/features/resources';
import { resourcesService } from '@/lib/parse';
import { timeAgoShort } from '@/lib/time';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors, gradients } from '@/theme/tokens';
import { Avatar, Badge, Card, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function greetingKey(date: Date): TranslationKey {
  const h = date.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

const actions: { label: TranslationKey; icon: IconName; bg: string; fg: string; href: Href }[] = [
  { label: 'home.action.prayer', icon: 'heart', bg: 'bg-blush', fg: colors.roseDeep, href: '/prayer/new' },
  { label: 'home.action.call', icon: 'call', bg: 'bg-lavender', fg: colors.primary, href: '/(tabs)/community' },
  { label: 'home.action.songs', icon: 'musical-notes', bg: 'bg-sage', fg: colors.leaf, href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'home.action.word', icon: 'book', bg: 'bg-honey', fg: colors.gold, href: '/bible' },
];

const resourceIcon: Record<Resource['type'], { name: IconName; bg: string; fg: string }> = {
  song: { name: 'musical-notes', bg: 'bg-lavender', fg: colors.primary },
  scripture: { name: 'book', bg: 'bg-sage', fg: colors.leaf },
  prayer: { name: 'hand-left', bg: 'bg-honey', fg: colors.gold },
};

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-1">
      <Text variant="title" className="text-[17px]">
        {title}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} className="py-1">
        <Text variant="label" color="primary" className="text-[13px]">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  const { requests, loading: loadingRequests } = usePrayerRequests('active');
  const [recent, setRecent] = useState<Resource[]>([]);
  const { next: nextCall } = useCalls();
  const name = user?.displayName ?? t('home.friend');
  const firstName = name.split(' ')[0];
  const now = new Date();

  const loadRecent = useCallback(() => {
    resourcesService.listRecent(3).then(setRecent).catch(() => setRecent([]));
  }, []);
  useEffect(loadRecent, [loadRecent]);
  useFocusEffect(loadRecent);
  // The hero is purple, so the clock and icons go light while Home is on screen.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const topRequests = requests.slice(0, 3);
  // A solid band fades in behind the clock as the hero scrolls away, so the greeting never collides with it.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const band = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [0, 24], [0, 1], 'clamp') }));

  return (
    <View className="flex-1 bg-cream">
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: gradients.welcome[0], zIndex: 10 }, band]} />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero: purple header with the greeting; the verse card hangs over its bottom edge. */}
        <LinearGradient colors={[...gradients.welcome]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 64, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="creamSoft">
              {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <HeaderActions onDark />
          </View>
          <Text variant="display" color="cream" className="mt-1 text-[24px] leading-[30px]" numberOfLines={2}>
            {t(greetingKey(now))}, {firstName}
          </Text>
        </LinearGradient>

        <View className="-mt-12 gap-5 px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's verse in the Bible"
            disabled={!verse}
            onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
          >
            <Card className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                <Text variant="caption" color="primary">
                  {t('home.verseOfTheDay')}
                </Text>
              </View>
              <Text variant="scripture" className={lang === 'te' ? 'text-[16px] leading-[28px]' : 'text-[16px] leading-[25px]'}>
                {verse ? verse.text : '…'}
              </Text>
              {verse ? (
                <View className="flex-row items-center justify-between">
                  <Text variant="label" color="primary" className="text-[13px]">
                    {verse.reference}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text variant="caption">{t('home.readChapter')}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.muted} />
                  </View>
                </View>
              ) : null}
            </Card>
          </Pressable>

          <View className="flex-row justify-between px-2">
            {actions.map((a) => (
              <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-1.5 active:opacity-80">
                <View className={`h-12 w-12 items-center justify-center rounded-[16px] ${a.bg}`}>
                  <Ionicons name={a.icon} size={20} color={a.fg} />
                </View>
                <Text variant="caption" color="ink">
                  {t(a.label)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3">
            <SectionHeader title={t('home.requests')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/prayer')} />
            {topRequests.length ? (
              <Card className="py-1">
                {topRequests.map((r, i) => (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })}
                    className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                  >
                    <Avatar name={r.authorName} size={38} />
                    <View className="flex-1 gap-1">
                      <Text variant="label" className="text-[15px]" numberOfLines={2}>
                        {r.title}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text variant="caption">
                          {r.authorName} · {timeAgoShort(r.createdAt)}
                        </Text>
                        {r.urgency === 'urgent' ? <Badge label={t('prayer.urgent')} tone="blush" /> : null}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name={r.praying ? 'heart' : 'heart-outline'} size={16} color={colors.roseDeep} />
                      <Text variant="caption">{r.prayingCount}</Text>
                    </View>
                  </Pressable>
                ))}
              </Card>
            ) : (
              <Card className="flex-row items-center justify-between gap-3 py-3.5">
                <Text variant="muted" className="flex-1">
                  {loadingRequests ? t('common.loading') : t('home.noRequests')}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/prayer/new')} hitSlop={8}>
                  <Text variant="label" color="primary" className="text-[13px]">
                    {t('home.shareRequest')}
                  </Text>
                </Pressable>
              </Card>
            )}
          </View>

          <View className="gap-3">
            <SectionHeader title={t('home.shared')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/resources')} />
            {recent.length ? (
              <Card className="py-1">
                {recent.map((r, i) => {
                  const icon = resourceIcon[r.type];
                  return (
                    <Pressable
                      key={r.id}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/resources/[id]', params: { id: r.id } })}
                      className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                    >
                      <View className={`h-10 w-10 items-center justify-center rounded-[12px] ${icon.bg}`}>
                        <Ionicons name={icon.name} size={18} color={icon.fg} />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text variant="label" className="text-[15px]" numberOfLines={1}>
                          {r.title}
                        </Text>
                        <Text variant="caption">
                          {t(`resources.type.${r.type}` as TranslationKey)} · {r.sharedBy}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </Pressable>
                  );
                })}
              </Card>
            ) : (
              <Card className="flex-row items-center justify-between gap-3 py-3.5">
                <Text variant="muted" className="flex-1">
                  {t('home.nothingShared')}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/resources/new')} hitSlop={8}>
                  <Text variant="label" color="primary" className="text-[13px]">
                    {t('home.shareSomething')}
                  </Text>
                </Pressable>
              </Card>
            )}
          </View>

          {nextCall ? (
            <LinearGradient colors={[...gradients.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 16 }}>
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-surface/20">
                  <Ionicons name="people" size={20} color={colors.surface} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="caption" color="creamSoft">
                    {t('home.nextCall')}
                  </Text>
                  <Text variant="label" color="cream" className="text-[15px]" numberOfLines={1}>
                    {nextCall.title}
                  </Text>
                  <Text variant="caption" color="creamSoft">
                    {new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: nextCall.id } })} className="rounded-full bg-surface px-4 py-2">
                  <Text variant="label" color="primary" className="text-[13px]">
                    {isJoinable(nextCall, now) ? t('home.join') : t('home.view')}
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/community')} className="flex-row items-center gap-3 rounded-[20px] bg-lavender px-4 py-3.5 active:opacity-80">
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text variant="label" color="primaryDark" className="flex-1 text-[14px]">
                {t('home.noCall')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
