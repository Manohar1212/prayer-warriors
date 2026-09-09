import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useBibleLanguage } from '@/features/bible';
import { useUnreadCount } from '@/features/notifications';
import { isJoinable, useCalls } from '@/features/calls';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { categoryLabel, usePrayerRequests } from '@/features/prayer';
import { RESOURCE_TYPES, type Resource } from '@/features/resources';
import { resourcesService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Badge, Card, Screen, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function longDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

const actions: { label: string; icon: IconName; bg: string; fg: string; href: Href }[] = [
  { label: 'Prayer', icon: 'heart', bg: 'bg-blush', fg: colors.roseDeep, href: '/prayer/new' },
  { label: 'Call', icon: 'call', bg: 'bg-sage', fg: colors.primary, href: '/(tabs)/community' },
  { label: 'Song', icon: 'musical-notes', bg: 'bg-honey', fg: colors.gold, href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'Word', icon: 'book', bg: 'bg-primary', fg: colors.cream, href: '/bible' },
];

function prayingLabel(n: number): string {
  if (n === 0) return 'No one praying yet';
  return n === 1 ? '1 praying' : `${n} praying`;
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="title">{title}</Text>
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
  const { user } = useAuth();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  const { requests, loading: loadingRequests } = usePrayerRequests('active');
  const [recent, setRecent] = useState<Resource[]>([]);
  const { next: nextCall } = useCalls();
  const unread = useUnreadCount();
  const firstName = user?.displayName?.split(' ')[0] ?? 'friend';
  const now = new Date();

  const loadRecent = useCallback(() => {
    resourcesService.listRecent(3).then(setRecent).catch(() => setRecent([]));
  }, []);
  useEffect(loadRecent, [loadRecent]);
  useFocusEffect(loadRecent);

  const topRequests = requests.slice(0, 3);

  return (
    <Screen edges={['top']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-7 px-4 pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <View className="flex-row items-center justify-between">
            <Text variant="muted">{longDate(now)}</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
                onPress={() => router.push('/notifications')}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-sage"
              >
                <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={20} color={colors.primary} />
                {unread ? (
                  <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1">
                    <Text variant="label" color="cream" className="text-[11px]">
                      {unread > 9 ? '9+' : String(unread)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => router.push('/profile')}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary"
              >
                <Text variant="title" color="cream">
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>
          <Text variant="display" color="primary">
            {greeting(now)},{'\n'}
            {firstName}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today's verse in the Bible"
          disabled={!verse}
          onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
          className="rounded-[24px] bg-honey px-5 pb-5 pt-5"
        >
          <Text variant="label" color="gold" className="mb-2 text-[12px]">
            {lang === 'te' ? 'ఈ రోజు వాక్యం' : "Today's verse"}
          </Text>
          <Text variant="scripture" className={lang === 'te' ? 'text-[19px] leading-[32px]' : ''}>
            {verse ? verse.text : '…'}
          </Text>
          {verse ? (
            <Text variant="label" color="gold" className="mt-3">
              {verse.reference}
            </Text>
          ) : null}
        </Pressable>

        <View className="gap-3">
          <Text variant="title">Quick actions</Text>
          <View className="flex-row flex-wrap gap-3">
            {actions.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                onPress={() => router.push(a.href)}
                className={`w-[47%] flex-grow flex-row items-center gap-3 rounded-[20px] px-4 py-4 active:opacity-80 ${a.bg}`}
              >
                <Ionicons name={a.icon} size={22} color={a.fg} />
                <Text variant="label" color={a.bg === 'bg-primary' ? 'cream' : 'ink'} className="text-[15px]">
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <SectionHeader title="Prayer requests" actionLabel="See all" onAction={() => router.push('/(tabs)/prayer')} />
          {topRequests.length ? (
            topRequests.map((r) => (
              <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })}>
                <Card className="gap-2">
                  <View className="flex-row flex-wrap gap-2">
                    <Badge label={categoryLabel(r.category)} tone="sage" />
                    {r.urgency === 'urgent' ? <Badge label="Urgent" tone="blush" /> : null}
                  </View>
                  <Text variant="title" className="text-[18px] leading-[24px]">
                    {r.title}
                  </Text>
                  <Text variant="muted" className="text-[13px]">
                    {r.authorName} · {prayingLabel(r.prayingCount)}
                  </Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <Text variant="muted" className="text-[15px] leading-[22px]">
              {loadingRequests ? 'Loading…' : 'No open requests right now. Share what is on your heart.'}
            </Text>
          )}
        </View>

        <View className="gap-3">
          <SectionHeader title="Recently shared" actionLabel="See all" onAction={() => router.push('/(tabs)/resources')} />
          {recent.length ? (
            recent.map((r) => (
              <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/resources/[id]', params: { id: r.id } })}>
                <Card className="flex-row items-center gap-3">
                  <Ionicons
                    name={r.type === 'song' ? 'musical-notes-outline' : r.type === 'scripture' ? 'book-outline' : 'hand-left-outline'}
                    size={20}
                    color={colors.primary}
                  />
                  <View className="flex-1 gap-0.5">
                    <Text variant="label" className="text-[15px]">
                      {r.title}
                    </Text>
                    <Text variant="muted" className="text-[13px]">
                      {RESOURCE_TYPES.find((t) => t.id === r.type)?.label} · {r.sharedBy}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))
          ) : (
            <Text variant="muted" className="text-[15px] leading-[22px]">
              Nothing shared yet. Songs, scripture, and prayers the group shares will appear here.
            </Text>
          )}
        </View>

        <View className="gap-3 rounded-[24px] bg-primary p-6">
          <View className="self-start rounded-full bg-gold-light px-3 py-1">
            <Text variant="label" color="primaryDark" className="text-[12px]">
              Group prayer
            </Text>
          </View>
          <Text variant="title" color="cream">
            {nextCall ? nextCall.title : 'No call scheduled yet'}
          </Text>
          <Text variant="muted" color="creamSoft" className="text-[15px] leading-[22px]">
            {nextCall
              ? new Date(nextCall.scheduledAt).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
              : 'When your admin schedules the next group prayer, the time and a join button will appear here.'}
          </Text>
          {nextCall ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/calls/[id]', params: { id: nextCall.id } })}
              className="mt-1 items-center rounded-[14px] bg-gold-light py-3"
            >
              <Text variant="label" color="primaryDark">
                {isJoinable(nextCall, now) ? 'Join call' : 'View call'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
