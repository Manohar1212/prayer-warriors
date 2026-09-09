import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { Text } from '../../ui/Text';

type Crumb = { label: string; href: Href };

/** Breadcrumb-style links so a reader can always move up, even when opened from a deep link. */
export function BibleNav({ crumbs }: { crumbs: Crumb[] }) {
  const router = useRouter();
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      {crumbs.map((c, i) => (
        <View key={c.label} className="flex-row items-center gap-1">
          {i > 0 ? <Ionicons name="chevron-forward" size={14} color={colors.muted} /> : null}
          <Pressable accessibilityRole="link" onPress={() => router.navigate(c.href)} hitSlop={6} className="py-1">
            <Text variant="label" color="primary" className="text-[13px]">
              {c.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/** Header-left control shown only when the stack has nothing to go back to (deep links). */
export function HeaderHome() {
  const router = useRouter();
  const navigation = useNavigation();
  if (navigation.canGoBack()) return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Go to Home" onPress={() => router.replace('/(tabs)')} hitSlop={8} style={{ paddingHorizontal: 8 }}>
      <Ionicons name="home-outline" size={22} color={colors.primary} />
    </Pressable>
  );
}
