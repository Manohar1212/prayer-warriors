import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { unregisterThisDevice } from '@/features/notifications/PushRegistrar';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const leave = async () => {
    await unregisterThisDevice();
    await signOut();
  };
  const initial = (user?.displayName ?? user?.email ?? '?').trim().charAt(0).toUpperCase();
  return (
    <Screen edges={['bottom']} backdrop className="gap-6 pt-6">
      <View className="flex-row items-center gap-4 border-b border-border pb-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Text variant="title" color="cream" className="text-[26px]">
            {initial}
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text variant="title" className="text-[24px]">{user?.displayName ?? 'Member'}</Text>
          <Text variant="caption">{user?.email}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/notifications/settings')}>
        <View className="flex-row items-center gap-4 border-b border-border pb-5">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-sage">
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="label" className="text-[15px]">
              Notification settings
            </Text>
            <Text variant="muted" className="text-[13px]">
              Choose what the group can reach you about
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
      </Pressable>
      <View className="mt-auto">
        <Button title="Sign out" variant="secondary" onPress={leave} />
      </View>
    </Screen>
  );
}
