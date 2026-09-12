import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useBibleLanguage } from '@/features/bible';
import { isJoinable, useCalls } from '@/features/calls';
import { useVerseOfTheDay } from '@/features/home/useVerseOfTheDay';
import { useUnreadCount } from '@/features/notifications';
import { usePrayerRequests } from '@/features/prayer';
import { RESOURCE_TYPES, type Resource } from '@/features/resources';
import { resourcesService } from '@/lib/parse';
import { timeAgoShort } from '@/lib/time';
import { colors, gradients } from '@/theme/tokens';
import { Avatar, Badge, Card, Screen, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function longDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const actions: { label: string; icon: IconName; bg: string; fg: string; href: Href }[] = [
  { label: 'Prayer', icon: 'heart', bg: 'bg-blush', fg: colors.roseDeep, href: '/prayer/new' },
  { label: 'Call', icon: 'call', bg: 'bg-lavender', fg: colors.primary, href: '/(tabs)/community' },
  { label: 'Songs', icon: 'musical-notes', bg: 'bg-sage', fg: colors.leaf, href: { pathname: '/resources/new', params: { type: 'song' } } },
  { label: 'Word', icon: 'book', bg: 'bg-honey', fg: colors.gold, href: '/bible' },
];

const resourceIcon: Record<Resource['type'], { name: IconName; bg: string; fg: string }> = {
  song: { name: 'musical-notes', bg: 'bg-lavender', fg: colors.primary },
  scripture: { name: 'book', bg: 'bg-sage', fg: colors.leaf },
  prayer: { name: 'hand-left', bg: 'bg-honey', fg: colors.gold },
};

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="title" className="text-[20px]">
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
  const { user } = useAuth();
  const [lang] = useBibleLanguage();
  const verse = useVerseOfTheDay(lang);
  const { requests, loading: loadingRequests } = usePrayerRequests('active');
  const [recent, setRecent] = useState<Resource[]>([]);
  const { next: nextCall } = useCalls();
  const unread = useUnreadCount();
  const name = user?.displayName ?? 'friend';
  const firstName = name.split(' ')[0];
  const now = new Date();

  const loadRecent = useCallback(() => {
    resourcesService.listRecent(3).then(setRecent).catch(() => setRecent([]));
  }, []);
  useEffect(loadRecent, [loadRecent]);
  useFocusEffect(loadRecent);

  const topRequests = requests.slice(0, 3);

  return (
    <Screen edges={['top']} className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-6 px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-0.5 pr-3">
            <Text variant="title" className="text-[26px] leading-[32px]">
              {greeting(now)}, {firstName}!
            </Text>
            <Text variant="caption">{longDate(now)}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              onPress={() => router.push('/notifications')}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            >
              <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={20} color={colors.primary} />
              {unread ? (
                <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-deep px-1">
                  <Text variant="label" color="cream" className="text-[11px]">
                    {unread > 9 ? '9+' : String(unread)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} hitSlop={8}>
              <Avatar name={name} size={40} />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today's verse in the Bible"
          disabled={!verse}
          onPress={() => verse && router.push({ pathname: '/bible/[book]/[chapter]', params: { book: String(verse.bookId), chapter: String(verse.chapter) } })}
        >
          <LinearGradient colors={[...gradients.verse]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 20 }}>
            <Text variant="caption" color="primary" className="mb-2">
              {lang === 'te' ? 'ఈ రోజు వాక్యం' : 'Verse of the day'}
            </Text>
            <Text variant="scripture" className={lang === 'te' ? 'text-[19px] leading-[32px]' : 'text-[20px] leading-[30px]'}>
              {verse ? `“${verse.text}”` : '…'}
            </Text>
            {verse ? (
              <Text variant="label" color="muted" className="mt-3 text-[13px]">
                {verse.reference}
              </Text>
            ) : null}
          </LinearGradient>
        </Pressable>

        <View className="flex-row justify-between px-1">
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} className="items-center gap-2 active:opacity-80">
              <View className={`h-14 w-14 items-center justify-center rounded-full ${a.bg}`}>
                <Ionicons name={a.icon} size={22} color={a.fg} />
              </View>
              <Text variant="caption" color="ink">
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          <SectionHeader title="Prayer requests" actionLabel="See all" onAction={() => router.push('/(tabs)/prayer')} />
          {topRequests.length ? (
            <Card className="py-1">
              {topRequests.map((r, i) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/prayer/[id]', params: { id: r.id } })}
                  className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <Avatar name={r.authorName} size={36} />
                  <View className="flex-1 gap-1">
                    <Text variant="label" className="text-[15px]" numberOfLines={1}>
                      {r.title}
                    </Text>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text variant="caption">
                        {r.authorName} · {timeAgoShort(r.createdAt)}
                      </Text>
                      {r.urgency === 'urgent' ? <Badge label="Urgent" tone="blush" /> : null}
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
            <Text variant="muted" className="text-[15px] leading-[22px]">
              {loadingRequests ? 'Loading…' : 'No open requests right now. Share what is on your heart.'}
            </Text>
          )}
        </View>

        <View className="gap-3">
          <SectionHeader title="Recently shared" actionLabel="See all" onAction={() => router.push('/(tabs)/resources')} />
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
                        {RESOURCE_TYPES.find((t) => t.id === r.type)?.label} · {r.sharedBy}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                );
              })}
            </Card>
          ) : (
            <Text variant="muted" className="text-[15px] leading-[22px]">
              Nothing shared yet. Songs, scripture, and prayers the group shares will appear here.
            </Text>
          )}
        </View>

        <LinearGradient colors={[...gradients.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 18 }}>
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface/20">
              <Ionicons name="people" size={22} color={colors.surface} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="caption" color="creamSoft">
                Next group prayer
              </Text>
              <Text variant="label" color="cream" className="text-[16px]">
                {nextCall ? nextCall.title : 'No call scheduled yet'}
              </Text>
              <Text variant="caption" color="creamSoft">
                {nextCall
                  ? new Date(nextCall.scheduledAt).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
                  : 'Your admin will schedule the next one.'}
              </Text>
            </View>
            {nextCall ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/calls/[id]', params: { id: nextCall.id } })}
                className="rounded-full bg-surface px-4 py-2"
              >
                <Text variant="label" color="primary" className="text-[13px]">
                  {isJoinable(nextCall, now) ? 'Join' : 'View'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </LinearGradient>
      </ScrollView>
    </Screen>
  );
}
