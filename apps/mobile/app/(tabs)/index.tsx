import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, View } from 'react-native';
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
import { Avatar, Backdrop, Text } from '@/ui';

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

/** A short gold rule: the one ornament on the page, marking where the Word begins. */
function GoldRule() {
  return <View className="h-[2px] w-9 rounded-full bg-gold" />;
}

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

/** A quiet one-line row used when a section has nothing yet. */
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

  const topRequests = requests.slice(0, 3);

  return (
    <View className="flex-1 bg-cream">
      <Backdrop />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Greeting: the emblem and date, then a light greeting with the name in semibold. */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <Image source={emblem} accessibilityLabel="Prayer Warriors" style={{ width: 30, height: 30 }} resizeMode="contain" />
            <Text variant="caption">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <HeaderActions />
        </View>
        <Text variant="display" className="mt-4 text-[30px] leading-[38px]" style={{ fontFamily: fonts.light }} numberOfLines={2}>
          {t(greetingKey(now))},{' '}
          <Text variant="display" className="text-[30px] leading-[38px]">
            {firstName}
          </Text>
        </Text>

        {/* Verse of the day: the centrepiece, set on the page itself. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today's verse in the Bible"
          disabled={!verse}
          onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
          className="mt-7 gap-3 overflow-hidden rounded-[22px] bg-panel px-5 pb-5 pt-6"
        >
          <Text style={{ position: 'absolute', right: 14, top: -6, fontFamily: fonts.displayBold, fontSize: 110, lineHeight: 120, color: colors.gold, opacity: 0.12 }}>
            “
          </Text>
          <GoldRule />
          <Text variant="caption" color="gold">
            {t('home.verseOfTheDay')}
          </Text>
          <Text variant="scripture" className={lang === 'te' ? 'text-[18px] leading-[30px]' : 'text-[21px] leading-[32px]'}>
            {verse ? verse.text : '…'}
          </Text>
          {verse ? (
            <View className="mt-1 flex-row items-center justify-between">
              <Text variant="label" color="gold" className="text-[13px]">
                {verse.reference}
              </Text>
              <View className="flex-row items-center gap-1">
                <Text variant="label" color="primary" className="text-[13px]">
                  {t('home.readChapter')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </View>
          ) : null}
        </Pressable>

        {/* Quick actions */}
        <View className="mt-8 flex-row justify-between">
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-70">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-surface" style={{ boxShadow: '0 2px 10px rgba(42, 28, 92, 0.08)' }}>
                <Ionicons name={a.icon} size={22} color={colors.primary} />
              </View>
              <Text variant="label" color="ink" className="text-[12px]">
                {t(a.label)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Prayer requests */}
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

        {/* Recently shared */}
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

        {/* Next call */}
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
      </ScrollView>
    </View>
  );
}
