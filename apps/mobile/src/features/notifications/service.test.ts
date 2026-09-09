import { createNotificationsService } from './service';
import { DEFAULT_PREFS, withDefaults } from './types';

const rows = [
  { id: 'n1', type: 'prayerRequest', title: 'New prayer request', body: 'Anna: Healing', route: '/prayer/r1', createdAt: '2026-09-09T10:00:00.000Z', readAt: null },
  { id: 'n2', type: 'praying', title: 'Beth is praying for you', body: 'Healing', route: '/prayer/r1', createdAt: '2026-09-09T11:00:00.000Z', readAt: '2026-09-09T11:30:00.000Z' },
  { id: 'n3', type: 'weird', title: 'x', body: '', route: '/(tabs)/funds', createdAt: '2026-09-09T09:00:00.000Z', readAt: null },
  { id: 'n4', type: 'expense', title: 'Expense recorded', body: 'Hall: ₹500', route: '/(tabs)/funds', createdAt: '2026-09-08T09:00:00.000Z', readAt: '2026-09-08T10:00:00.000Z' },
];

function svc(cloudResult: unknown = {}, prefs: Record<string, unknown> | null = null) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  const service = createNotificationsService({
    fetchNotifications: async () => rows,
    countUnread: async () => 2,
    fetchPrefs: async () => prefs,
    cloud,
  });
  return { service, cloud };
}

describe('notificationsService', () => {
  it('lists unread first, newest first within each group, with unknown types mapped safely', async () => {
    const { service } = svc();
    const list = await service.list();
    expect(list.map((n) => n.id)).toEqual(['n1', 'n3', 'n2', 'n4']);
    expect(list[1].type).toBe('prayerRequest');
  });
  it('counts unread', async () => {
    await expect(svc().service.unreadCount()).resolves.toBe(2);
  });
  it('marks selected ids read through the cloud and skips empty lists', async () => {
    const { service, cloud } = svc();
    await service.markRead([]);
    expect(cloud.run).not.toHaveBeenCalled();
    await service.markRead(['n1']);
    expect(cloud.run).toHaveBeenCalledWith('markNotificationsRead', { ids: ['n1'] });
  });
  it('marks all read', async () => {
    const { service, cloud } = svc();
    await service.markAllRead();
    expect(cloud.run).toHaveBeenCalledWith('markAllNotificationsRead');
  });
  it('reads prefs with defaults for missing keys', async () => {
    await expect(svc({}, null).service.getPrefs()).resolves.toEqual(DEFAULT_PREFS);
    await expect(svc({}, { calls: false, bogus: 1 }).service.getPrefs()).resolves.toEqual({ ...DEFAULT_PREFS, calls: false });
  });
  it('updates prefs through the cloud and returns the merged object', async () => {
    const { service, cloud } = svc({ ...DEFAULT_PREFS, funds: false });
    await expect(service.updatePrefs({ funds: false })).resolves.toEqual({ ...DEFAULT_PREFS, funds: false });
    expect(cloud.run).toHaveBeenCalledWith('updateNotificationPrefs', { funds: false });
  });
  it('registers and unregisters push tokens', async () => {
    const { service, cloud } = svc();
    await service.registerToken('ExponentPushToken[x]', 'ios', 'iPhone');
    expect(cloud.run).toHaveBeenCalledWith('registerPushToken', { token: 'ExponentPushToken[x]', platform: 'ios', deviceName: 'iPhone' });
    await service.unregisterToken('ExponentPushToken[x]');
    expect(cloud.run).toHaveBeenCalledWith('unregisterPushToken', { token: 'ExponentPushToken[x]' });
  });
  it('maps cloud errors to friendly messages', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error("That push token isn't valid."), { code: 141 }));
    await expect(service.registerToken('bad', 'ios', '')).rejects.toThrow("That push token isn't valid.");
  });
});

describe('withDefaults', () => {
  it('ignores non-boolean values', () => {
    expect(withDefaults({ prayer: 'no', praying: false })).toEqual({ ...DEFAULT_PREFS, praying: false });
  });
});
