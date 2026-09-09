import { Stack } from 'expo-router';

import { colors, fonts } from '@/theme/tokens';

/** The Bible lives inside the tab navigator so the tab bar stays visible while reading. */
export default function BibleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: colors.primary },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bible' }} />
      <Stack.Screen name="search" options={{ title: 'Search the Bible' }} />
      <Stack.Screen name="[book]/index" options={{ title: '' }} />
      <Stack.Screen name="[book]/[chapter]" options={{ title: '' }} />
    </Stack>
  );
}
