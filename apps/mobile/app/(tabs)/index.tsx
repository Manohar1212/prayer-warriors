import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { colors, fonts } from '@/theme/tokens';
import { Avatar, Backdrop, Text } from '@/ui';

const emblem = require('../../assets/logo-emblem.png');

type IconName = keyof typeof Ionicons.glyphMap;

function dayPart(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** Each action is a small stamp of paint: a wash colour with an ink icon. */
const actions: { label: TranslationKey; icon: IconName; wash: string; href: Href }[] = [
  { label: 'home.action.prayer', icon: 'heart-outline', wash: 'bg-blush/70', href: '/prayer/new' },
  { label: 'home.action.call', icon: 'call-outline', wash: 'bg-sage/80', href: '/(tabs)/community' },
  { label: 'home.action.songs', icon: 'musical-notes-outline', wash: 'bg-honey/80', href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'home.action.word', icon: 'book-outline', wash: 'bg-blush/50', href: '/bible' },
];

const resourceIcon: Record<Resource['type'], IconName> = {
  song: 'musical-notes-outline',
  scripture: 'book-outline',
  prayer: 'hand-left-outline',
};

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-end justify-between">
      <Text variant="title" className="text-[20px] leading-[26px]">
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
  const part = dayPart(now);
  const shareCard = useRef<View>(null);

  const loadRecent = useCallback(() => {
    resourcesService.listRecent(3).then(setRecent).catch(() => setRecent([]));
  }, []);
  useEffect(loadRecent, [loadRecent]);
  useFocusEffect(loadRecent);

  const topRequests = requests.slice(0, 3);

  return (
    <View className="flex-1 bg-cream">
      <Backdrop />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2.5">
            <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 28, height: 28 }} resizeMode="contain" />
            <Text variant="caption">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <HeaderActions />
        </View>
        <Text variant="display" className="mt-4 text-[34px] leading-[42px]" numberOfLines={2}>
          {t(`home.${part}` as TranslationKey)}, {firstName}
        </Text>
        <Text variant="muted" className="mt-1.5 text-[15px] leading-[22px]">
          {t(`home.thought.${part}` as TranslationKey)}
        </Text>

        {/* Verse of the day, set on the paper with a fleuron. */}
        {/* Verse of the day: compact, and shareable as a card. */}
        <LinearGradient
          colors={['rgba(255,239,201,0.75)', 'rgba(244,214,223,0.55)', 'rgba(255,255,255,0.65)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginTop: 24, borderRadius: 20, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, gap: 8, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center gap-2">
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 20, color: colors.roseDeep }}>❦</Text>
            <Text variant="label" color="roseDeep" className="text-[12px]">
              {t('home.verseOfTheDay')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's verse in the Bible"
            disabled={!verse}
            onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
          >
            <Text variant="scripture" className={lang === 'te' ? 'text-[17px] leading-[28px]' : 'text-[19px] leading-[29px]'}>
              {verse ? verse.text : '…'}
            </Text>
          </Pressable>
          {verse ? (
            <View className="flex-row items-center justify-between">
              <Text variant="caption">{verse.reference}</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
                  hitSlop={6}
                  className="flex-row items-center gap-0.5 py-1"
                >
                  <Text variant="label" color="primary" className="text-[13px]">
                    {t('home.readChapter')}
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.shareVerse')}
                  onPress={() => shareVerse(shareCard.current, verse.text, verse.reference)}
                  className="h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-surface/70"
                >
                  <Ionicons name="share-social-outline" size={15} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          ) : null}
        </LinearGradient>
        {verse ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: -1000, top: 0 }}>
            <VerseShareCard ref={shareCard} text={verse.text} reference={verse.reference} telugu={lang === 'te'} />
          </View>
        ) : null}

        <View className="mt-7 flex-row justify-between px-1">
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-70">
              <View className={`h-[54px] w-[54px] items-center justify-center rounded-full ${a.wash}`}>
                <Ionicons name={a.icon} size={22} color={colors.ink} />
              </View>
              <Text variant="caption" color="ink">
                {t(a.label)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-8 gap-1">
          <SectionHeader title={t('home.requests')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/prayer')} />
          {topRequests.length ? (
            topRequests.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })}
                className="flex-row items-center gap-3 border-t border-border py-3.5"
              >
                <Avatar name={r.authorName} size={36} />
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
                <View className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/70">
                  <Ionicons name={resourceIcon[r.type]} size={17} color={colors.ink} />
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
          className="mt-8 flex-row items-center gap-3 rounded-[20px] border border-border bg-sage/70 px-4 py-4 active:opacity-80"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Ionicons name="people-outline" size={19} color={colors.surface} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="caption" color="primary">
              {t('home.nextCall')}
            </Text>
            <Text variant="label" className="text-[15px]" numberOfLines={1}>
              {nextCall ? nextCall.title : t('home.noCall')}
            </Text>
            {nextCall ? (
              <Text variant="caption">{new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</Text>
            ) : null}
          </View>
          <Text variant="label" color="primary" className="text-[13px]">
            {nextCall ? (isJoinable(nextCall, now) ? t('home.join') : t('home.view')) : t('common.seeAll')}
          </Text>
        </Pressable>
        <Text className="mt-8 text-center" style={{ fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 22, color: colors.muted, opacity: 0.6 }}>
          ❦
        </Text>
      </ScrollView>
    </View>
  );
}
