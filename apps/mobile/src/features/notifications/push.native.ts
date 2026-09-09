import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { colors } from '../../theme/tokens';
import type { PushRegistration } from './push';

export const CHANNEL_ID = 'default';

// Show notifications that arrive while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId(): string | null {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEas = Constants.easConfig?.projectId;
  const id = typeof fromConfig === 'string' ? fromConfig : fromEas;
  return typeof id === 'string' && id ? id : null;
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Prayer Warriors',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.gold,
  });
}

export async function hasPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  return asked.status === 'granted';
}

export async function registerForPush(): Promise<PushRegistration | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  await ensureChannel();
  if (!(await hasPermission())) return null;
  const id = projectId();
  // Without an EAS project id the token API throws; push simply stays off until the owner runs `eas init`.
  if (!id) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  return { token: data, platform: Platform.OS, deviceName: Device.deviceName ?? Device.modelName ?? '' };
}

export function usePushResponse(onRoute: (route: string) => void): void {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const route = response.notification.request.content.data?.route;
    if (typeof route === 'string' && route.startsWith('/')) onRoute(route);
  }, [response, onRoute]);
}
