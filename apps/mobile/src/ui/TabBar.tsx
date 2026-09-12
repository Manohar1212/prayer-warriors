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
 * A floating white bar instead of the stock one: icon above label on every tab, with a lavender
 * pill behind the active icon.
 */
export function TabBar({ state, descriptors, navigation, icons }: TabBarProps) {
  const insets = useSafeAreaInsets();
  // Only routes with an icon are tabs; hidden routes (the Bible stack) have none.
  const routes = state.routes.filter((r) => r.name in icons && descriptors[r.key]?.options.href !== null);
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), pointerEvents: 'box-none' }}>
      <View
        className="flex-row items-center rounded-[28px] bg-surface px-2 py-2"
        style={{ boxShadow: '0 10px 30px rgba(62, 42, 124, 0.16)' }}
      >
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
              className="flex-1 items-center gap-1 py-1"
            >
              <View className={`h-8 w-14 items-center justify-center rounded-full ${focused ? 'bg-lavender' : ''}`}>
                <Ionicons name={focused ? icon.active : icon.icon} size={22} color={focused ? colors.primary : colors.muted} />
              </View>
              <Text variant="label" color={focused ? 'primary' : 'muted'} className="text-[11px] leading-[14px]">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
