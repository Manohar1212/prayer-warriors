import '../global.css';
import '@/lib/livekitGlobals';

import {
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { NotoSansTelugu_400Regular, NotoSansTelugu_500Medium, NotoSansTelugu_700Bold } from '@expo-google-fonts/noto-sans-telugu';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, resolveGate, useAuth } from '@/features/auth';
import { LanguageProvider, useT } from '@/i18n';
import { PushRegistrar } from '@/features/notifications';
import { parseAuthService } from '@/lib/parse';
import { colors, fonts } from '@/theme/tokens';
import { HeaderBack } from '@/ui/HeaderBack';

SplashScreen.preventAutoHideAsync();

const modalOptions = {
  presentation: 'modal' as const,
  headerShown: true,
  headerStyle: { backgroundColor: colors.cream },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  headerTintColor: colors.primary,
  headerLeft: () => <HeaderBack modal />,
};

/** Pushed screens: our own back control so deep links and web reloads still have a way back. */
const cardOptions = {
  ...modalOptions,
  presentation: 'card' as const,
  headerBackVisible: false,
  headerLeft: () => <HeaderBack />,
};

function GatedStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status, user } = useAuth();
  const t = useT();
  const gate = resolveGate(status, user);
  const ready = fontsLoaded && gate !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      {gate === 'app' ? <PushRegistrar /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={gate === 'auth'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={gate === 'setup'}>
        <Stack.Screen name="account-setup" />
      </Stack.Protected>
      <Stack.Protected guard={gate === 'app'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ ...modalOptions, title: t('profile.title') }} />
        <Stack.Screen name="add-member" options={{ ...modalOptions, title: t('members.add.title') }} />
        <Stack.Screen name="prayer/new" options={{ ...modalOptions, title: t('prayer.new.title') }} />
        <Stack.Screen name="prayer/[id]" options={{ ...cardOptions, title: t('prayer.detail.title') }} />
        <Stack.Screen name="journal/index" options={{ ...cardOptions, title: t('journal.title') }} />
        <Stack.Screen name="journal/entry" options={{ ...modalOptions, title: t('journal.entry.title') }} />
        <Stack.Screen name="resources/new" options={{ ...modalOptions, title: t('resources.new.title') }} />
        <Stack.Screen name="resources/[id]" options={{ ...cardOptions, title: t('resources.detail.title') }} />
        <Stack.Screen name="funds/contribution" options={{ ...modalOptions, title: t('funds.contribution.title') }} />
        <Stack.Screen name="funds/expense" options={{ ...modalOptions, title: t('funds.expense.title') }} />
        <Stack.Screen name="funds/report" options={{ ...cardOptions, title: t('funds.report.title') }} />
        <Stack.Screen name="funds/audit" options={{ ...cardOptions, title: t('funds.audit.title') }} />
        <Stack.Screen name="calls/schedule" options={{ ...modalOptions, title: t('calls.schedule.title') }} />
        <Stack.Screen name="calls/[id]" options={{ ...modalOptions, presentation: 'card', title: t('calls.title'), headerBackVisible: false, headerLeft: () => null, gestureEnabled: false }} />
        <Stack.Screen name="calls/history" options={{ ...cardOptions, title: t('calls.history.title') }} />
        <Stack.Screen name="notifications/index" options={{ ...cardOptions, title: t('notifications.title') }} />
        <Stack.Screen name="notifications/settings" options={{ ...cardOptions, title: t('notifications.settings') }} />
      </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_400Regular_Italic,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    NotoSansTelugu_400Regular,
    NotoSansTelugu_500Medium,
    NotoSansTelugu_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
      <LanguageProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider service={parseAuthService}>
          <GatedStack fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </SafeAreaProvider>
      </LanguageProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
