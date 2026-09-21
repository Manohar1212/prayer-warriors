import * as Notifications from 'expo-notifications';

import { CHANNEL_ID, ensureChannel } from './push.native';
import type { ReminderCall, ReminderNight } from './reminders';

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

const NIGHT_PREFIX = 'night-';
const REMINDER_DAYS = 7;
const REMINDER_HOUR = 8;
const HOUR_MS = 60 * 60 * 1000;

export async function syncPrayerNightReminders(night: ReminderNight, labels: { daysAway: (days: number) => string; tonight: string; soon: string; body: string }): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return;
    await ensureChannel();

    const now = Date.now();
    const wanted = new Map<string, { title: string; at: Date }>();
    if (night) {
      const start = new Date(night.scheduledAt);
      if (!Number.isNaN(start.getTime())) {
        for (let days = REMINDER_DAYS; days >= 0; days -= 1) {
          const at = new Date(start);
          at.setDate(at.getDate() - days);
          at.setHours(REMINDER_HOUR, 0, 0, 0);
          if (at.getTime() <= now || at.getTime() >= start.getTime()) continue;
          wanted.set(`${NIGHT_PREFIX}${night.id}-d${days}`, { title: days === 0 ? labels.tonight : labels.daysAway(days), at });
        }
        const hourBefore = new Date(start.getTime() - HOUR_MS);
        if (hourBefore.getTime() > now) wanted.set(`${NIGHT_PREFIX}${night.id}-h1`, { title: labels.soon, at: hourBefore });
      }
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existing = new Set<string>();
    for (const item of scheduled) {
      if (!item.identifier.startsWith(NIGHT_PREFIX)) continue;
      // Keep a reminder only if it still says the same thing; renamed or re-worded ones are replaced.
      if (wanted.get(item.identifier)?.title === item.content.title) existing.add(item.identifier);
      else await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }

    for (const [identifier, { title, at }] of wanted) {
      if (existing.has(identifier)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title, body: labels.body, data: { route: '/(tabs)/prayer?tab=monthly' }, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      });
    }
  } catch {
    // Reminders are a convenience; never let them break the prayer screen.
  }
}
