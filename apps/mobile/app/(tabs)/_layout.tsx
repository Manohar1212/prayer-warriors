import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { useUnreadCount } from '@/features/notifications';
import { colors, fonts } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const tabs: { name: string; title: string; icon: IconName; active: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', active: 'home' },
  { name: 'prayer', title: 'Prayer', icon: 'heart-outline', active: 'heart' },
  { name: 'community', title: 'Community', icon: 'people-outline', active: 'people' },
  { name: 'resources', title: 'Resources', icon: 'book-outline', active: 'book' },
  { name: 'funds', title: 'Funds', icon: 'wallet-outline', active: 'wallet' },
];

function BellButton() {
  const router = useRouter();
  const unread = useUnreadCount();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={{ marginRight: 16 }}
    >
      <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={26} color={colors.primary} />
      {unread ? (
        <View
          style={{ position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}
        >
          <Text style={{ color: colors.cream, fontFamily: fonts.sansSemiBold, fontSize: 11 }}>{unread > 9 ? '9+' : String(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 24, color: colors.primary },
        headerLeftContainerStyle: { paddingLeft: 8 },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BellButton />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push('/profile')}
              hitSlop={8}
              style={{ marginRight: 20 }}
            >
              <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
            </Pressable>
          </View>
        ),
        sceneStyle: { backgroundColor: colors.cream },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2 },
      }}
    >
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
      <Tabs.Screen name="bible" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
