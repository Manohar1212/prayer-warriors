import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { colors } from '@/theme/tokens';
import { Avatar, Backdrop, Badge, Card, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function greetingKey(date: Date): TranslationKey {
  const h = date.getHours();
  if (h < 12) return 'home.morning';
  if (h < 17) return 'home.afternoon';
  return 'home.evening';
}

const actions: { label: TranslationKey; icon: IconName; bg: string; fg: string; href: Href }[] = [
  { label: 'home.action.prayer', icon: 'heart', bg: 'bg-lavender', fg: colors.primary, href: '/prayer/new' },
  { label: 'home.action.call', icon: 'call', bg: 'bg-lavender', fg: colors.primary, href: '/(tabs)/community' },
  { label: 'home.action.songs', icon: 'musical-notes', bg: 'bg-lavender', fg: colors.primary, href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'home.action.word', icon: 'book', bg: 'bg-lavender', fg: colors.primary, href: '/bible' },
];

const resourceIcon: Record<Resource['type'], { name: IconName; bg: string; fg: string }> = {
  song: { name: 'musical-notes', bg: 'bg-lavender', fg: colors.primary },
  scripture: { name: 'book', bg: 'bg-lavender', fg: colors.primary },
  prayer: { name: 'hand-left', bg: 'bg-lavender', fg: colors.primary },
};

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-end justify-between px-1">
      <Text variant="title" className="text-[17px]">
        {title}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} className="py-0.5">
        <Text variant="label" color="primary" className="text-[12px]">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyCard({ text, actionLabel, onAction }: { text: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card className="flex-row items-center justify-between gap-3 py-3.5">
      <Text variant="muted" className="flex-1">
        {text}
      </Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} className="rounded-full bg-lavender px-3 py-1.5">
        <Text variant="label" color="primary" className="text-[12px]">
          {actionLabel}
        </Text>
      </Pressable>
    </Card>
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
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="caption">{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <HeaderActions />
        </View>
        <Text variant="display" className="mt-2 text-[26px] leading-[32px]" numberOfLines={2}>
          {t(greetingKey(now))}, {firstName}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today's verse in the Bible"
          disabled={!verse}
          onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
          className="mt-5"
        >
          <Card className="gap-2.5 p-5">
            <Text variant="label" color="primary" className="text-[12px]">
              {t('home.verseOfTheDay')}
            </Text>
            <Text variant="scripture" className={lang === 'te' ? 'text-[17px] leading-[28px]' : 'text-[17px] leading-[26px]'}>
              {verse ? verse.text : '…'}
            </Text>
            {verse ? (
              <View className="mt-1 flex-row items-center justify-between">
                <Text variant="caption">{verse.reference}</Text>
                <View className="flex-row items-center gap-1 rounded-full bg-primary py-1.5 pl-3.5 pr-2.5">
                  <Text variant="label" color="cream" className="text-[12px]">
                    {t('home.readChapter')}
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.cream} />
                </View>
              </View>
            ) : null}
          </Card>
        </Pressable>

        <View className="mt-6 flex-row justify-between px-1">
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-70">
              <View className={`h-[54px] w-[54px] items-center justify-center rounded-[18px] ${a.bg}`}>
                <Ionicons name={a.icon} size={22} color={a.fg} />
              </View>
              <Text variant="label" color="ink" className="text-[11px]">
                {t(a.label)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-7 gap-2.5">
          <SectionHeader title={t('home.requests')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/prayer')} />
          {topRequests.length ? (
            topRequests.map((r) => (
              <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })} className="active:opacity-80">
                <Card className="flex-row items-center gap-3 py-3">
                  <Avatar name={r.authorName} size={38} />
                  <View className="flex-1 gap-0.5">
                    <Text variant="label" className="text-[14px]" numberOfLines={2}>
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
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyCard text={loadingRequests ? t('common.loading') : t('home.noRequests')} actionLabel={t('home.shareRequest')} onAction={() => router.push('/prayer/new')} />
          )}
        </View>

        <View className="mt-6 gap-2.5">
          <SectionHeader title={t('home.shared')} actionLabel={t('common.seeAll')} onAction={() => router.push('/(tabs)/resources')} />
          {recent.length ? (
            recent.map((r) => {
              const icon = resourceIcon[r.type];
              return (
                <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/resources/[id]', params: { id: r.id } })} className="active:opacity-80">
                  <Card className="flex-row items-center gap-3 py-3">
                    <View className={`h-10 w-10 items-center justify-center rounded-[14px] ${icon.bg}`}>
                      <Ionicons name={icon.name} size={18} color={icon.fg} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text variant="label" className="text-[14px]" numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text variant="caption">
                        {t(`resources.type.${r.type}` as TranslationKey)} · {r.sharedBy}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Card>
                </Pressable>
              );
            })
          ) : (
            <EmptyCard text={t('home.nothingShared')} actionLabel={t('home.shareSomething')} onAction={() => router.push('/resources/new')} />
          )}
        </View>

        <Card tone="lavender" className="mt-6 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Ionicons name="people" size={20} color={colors.surface} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="caption" color="primary">
              {t('home.nextCall')}
            </Text>
            <Text variant="label" className="text-[14px]" numberOfLines={1}>
              {nextCall ? nextCall.title : t('home.noCall')}
            </Text>
            {nextCall ? (
              <Text variant="caption">{new Date(nextCall.scheduledAt).toLocaleString(locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(nextCall ? { pathname: '/calls/[id]', params: { id: nextCall.id } } : '/(tabs)/community')}
            className="rounded-full bg-primary px-3.5 py-2"
          >
            <Text variant="label" color="cream" className="text-[12px]">
              {nextCall ? (isJoinable(nextCall, now) ? t('home.join') : t('home.view')) : t('common.seeAll')}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}
