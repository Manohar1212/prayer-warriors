import { mapParseError } from '../auth/errors';
import { withDefaults, type AppNotification, type NotificationsService, type NotificationType, type RawNotification } from './types';

type Deps = {
  fetchNotifications: () => Promise<RawNotification[]>;
  countUnread: () => Promise<number>;
  fetchPrefs: () => Promise<Record<string, unknown> | null>;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
};

const TYPES: NotificationType[] = ['prayerRequest', 'praying', 'answered', 'comment', 'prayerNight', 'prayerNightMoved', 'prayerNightCancelled', 'prayerNightReminder', 'callScheduled', 'callStarted', 'callCancelled', 'resource', 'contribution', 'expense'];

function toNotification(row: RawNotification): AppNotification {
  return {
    id: row.id,
    type: (TYPES as string[]).includes(row.type) ? (row.type as NotificationType) : 'prayerRequest',
    title: row.title,
    body: row.body,
    route: row.route,
    createdAt: row.createdAt,
    readAt: row.readAt ?? null,
  };
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createNotificationsService({ fetchNotifications, countUnread, fetchPrefs, cloud }: Deps): NotificationsService {
  return {
    list: () =>
      guarded(async () => {
        const rows = (await fetchNotifications()).map(toNotification);
        // Unread first, newest first within each group.
        return rows.sort((a, b) => {
          const unreadDiff = Number(Boolean(a.readAt)) - Number(Boolean(b.readAt));
          return unreadDiff !== 0 ? unreadDiff : b.createdAt.localeCompare(a.createdAt);
        });
      }),

    unreadCount: () => guarded(countUnread),

    markRead: (ids) =>
      guarded(async () => {
        if (ids.length) await cloud.run('markNotificationsRead', { ids });
      }),

    markAllRead: () =>
      guarded(async () => {
        await cloud.run('markAllNotificationsRead');
      }),

    clearAll: () =>
      guarded(async () => {
        await cloud.run('clearNotifications');
      }),

    getPrefs: () => guarded(async () => withDefaults(await fetchPrefs())),

    updatePrefs: (patch) => guarded(async () => withDefaults((await cloud.run('updateNotificationPrefs', patch)) as Record<string, unknown>)),

    registerToken: (token, platform, deviceName) =>
      guarded(async () => {
        await cloud.run('registerPushToken', { token, platform, deviceName });
      }),

    unregisterToken: (token) =>
      guarded(async () => {
        await cloud.run('unregisterPushToken', { token });
      }),
  };
}
