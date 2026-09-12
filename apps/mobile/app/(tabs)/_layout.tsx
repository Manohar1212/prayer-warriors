import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';
import { TabBar, type TabBarProps, type TabIcon } from '@/ui/TabBar';

const tabs: { name: string; title: string; icons: TabIcon }[] = [
  { name: 'index', title: 'Home', icons: { icon: 'home-outline', active: 'home' } },
  { name: 'prayer', title: 'Prayer', icons: { icon: 'heart-outline', active: 'heart' } },
  { name: 'community', title: 'Community', icons: { icon: 'people-outline', active: 'people' } },
  { name: 'resources', title: 'Resources', icons: { icon: 'book-outline', active: 'book' } },
  { name: 'funds', title: 'Funds', icons: { icon: 'wallet-outline', active: 'wallet' } },
];

const icons = Object.fromEntries(tabs.map((t) => [t.name, t.icons])) as Record<string, TabIcon>;

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <TabBar {...(props as unknown as Omit<TabBarProps, 'icons'>)} icons={icons} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
      {/* Reachable only by navigation; registered last so it never becomes the initial route. */}
      <Tabs.Screen name="bible" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
