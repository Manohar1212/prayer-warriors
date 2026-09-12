import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { useNotifications, type AppNotification, type NotificationType } from '@/features/notifications';
import { timeAgo } from '@/lib/time';
import { colors } from '@/theme/tokens';
import { Screen, Text } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

const icons: Record<NotificationType, { name: IconName; bg: string; fg: string }> = {
  prayerRequest: { name: 'heart', bg: 'bg-blush', fg: colors.roseDeep },
  praying: { name: 'hand-left', bg: 'bg-blush', fg: colors.roseDeep },
  answered: { name: 'sparkles', bg: 'bg-honey', fg: colors.gold },
  callScheduled: { name: 'calendar', bg: 'bg-lavender', fg: colors.primary },
  callStarted: { name: 'call', bg: 'bg-lavender', fg: colors.primary },
  callCancelled: { name: 'call-outline', bg: 'bg-lavender', fg: colors.primary },
  resource: { name: 'book', bg: 'bg-sky', fg: colors.skyDeep },
  contribution: { name: 'wallet', bg: 'bg-sage', fg: colors.leaf },
  expense: { name: 'receipt', bg: 'bg-honey', fg: colors.gold },
};

function Row({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const icon = icons[item.type];
  const unread = !item.readAt;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.body}`} onPress={onPress} className={`flex-row gap-4 py-4 ${unread ? '' : 'opacity-70'}`}>
        <View className={`h-10 w-10 items-center justify-center rounded-full ${icon.bg}`}>
          <Ionicons name={icon.name} size={18} color={icon.fg} />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text variant="label" color={unread ? 'ink' : 'muted'} className="flex-1 text-[15px]">
              {item.title}
            </Text>
            {unread ? <View accessibilityLabel="Unread" className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
          </View>
          {item.body ? (
            <Text variant="body" color={unread ? 'ink' : 'muted'} className="text-[15px] leading-[22px]">
              {item.body}
            </Text>
          ) : null}
          <Text variant="caption" className="text-[12px]">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
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
      <ScrollView contentContainerClassName="px-4 pb-8 pt-3" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between border-b border-border pb-3">
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
          <View className="mt-10 gap-2">
            <Text variant="title">{loading ? 'Loading…' : "You're all caught up"}</Text>
            {!loading ? <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">New requests, calls, and shares from the group will show up here.</Text> : null}
          </View>
        ) : (
          items.map((item, i) => (
            <View key={item.id} className={i > 0 ? 'border-t border-border' : ''}>
              <Row item={item} onPress={() => open(item)} />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
