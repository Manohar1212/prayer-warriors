import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { colors } from '@/theme/tokens';
import { Screen, Text } from '@/ui';

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
  { label: 'Prayer', icon: 'heart', bg: 'bg-blush', fg: colors.roseDeep, href: '/(tabs)/prayer' },
  { label: 'Call', icon: 'call', bg: 'bg-sage', fg: colors.primary, href: '/(tabs)/community' },
  { label: 'Song', icon: 'musical-notes', bg: 'bg-honey', fg: colors.gold, href: '/(tabs)/resources' },
  { label: 'Word', icon: 'book', bg: 'bg-primary', fg: colors.cream, href: '/(tabs)/resources' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? 'friend';
  const now = new Date();

  return (
    <Screen scroll backdrop className="gap-8 pt-6">
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
          className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-primary"
        >
          <Text variant="title" color="cream">
            {firstName.charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <View className="rounded-[24px] bg-honey px-6 pb-6 pt-5">
        <Text variant="scripture" className="max-w-[300px]">
          “The prayer of a righteous person is powerful and effective.”
        </Text>
        <Text variant="label" color="gold" className="mt-3">
          James 5:16
        </Text>
      </View>

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

      <View className="gap-4 rounded-[24px] bg-primary p-6">
        <View className="self-start rounded-full bg-gold-light px-3 py-1">
          <Text variant="label" color="primaryDark" className="text-[12px]">
            Group prayer
          </Text>
        </View>
        <Text variant="title" color="cream">
          No call scheduled yet
        </Text>
        <Text variant="muted" color="creamSoft" className="text-[15px] leading-[22px]">
          When your admin sets the first group prayer, the time and a join button will appear here.
        </Text>
      </View>
    </Screen>
  );
}
