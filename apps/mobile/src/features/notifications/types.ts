export type NotificationType =
  | 'prayerRequest'
  | 'praying'
  | 'answered'
  | 'callScheduled'
  | 'callStarted'
  | 'callCancelled'
  | 'resource'
  | 'contribution'
  | 'expense';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  route: string;
  createdAt: string;
  readAt: string | null;
};

export type RawNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  route: string;
  createdAt: string;
  readAt: string | null;
};

export const PREF_KEYS = ['prayer', 'praying', 'answered', 'calls', 'resources', 'funds'] as const;
export type PrefKey = (typeof PREF_KEYS)[number];
export type NotificationPrefs = Record<PrefKey, boolean>;

export const DEFAULT_PREFS: NotificationPrefs = { prayer: true, praying: true, answered: true, calls: true, resources: true, funds: true };

export const PREF_LABELS: Record<PrefKey, { title: string; description: string }> = {
  prayer: { title: 'New prayer requests', description: 'When someone shares a request with the group.' },
  praying: { title: 'Someone is praying for you', description: 'When a member taps "I\'m praying" on your request.' },
  answered: { title: 'Answered prayers', description: 'When a request is marked answered.' },
  calls: { title: 'Group calls', description: 'When a call is scheduled, starts, or is cancelled.' },
  resources: { title: 'Songs, scripture and prayers', description: 'When something new is shared in Resources.' },
  funds: { title: 'Funds', description: 'Contributions recorded for you and group expenses.' },
};

export type PushPlatform = 'ios' | 'android';

export type NotificationsService = {
  list(): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
  markRead(ids: string[]): Promise<void>;
  markAllRead(): Promise<void>;
  getPrefs(): Promise<NotificationPrefs>;
  updatePrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs>;
  registerToken(token: string, platform: PushPlatform, deviceName: string): Promise<void>;
  unregisterToken(token: string): Promise<void>;
};

/** Merges stored preferences (possibly partial or missing) over the defaults. */
export function withDefaults(stored: Partial<Record<string, unknown>> | null | undefined): NotificationPrefs {
  const out = { ...DEFAULT_PREFS };
  if (stored) {
    for (const key of PREF_KEYS) {
      if (typeof stored[key] === 'boolean') out[key] = stored[key] as boolean;
    }
  }
  return out;
}
