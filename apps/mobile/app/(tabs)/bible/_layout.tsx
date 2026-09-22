import { Stack } from 'expo-router';

import { useT } from '@/i18n';
import { colors, fonts } from '@/theme/tokens';

/** The Bible lives inside the tab navigator so the tab bar stays visible while reading. */
export default function BibleLayout() {
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bloom },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.ink },
        headerTintColor: colors.primary,
        // Just the arrow: the previous screen's name beside it repeated the title.
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('bible.title') }} />
      <Stack.Screen name="search" options={{ title: t('bible.search') }} />
      <Stack.Screen name="[book]/index" options={{ title: '' }} />
      <Stack.Screen name="[book]/[chapter]" options={{ title: '' }} />
    </Stack>
  );
}
