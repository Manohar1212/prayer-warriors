import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { notificationsService } from '../../lib/parse';
import { useAuth } from '../auth';
import { registerForPush, usePushResponse } from './push';

let currentToken: string | null = null;

/** Removes this device's push token from the account; call before signing out. */
export async function unregisterThisDevice(): Promise<void> {
  const token = currentToken;
  currentToken = null;
  if (token) await notificationsService.unregisterToken(token).catch(() => undefined);
}

/** Registers the device for push once a member is signed in and routes tapped notifications. */
export function PushRegistrar() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    registerForPush()
      .then((registration) => {
        if (!registration || cancelled) return;
        currentToken = registration.token;
        return notificationsService.registerToken(registration.token, registration.platform, registration.deviceName);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const open = useCallback((route: string) => router.push(route as Href), [router]);
  usePushResponse(open);
  return null;
}
