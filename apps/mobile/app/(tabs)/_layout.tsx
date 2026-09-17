import { Tabs } from 'expo-router';

import { useT, type TranslationKey } from '@/i18n';

import { colors } from '@/theme/tokens';
import { TabBar, type TabBarProps, type TabIcon } from '@/ui/TabBar';

const tabs: { name: string; title: TranslationKey; icons: TabIcon }[] = [
  { name: 'index', title: 'tab.home', icons: { icon: 'home-outline', active: 'home' } },
  { name: 'prayer', title: 'tab.prayer', icons: { pray: true } },
  { name: 'community', title: 'tab.community', icons: { icon: 'people-outline', active: 'people' } },
  { name: 'resources', title: 'tab.resources', icons: { icon: 'book-outline', active: 'book' } },
  { name: 'funds', title: 'tab.funds', icons: { icon: 'wallet-outline', active: 'wallet' } },
];

const icons = Object.fromEntries(tabs.map((t) => [t.name, t.icons])) as Record<string, TabIcon>;

export default function TabsLayout() {
  const t = useT();
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
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: t(tab.title) }} />
      ))}
      {/* Reachable only by navigation; registered last so it never becomes the initial route. */}
      <Tabs.Screen name="bible" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
