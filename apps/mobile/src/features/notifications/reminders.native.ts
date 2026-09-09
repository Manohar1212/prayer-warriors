import * as Notifications from 'expo-notifications';

import { CHANNEL_ID, ensureChannel } from './push.native';
import type { ReminderCall } from './reminders';

const LEAD_MS = 10 * 60 * 1000;
const PREFIX = 'call-';

export async function syncCallReminders(upcoming: ReminderCall[]): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return;
    await ensureChannel();

    const now = Date.now();
    const wanted = new Map<string, { call: ReminderCall; at: Date }>();
    for (const call of upcoming) {
      if (call.status !== 'scheduled') continue;
      const at = new Date(new Date(call.scheduledAt).getTime() - LEAD_MS);
      if (Number.isNaN(at.getTime()) || at.getTime() <= now) continue;
      wanted.set(`${PREFIX}${call.id}`, { call, at });
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existing = new Set<string>();
    for (const item of scheduled) {
      if (!item.identifier.startsWith(PREFIX)) continue;
      if (wanted.has(item.identifier)) existing.add(item.identifier);
      else await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }

    for (const [identifier, { call, at }] of wanted) {
      if (existing.has(identifier)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title: 'Group call in 10 minutes', body: call.title, data: { route: `/calls/${call.id}` }, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      });
    }
  } catch {
    // Reminders are a convenience; never let them break the calls screen.
  }
}
