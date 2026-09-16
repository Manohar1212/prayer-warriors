import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
import { colors, fonts, gradients } from '@/theme/tokens';
import { Aurora, Avatar, Text, paletteForHour } from '@/ui';

const emblem = require('../../assets/logo-emblem.png');

type IconName = keyof typeof Ionicons.glyphMap;

function greetingKey(date: Date): TranslationKey {
  const h = date.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

const actions: { label: TranslationKey; icon: IconName; href: Href }[] = [
  { label: 'home.action.prayer', icon: 'heart-outline', href: '/prayer/new' },
  { label: 'home.action.call', icon: 'call-outline', href: '/(tabs)/community' },
  { label: 'home.action.songs', icon: 'musical-notes-outline', href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'home.action.word', icon: 'book-outline', href: '/bible' },
];

const resourceIcon: Record<Resource['type'], IconName> = {
  song: 'musical-notes-outline',
  scripture: 'book-outline',
  prayer: 'hand-left-outline',
};

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-end justify-between">
      <Text variant="title" className="text-[17px]">
        {title}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} className="py-0.5">
        <Text variant="label" color="primary" className="text-[13px]">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyRow({ text, actionLabel, onAction }: { text: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-t border-border py-4">
      <Text variant="muted" className="flex-1">
        {text}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
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
  // The sky is dark under the clock, so the status bar goes light while Home is on screen.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const topRequests = requests.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: '#1A123F' }}>
      {/* The sky for this hour; the white sheet below covers whatever the header does not use. */}
      <Aurora palette={paletteForHour(now.getHours())} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 720 }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        {/* On the sky: date, greeting, and the verse of the day set like a verse image. */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 22, paddingBottom: 44 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 30, height: 30 }} resizeMode="contain" />
              <Text variant="caption" color="creamSoft">
                {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <HeaderActions onDark />
          </View>
          <Text variant="display" color="cream" className="mt-5 text-[30px] leading-[38px]" style={{ fontFamily: fonts.light }} numberOfLines={2}>
            {t(greetingKey(now))},{' '}
            <Text variant="display" color="cream" className="text-[30px] leading-[38px]">
              {firstName}
            </Text>
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's verse in the Bible"
            disabled={!verse}
            onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
            className="mt-9 gap-3"
          >
            <View className="flex-row items-center gap-2">
              <View className="h-[2px] w-7 rounded-full" style={{ backgroundColor: colors.goldLight }} />
              <Text variant="caption" style={{ color: colors.goldLight }}>
                {t('home.verseOfTheDay')}
              </Text>
            </View>
            <Text variant="scripture" color="cream" className={lang === 'te' ? 'text-[19px] leading-[31px]' : 'text-[22px] leading-[33px]'}>
              {verse ? verse.text : '…'}
            </Text>
            {verse ? (
              <View className="mt-1 flex-row items-center justify-between">
                <Text variant="label" color="creamSoft" className="text-[13px]">
                  {verse.reference}
                </Text>
                <View className="flex-row items-center gap-1 rounded-full border border-surface/30 bg-surface/15 py-1.5 pl-3.5 pr-2.5">
                  <Text variant="label" color="cream" className="text-[13px]">
                    {t('home.readChapter')}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.cream} />
                </View>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* The sheet: everything else, on white, sliding up over the sky. */}
        <Animated.View entering={FadeInDown.duration(520).delay(80)} style={{ flex: 1, marginTop: -16, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.cream, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 }}>
          <View className="flex-row justify-between px-1">
            {actions.map((a) => (
              <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-70">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-surface" style={{ boxShadow: '0 4px 14px rgba(42, 28, 92, 0.10)' }}>
                  <Ionicons name={a.icon} size={22} color={colors.primary} />
                </View>
                <Text variant="label" color="ink" className="text-[12px]">
                  {t(a.label)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-9 gap-2">
            <SectionHeader title={t('home.requests')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/prayer')} />
            {topRequests.length ? (
              topRequests.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })}
                  className="flex-row items-center gap-3 border-t border-border py-3.5"
                >
                  <Avatar name={r.authorName} size={38} />
                  <View className="flex-1 gap-0.5">
                    <Text variant="label" className="text-[15px]" numberOfLines={2}>
                      {r.title}
                    </Text>
                    <Text variant="caption">
                      {r.authorName} · {timeAgoShort(r.createdAt)}
                      {r.urgency === 'urgent' ? ` · ${t('prayer.urgent')}` : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name={r.praying ? 'heart' : 'heart-outline'} size={16} color={colors.roseDeep} />
                    <Text variant="caption">{r.prayingCount}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <EmptyRow text={loadingRequests ? t('common.loading') : t('home.noRequests')} actionLabel={t('home.shareRequest')} onAction={() => router.push('/prayer/new')} />
            )}
          </View>

          <View className="mt-8 gap-2">
            <SectionHeader title={t('home.shared')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/resources')} />
            {recent.length ? (
              recent.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/resources/[id]', params: { id: r.id } })}
                  className="flex-row items-center gap-3 border-t border-border py-3.5"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-panel">
                    <Ionicons name={resourceIcon[r.type]} size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text variant="label" className="text-[15px]" numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="caption">
                      {t(`resources.type.${r.type}` as TranslationKey)} · {r.sharedBy}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              ))
            ) : (
              <EmptyRow text={t('home.nothingShared')} actionLabel={t('home.shareSomething')} onAction={() => router.push('/resources/new')} />
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(nextCall ? { pathname: '/calls/[id]', params: { id: nextCall.id } } : '/(tabs)/community')}
            className="mt-8 active:opacity-90"
          >
            <LinearGradient colors={[...gradients.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 16, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', right: -24, top: -34, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' }} />
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-surface/15">
                  <Ionicons name="people-outline" size={20} color={colors.surface} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="caption" color="creamSoft">
                    {t('home.nextCall')}
                  </Text>
                  <Text variant="label" color="cream" className="text-[15px]" numberOfLines={1}>
                    {nextCall ? nextCall.title : t('home.noCall')}
                  </Text>
                  {nextCall ? (
                    <Text variant="caption" color="creamSoft">
                      {new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  ) : null}
                </View>
                {nextCall ? (
                  <View className="rounded-full bg-surface px-3.5 py-2">
                    <Text variant="label" color="primaryDark" className="text-[13px]">
                      {isJoinable(nextCall, now) ? t('home.join') : t('home.view')}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.surface} />
                )}
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
