import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { Avatar } from '../../ui/Avatar';
import { Text } from '../../ui/Text';
import { useAuth } from '../auth';
import { useUnreadCount } from './useNotifications';

/** Bell with unread badge plus the member's avatar; `onDark` flips it for the purple hero. */
export function HeaderActions({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount();
  const name = user?.displayName ?? user?.email ?? '?';
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onPress={() => router.push('/notifications')}
        hitSlop={8}
        className={`h-10 w-10 items-center justify-center rounded-full ${onDark ? 'bg-surface/20' : 'bg-surface'}`}
      >
        <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={20} color={onDark ? colors.surface : colors.primary} />
        {unread ? (
          <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-deep px-1">
            <Text variant="label" color="cream" className="text-[11px]">
              {unread > 9 ? '9+' : String(unread)}
            </Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} hitSlop={8}>
        <View style={onDark ? { borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' } : null}>
          <Avatar name={name} size={40} />
        </View>
      </Pressable>
    </View>
  );
}
