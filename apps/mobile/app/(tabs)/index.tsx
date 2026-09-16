import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { useAuth } from '@/features/auth';
import { useBibleLanguage } from '@/features/bible';
import { isJoinable, useCalls } from '@/features/calls';
import { shareVerse } from '@/features/home/shareVerse';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { VerseShareCard } from '@/features/home/VerseShareCard';
import { HeaderActions } from '@/features/notifications/HeaderActions';
import { usePrayerRequests } from '@/features/prayer';
import { type Resource } from '@/features/resources';
import { resourcesService } from '@/lib/parse';
import { timeAgoShort } from '@/lib/time';
import { useLanguage, type TranslationKey } from '@/i18n';
import { colors } from '@/theme/tokens';
import { Avatar, Text } from '@/ui';

const emblem = require('../../assets/logo-emblem.png');

type IconName = keyof typeof Ionicons.glyphMap;

function dayPart(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
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

/** A small gold cross, drawn rather than typed so every font renders it the same. */
function Cross({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Rect x={5.75} y={0} width={2.5} height={14} rx={1} fill={colors.gold} />
      <Rect x={1.5} y={4} width={11} height={2.5} rx={1} fill={colors.gold} />
    </Svg>
  );
}

/** A gold rule with a small cross at its centre: the traditional divider between sections. */
function GoldRule() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-gold/60" />
      <Cross />
      <View className="h-px flex-1 bg-gold/60" />
    </View>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-end justify-between">
      <Text variant="title" className="text-[24px] leading-[30px]">
        {title}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} className="py-0.5">
        <Text variant="label" color="primary" className="text-[14px]">
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
        <Text variant="label" color="primary" className="text-[14px]">
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
  const part = dayPart(now);
  const shareCard = useRef<View>(null);

  const loadRecent = useCallback(() => {
    resourcesService.listRecent(3).then(setRecent).catch(() => setRecent([]));
  }, []);
  useEffect(loadRecent, [loadRecent]);
  useFocusEffect(loadRecent);

  const topRequests = requests.slice(0, 3);
  const openChapter = () => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } });

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2.5">
            <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 30, height: 30 }} resizeMode="contain" />
            <Text variant="caption">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <HeaderActions />
        </View>
        <Text variant="display" className="mt-4 text-[36px] leading-[42px]" numberOfLines={2}>
          {t(`home.${part}` as TranslationKey)}, {firstName}
        </Text>
        <Text variant="scripture" color="muted" className="mt-1 text-[17px] leading-[24px]">
          {t(`home.thought.${part}` as TranslationKey)}
        </Text>

        {/* Daily Bread: a framed panel with a double gold hairline. */}
        <View className="mt-6 rounded-[6px] border border-gold/70 bg-surface p-[5px]">
          <View className="rounded-[3px] border border-gold/40 px-5 pb-4 pt-5" style={{ gap: 10 }}>
            <View className="items-center gap-1">
              <Cross size={18} />
              <Text variant="label" color="primary" className="text-[13px]" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {t('home.verseOfTheDay')}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open today's verse in the Bible" disabled={!verse} onPress={openChapter}>
              <Text variant="scripture" className={`text-center ${lang === 'te' ? 'text-[19px] leading-[31px]' : 'text-[21px] leading-[32px]'}`}>
                {verse ? verse.text : '…'}
              </Text>
            </Pressable>
            {verse ? (
              <View className="items-center gap-3">
                <Text variant="label" color="gold" className="text-[14px]">
                  {verse.reference}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable accessibilityRole="button" onPress={openChapter} className="flex-row items-center gap-1 rounded-[8px] border border-primary/50 px-3.5 py-2">
                    <Text variant="label" color="primary" className="text-[13px]">
                      {t('home.readChapter')}
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.shareVerse')}
                    onPress={() => shareVerse(shareCard.current, verse.text, verse.reference)}
                    className="flex-row items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2"
                  >
                    <Ionicons name="logo-whatsapp" size={14} color={colors.goldLight} />
                    <Text variant="label" className="text-[13px]" style={{ color: colors.goldLight }}>
                      {t('home.shareVerse')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
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

        <View className="mt-7 flex-row justify-between px-1">
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-70">
              <View className="h-[54px] w-[54px] items-center justify-center rounded-full border border-gold/60 bg-surface">
                <Ionicons name={a.icon} size={22} color={colors.primary} />
              </View>
              <Text variant="label" color="ink" className="text-[13px]">
                {t(a.label)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-8">
          <GoldRule />
        </View>

        <View className="mt-6 gap-1">
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
                  <Text variant="label" className="text-[16px]" numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text variant="caption">
                    {r.authorName} · {timeAgoShort(r.createdAt)}
                    {r.urgency === 'urgent' ? ` · ${t('prayer.urgent')}` : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name={r.praying ? 'heart' : 'heart-outline'} size={16} color={colors.primary} />
                  <Text variant="caption">{r.prayingCount}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyRow text={loadingRequests ? t('common.loading') : t('home.noRequests')} actionLabel={t('home.shareRequest')} onAction={() => router.push('/prayer/new')} />
          )}
        </View>

        <View className="mt-7 gap-1">
          <SectionHeader title={t('home.shared')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/resources')} />
          {recent.length ? (
            recent.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/resources/[id]', params: { id: r.id } })}
                className="flex-row items-center gap-3 border-t border-border py-3.5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-surface">
                  <Ionicons name={resourceIcon[r.type]} size={17} color={colors.primary} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="label" className="text-[16px]" numberOfLines={1}>
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
          className="mt-8 flex-row items-center gap-3 rounded-[8px] bg-primary px-4 py-4 active:opacity-90"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/70">
            <Ionicons name="people-outline" size={19} color={colors.goldLight} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="caption" style={{ color: colors.goldLight }}>
              {t('home.nextCall')}
            </Text>
            <Text variant="label" color="cream" className="text-[16px]" numberOfLines={1}>
              {nextCall ? nextCall.title : t('home.noCall')}
            </Text>
            {nextCall ? (
              <Text variant="caption" color="creamSoft">
                {new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
          <Text variant="label" className="text-[14px]" style={{ color: colors.goldLight }}>
            {nextCall ? (isJoinable(nextCall, now) ? t('home.join') : t('home.view')) : t('common.seeAll')}
          </Text>
        </Pressable>
        <View className="mt-8">
          <GoldRule />
        </View>
      </ScrollView>
    </View>
  );
}
