import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { useNotifications, type AppNotification, type NotificationType } from '@/features/notifications';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<NotificationType, { name: IconName; bg: string; fg: string }> = {
  prayerRequest: { name: 'heart', bg: 'bg-blush', fg: colors.roseDeep },
  praying: { name: 'hand-left', bg: 'bg-blush', fg: colors.roseDeep },
  answered: { name: 'sparkles', bg: 'bg-honey', fg: colors.gold },
  callScheduled: { name: 'calendar', bg: 'bg-sage', fg: colors.primary },
  callStarted: { name: 'call', bg: 'bg-sage', fg: colors.primary },
  callCancelled: { name: 'call-outline', bg: 'bg-sage', fg: colors.primary },
  resource: { name: 'book', bg: 'bg-honey', fg: colors.gold },
  contribution: { name: 'wallet', bg: 'bg-honey', fg: colors.gold },
  expense: { name: 'receipt', bg: 'bg-honey', fg: colors.gold },
};

export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Row({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const icon = icons[item.type];
  const unread = !item.readAt;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.body}`} onPress={onPress}>
      <Card className={`flex-row gap-4 ${unread ? '' : 'opacity-70'}`}>
        <View className={`h-11 w-11 items-center justify-center rounded-full ${icon.bg}`}>
          <Ionicons name={icon.name} size={20} color={icon.fg} />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text variant="label" color={unread ? 'ink' : 'muted'} className="flex-1 text-[15px]">
              {item.title}
            </Text>
            {unread ? <View accessibilityLabel="Unread" className="mt-1.5 h-2.5 w-2.5 rounded-full bg-gold" /> : null}
          </View>
          {item.body ? (
            <Text variant="body" color={unread ? 'ink' : 'muted'} className="text-[15px] leading-[22px]">
              {item.body}
            </Text>
          ) : null}
          <Text variant="muted" className="text-[12px]">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { items, loading, error, markRead, markAllRead } = useNotifications();
  const unread = items.filter((n) => !n.readAt).length;

  const open = (item: AppNotification) => {
    markRead(item.id);
    if (item.route) router.push(item.route as Href);
  };

  return (
    <Screen edges={['bottom']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-3 px-6 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="muted">{unread === 0 ? 'Nothing new' : unread === 1 ? '1 new' : `${unread} new`}</Text>
          <View className="flex-row items-center gap-5">
            {unread > 0 ? (
              <Pressable accessibilityRole="button" onPress={markAllRead} hitSlop={8}>
                <Text variant="label" color="primary" className="text-[13px]">
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Notification settings" onPress={() => router.push('/notifications/settings')} hitSlop={8}>
              <Ionicons name="options-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <Text variant="body" color="roseDeep">
            {error}
          </Text>
        ) : null}

        {items.length === 0 ? (
          <Card tone="sage" className="items-center gap-2 py-8">
            <Ionicons name="notifications-off-outline" size={28} color={colors.primary} />
            <Text variant="title" color="primary">
              {loading ? 'Loading…' : "You're all caught up"}
            </Text>
            {!loading ? <Text variant="muted" className="text-center">New requests, calls, and shares from the group will show up here.</Text> : null}
          </Card>
        ) : (
          items.map((item) => <Row key={item.id} item={item} onPress={() => open(item)} />)
        )}
      </ScrollView>
    </Screen>
  );
}
