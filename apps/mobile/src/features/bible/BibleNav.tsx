import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { goBackOr } from '../../lib/navigation';
import { colors } from '../../theme/tokens';
import { Chevron } from '../../ui/Chevron';
import { Text } from '../../ui/Text';
import { useT } from '../../i18n';

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
/** The Bible opens from Home and from Resources; the arrow returns to whichever one opened it. */
export function HeaderHome() {
  const router = useRouter();
  const t = useT();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const back = () => {
    if (from === 'resources') router.navigate('/(tabs)/resources');
    else if (from === 'home') router.navigate('/(tabs)');
    else goBackOr(router, '/(tabs)');
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={back} hitSlop={10} style={{ paddingHorizontal: 8 }}>
      <Chevron size={24} color={colors.ink} />
    </Pressable>
  );
}
