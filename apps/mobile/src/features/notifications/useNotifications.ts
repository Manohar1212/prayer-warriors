import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { notificationsService } from '../../lib/parse';
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
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await notificationsService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const markRead = useCallback(async (id: string) => {
    const when = new Date().toISOString();
    setItems((current) => current.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: when } : n)));
    await notificationsService.markRead([id]).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    const when = new Date().toISOString();
    setItems((current) => current.map((n) => (n.readAt ? n : { ...n, readAt: when })));
    await notificationsService.markAllRead().catch(() => undefined);
  }, []);

  return { items, loading, error, refresh: load, markRead, markAllRead };
}

/** Unread badge count; refreshes whenever the host screen gains focus. */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    notificationsService
      .unreadCount()
      .then(setCount)
      .catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  useFocusEffect(load);
  return count;
}
