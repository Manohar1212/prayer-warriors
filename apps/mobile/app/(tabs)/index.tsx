import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { colors } from '@/theme/tokens';
import { Rule, Screen, Text } from '@/ui';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function longDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? 'friend';
  const now = new Date();

  return (
    <Screen scroll className="gap-10 pt-6">
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text variant="muted">{longDate(now)}</Text>
          <Text variant="display" color="primary">
            {greeting(now)},{'\n'}
            {firstName}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push('/profile')}
          hitSlop={8}
          className="mt-1"
        >
          <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
        </Pressable>
      </View>

      <View className="gap-4">
        <Rule />
        <Text variant="scripture" className="max-w-[320px]">
          “The prayer of a righteous person is powerful and effective.”
        </Text>
        <Text variant="muted">James 5:16</Text>
      </View>

      <View className="gap-2">
        <Text variant="title">Your group is being set up</Text>
        <Text variant="muted" className="max-w-[320px] text-[15px] leading-[22px]">
          Prayer requests, group calls, and shared songs and scripture will appear here as
          they are added.
        </Text>
      </View>
    </Screen>
  );
}
