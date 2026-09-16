import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
export type TabIcon = { icon: IconName; active: IconName };

type TabRoute = { key: string; name: string };
/** The slice of React Navigation's tab-bar props this bar reads; kept local so the navigator's own types stay out of the UI kit. */
export type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string; href?: unknown } } | undefined>;
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  icons: Record<string, TabIcon>;
};

/**
 * A flat, edge-to-edge bar that sits in the bottom safe area: a hairline on top, icon above label
 * on every tab, and a short purple mark above the active icon.
 */
export function TabBar({ state, descriptors, navigation, icons }: TabBarProps) {
  const insets = useSafeAreaInsets();
  // Only routes with an icon are tabs; hidden routes (the Bible stack) have none.
  const routes = state.routes.filter((r) => r.name in icons && descriptors[r.key]?.options.href !== null);
  return (
    <View className="flex-row border-t border-border bg-surface" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {routes.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        const options = descriptors[route.key]?.options;
        const label = typeof options?.title === 'string' ? options.title : route.name;
        const icon = icons[route.name] ?? { icon: 'ellipse-outline', active: 'ellipse' };
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            className="flex-1 items-center gap-1 pb-1 pt-3"
          >
            <Ionicons name={focused ? icon.active : icon.icon} size={23} color={focused ? colors.primary : colors.muted} />
            <Text variant="label" color={focused ? 'primary' : 'muted'} className="text-[10px] leading-[13px]" style={{ letterSpacing: -0.1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
