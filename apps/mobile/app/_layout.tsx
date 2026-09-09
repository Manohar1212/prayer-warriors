import '../global.css';
import '@/lib/livekitGlobals';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, resolveGate, useAuth } from '@/features/auth';
import { PushRegistrar } from '@/features/notifications';
import { parseAuthService } from '@/lib/parse';
import { colors, fonts } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const modalOptions = {
  presentation: 'modal' as const,
  headerShown: true,
  headerStyle: { backgroundColor: colors.cream },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: colors.primary },
  headerTintColor: colors.primary,
};

function GatedStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status, user } = useAuth();
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
        <Stack.Screen name="profile" options={{ ...modalOptions, title: 'Profile' }} />
        <Stack.Screen name="add-member" options={{ ...modalOptions, title: 'Add member' }} />
        <Stack.Screen name="prayer/new" options={{ ...modalOptions, title: 'New request' }} />
        <Stack.Screen name="prayer/[id]" options={{ ...modalOptions, presentation: 'card', title: 'Prayer request' }} />
        <Stack.Screen name="journal/index" options={{ ...modalOptions, presentation: 'card', title: 'My journal' }} />
        <Stack.Screen name="journal/entry" options={{ ...modalOptions, title: 'Journal entry' }} />
        <Stack.Screen name="resources/new" options={{ ...modalOptions, title: 'Share with the group' }} />
        <Stack.Screen name="resources/[id]" options={{ ...modalOptions, presentation: 'card', title: 'Resource' }} />
        <Stack.Screen name="funds/contribution" options={{ ...modalOptions, title: 'Contribution' }} />
        <Stack.Screen name="funds/expense" options={{ ...modalOptions, title: 'Expense' }} />
        <Stack.Screen name="funds/report" options={{ ...modalOptions, presentation: 'card', title: 'Monthly report' }} />
        <Stack.Screen name="funds/audit" options={{ ...modalOptions, presentation: 'card', title: 'Change history' }} />
        <Stack.Screen name="calls/schedule" options={{ ...modalOptions, title: 'Schedule a call' }} />
        <Stack.Screen name="calls/[id]" options={{ ...modalOptions, presentation: 'card', title: 'Group call', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="calls/history" options={{ ...modalOptions, presentation: 'card', title: 'Call history' }} />
        <Stack.Screen name="notifications/index" options={{ ...modalOptions, presentation: 'card', title: 'Notifications' }} />
        <Stack.Screen name="notifications/settings" options={{ ...modalOptions, presentation: 'card', title: 'Notification settings' }} />
      </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider service={parseAuthService}>
          <GatedStack fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
