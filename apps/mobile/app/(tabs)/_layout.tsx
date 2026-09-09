import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const tabs: { name: string; title: string; icon: IconName; active: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', active: 'home' },
  { name: 'prayer', title: 'Prayer', icon: 'heart-outline', active: 'heart' },
  { name: 'community', title: 'Community', icon: 'people-outline', active: 'people' },
  { name: 'resources', title: 'Resources', icon: 'book-outline', active: 'book' },
  { name: 'funds', title: 'Funds', icon: 'wallet-outline', active: 'wallet' },
];

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 24, color: colors.primary },
        headerLeftContainerStyle: { paddingLeft: 8 },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/profile')}
            hitSlop={8}
            style={{ marginRight: 20 }}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </Pressable>
        ),
        sceneStyle: { backgroundColor: colors.cream },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="bible" options={{ href: null, headerShown: false }} />
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.name !== 'index',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.active : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
