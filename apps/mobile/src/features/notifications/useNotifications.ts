import { useCallback } from 'react';

import { notificationsService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import type { AppNotification } from './types';

export type NotificationsState = {
  items: AppNotification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export function useNotifications(): NotificationsState {
  const { data, loading, error, refresh, setData } = useCachedQuery<AppNotification[]>('notifications', () => notificationsService.list(), { fallback: 'Could not load notifications.' });

  const markRead = useCallback(
    async (id: string) => {
      const when = new Date().toISOString();
      setData((current) => (current ?? []).map((n) => (n.id === id && !n.readAt ? { ...n, readAt: when } : n)));
      await notificationsService.markRead([id]).catch(() => undefined);
    },
    [setData],
  );

  const markAllRead = useCallback(async () => {
    const when = new Date().toISOString();
    setData((current) => (current ?? []).map((n) => (n.readAt ? n : { ...n, readAt: when })));
    await notificationsService.markAllRead().catch(() => undefined);
  }, [setData]);

  return { items: data ?? [], loading, error, refresh, markRead, markAllRead };
}

/** Unread badge count; refreshes whenever the host screen gains focus. */
export function useUnreadCount(): number {
  const { data } = useCachedQuery<number>('notifications:unread', () => notificationsService.unreadCount());
  return data ?? 0;
}
