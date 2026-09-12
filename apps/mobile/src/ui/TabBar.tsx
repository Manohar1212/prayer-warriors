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
 * A floating white pill instead of the stock bar. The active tab expands into a lavender pill
 * with its label; the rest stay as quiet icons.
 */
export function TabBar({ state, descriptors, navigation, icons }: TabBarProps) {
  const insets = useSafeAreaInsets();
  // Only routes with an icon are tabs; hidden routes (the Bible stack) have none.
  const routes = state.routes.filter((r) => r.name in icons && descriptors[r.key]?.options.href !== null);
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), pointerEvents: 'box-none' }}>
      <View
        className="flex-row items-center rounded-full bg-surface px-2 py-2"
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
              className={`h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${focused ? 'bg-lavender' : ''}`}
            >
              <Ionicons name={focused ? icon.active : icon.icon} size={22} color={focused ? colors.primary : colors.muted} />
              {focused ? (
                <Text variant="label" color="primary" className="text-[13px]">
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
