const { createNotifier, createNotificationHandlers, buildMessage, MESSAGES, DEFAULT_PREFS } = require('./notifications');

const NOW = new Date('2026-09-09T10:00:00.000Z');

function user(id, displayName = `Name ${id}`, notificationPrefs) {
  return { id, displayName, notificationPrefs };
}

function deps({ memberIds = ['a', 'b', 'c'], users = [user('a', 'Anna'), user('b', 'Beth'), user('c', 'Cara')], tokens = [], tickets } = {}) {
  return {
    members: { listActiveUserIds: jest.fn(async () => memberIds) },
    users: { findMany: jest.fn(async (ids) => users.filter((u) => ids.includes(u.id))) },
    inbox: { createMany: jest.fn(async (rows) => rows.map((r, i) => ({ id: `n${i}`, ...r }))) },
    tokens: {
      forUsers: jest.fn(async (ids) => tokens.filter((t) => ids.includes(t.userId))),
      remove: jest.fn(async () => undefined),
    },
    push: { send: jest.fn(async (messages) => tickets ?? messages.map(() => ({ status: 'ok', id: 't' }))) },
    now: () => NOW,
    log: jest.fn(),
  };
}

const requestEvent = { type: 'prayerRequest', groupId: 'g1', actorId: 'a', requestId: 'r1', title: 'Healing for mum' };

describe('buildMessage', () => {
  it.each([
    [requestEvent, 'Anna', { title: 'New prayer request', body: 'Anna: Healing for mum', route: '/prayer/r1', pref: 'prayer' }],
    [{ type: 'praying', requestId: 'r1', title: 'Healing for mum' }, 'Beth', { title: 'Beth is praying for you', body: 'Healing for mum', route: '/prayer/r1', pref: 'praying' }],
    [{ type: 'answered', requestId: 'r1', title: 'Healing for mum' }, 'Anna', { title: 'Prayer answered', body: 'Healing for mum', route: '/prayer/r1', pref: 'answered' }],
    [{ type: 'comment', requestId: 'r1', title: 'Healing for mum', body: 'Praying with you tonight' }, 'Beth', { title: 'Beth commented on your request', body: 'Praying with you tonight', route: '/prayer/r1', pref: 'praying' }],
    [
      { type: 'callScheduled', callId: 'c1', title: 'Evening prayer', scheduledAt: '2026-09-09T14:30:00.000Z' },
      'Anna',
      { title: 'Group call scheduled', body: 'Evening prayer · Wed 9 Sep, 8:00 pm', route: '/calls/c1', pref: 'calls' },
    ],
    [{ type: 'callStarted', callId: 'c1', title: 'Evening prayer' }, 'Anna', { title: 'Anna started the call', body: 'Evening prayer — join now', route: '/calls/c1', pref: 'calls' }],
    [{ type: 'callCancelled', callId: 'c1', title: 'Evening prayer' }, 'Anna', { title: 'Call cancelled', body: 'Evening prayer', route: '/(tabs)/community', pref: 'calls' }],
    [{ type: 'resource', resourceId: 's1', resourceType: 'song', title: 'Amazing Grace' }, 'Anna', { title: 'New song shared', body: 'Amazing Grace', route: '/resources/s1', pref: 'resources' }],
    [{ type: 'resource', resourceId: 's2', resourceType: 'scripture', title: 'Psalm 23' }, 'Anna', { title: 'New scripture shared', body: 'Psalm 23', route: '/resources/s2', pref: 'resources' }],
    [{ type: 'resource', resourceId: 's3', resourceType: 'prayer', title: 'Morning prayer' }, 'Anna', { title: 'New prayer shared', body: 'Morning prayer', route: '/resources/s3', pref: 'resources' }],
    [
      { type: 'contribution', memberId: 'b', amountPaise: 125000, transactionDate: '2026-09-01T00:00:00.000Z' },
      'Anna',
      { title: 'Contribution recorded', body: '₹1,250 on 1 Sep 2026', route: '/(tabs)/funds', pref: 'funds' },
    ],
    [{ type: 'expense', category: 'hall', amountPaise: 350050 }, 'Anna', { title: 'Expense recorded', body: 'Hall: ₹3,500.50', route: '/(tabs)/funds', pref: 'funds' }],
  ])('formats %o', (event, actorName, expected) => {
    expect(buildMessage(event, actorName)).toEqual(expected);
  });

  it('falls back to "A member" when the actor has no name', () => {
    expect(buildMessage(requestEvent, null).body).toBe('A member: Healing for mum');
  });
});

describe('notify', () => {
  it('writes one inbox row per member except the actor', async () => {
    const d = deps();
    await createNotifier(d).notify(requestEvent);
    expect(d.inbox.createMany).toHaveBeenCalledWith([
      { groupId: 'g1', recipientId: 'b', actorId: 'a', type: 'prayerRequest', title: 'New prayer request', body: 'Anna: Healing for mum', route: '/prayer/r1' },
      { groupId: 'g1', recipientId: 'c', actorId: 'a', type: 'prayerRequest', title: 'New prayer request', body: 'Anna: Healing for mum', route: '/prayer/r1' },
    ]);
  });

  it('skips members who turned the kind off', async () => {
    const d = deps({ users: [user('a', 'Anna'), user('b', 'Beth', { prayer: false }), user('c', 'Cara', { praying: false })] });
    await createNotifier(d).notify(requestEvent);
    expect(d.inbox.createMany.mock.calls[0][0].map((r) => r.recipientId)).toEqual(['c']);
  });

  it('sends "praying" only to the request author', async () => {
    const d = deps();
    await createNotifier(d).notify({ type: 'praying', groupId: 'g1', actorId: 'b', requestId: 'r1', title: 'Healing for mum', authorId: 'a' });
    expect(d.members.listActiveUserIds).not.toHaveBeenCalled();
    expect(d.inbox.createMany.mock.calls[0][0].map((r) => r.recipientId)).toEqual(['a']);
  });

  it('sends "comment" only to the request author', async () => {
    const d = deps();
    await createNotifier(d).notify({ type: 'comment', groupId: 'g1', actorId: 'b', requestId: 'r1', title: 'Healing', body: 'Amen', authorId: 'a' });
    expect(d.inbox.createMany.mock.calls[0][0].map((r) => r.recipientId)).toEqual(['a']);
  });

  it('does nothing when the author is praying for their own request', async () => {
    const d = deps();
    await createNotifier(d).notify({ type: 'praying', groupId: 'g1', actorId: 'a', requestId: 'r1', title: 'x', authorId: 'a' });
    expect(d.inbox.createMany).not.toHaveBeenCalled();
    expect(d.push.send).not.toHaveBeenCalled();
  });

  it('sends "contribution" only to the member it was recorded for', async () => {
    const d = deps();
    await createNotifier(d).notify({ type: 'contribution', groupId: 'g1', actorId: 'a', memberId: 'c', amountPaise: 50000, transactionDate: '2026-09-01T00:00:00.000Z' });
    expect(d.inbox.createMany.mock.calls[0][0].map((r) => r.recipientId)).toEqual(['c']);
  });

  it('pushes to every token of the recipients with the route as data', async () => {
    const d = deps({ tokens: [{ userId: 'b', token: 'ExponentPushToken[b1]' }, { userId: 'b', token: 'ExponentPushToken[b2]' }, { userId: 'a', token: 'ExponentPushToken[a1]' }] });
    await createNotifier(d).notify(requestEvent);
    expect(d.tokens.forUsers).toHaveBeenCalledWith(['b', 'c']);
    expect(d.push.send).toHaveBeenCalledTimes(1);
    expect(d.push.send.mock.calls[0][0]).toEqual([
      { to: 'ExponentPushToken[b1]', title: 'New prayer request', body: 'Anna: Healing for mum', data: { route: '/prayer/r1', type: 'prayerRequest' }, sound: 'default', channelId: 'default', priority: 'high' },
      { to: 'ExponentPushToken[b2]', title: 'New prayer request', body: 'Anna: Healing for mum', data: { route: '/prayer/r1', type: 'prayerRequest' }, sound: 'default', channelId: 'default', priority: 'high' },
    ]);
  });

  it('chunks pushes into batches of 100', async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => ({ userId: 'b', token: `ExponentPushToken[${i}]` }));
    const d = deps({ tokens });
    await createNotifier(d).notify(requestEvent);
    expect(d.push.send).toHaveBeenCalledTimes(2);
    expect(d.push.send.mock.calls[0][0]).toHaveLength(100);
    expect(d.push.send.mock.calls[1][0]).toHaveLength(50);
  });

  it('removes tokens the push service reports as unregistered', async () => {
    const d = deps({
      tokens: [{ userId: 'b', token: 'ExponentPushToken[b1]' }, { userId: 'c', token: 'ExponentPushToken[c1]' }],
      tickets: [{ status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }, { status: 'ok', id: 't2' }],
    });
    await createNotifier(d).notify(requestEvent);
    expect(d.tokens.remove).toHaveBeenCalledTimes(1);
    expect(d.tokens.remove).toHaveBeenCalledWith('ExponentPushToken[b1]');
  });

  it('skips the push call when nobody has a token', async () => {
    const d = deps();
    await createNotifier(d).notify(requestEvent);
    expect(d.push.send).not.toHaveBeenCalled();
  });

  it('never throws: a push failure is logged and swallowed', async () => {
    const d = deps({ tokens: [{ userId: 'b', token: 'ExponentPushToken[b1]' }] });
    d.push.send.mockRejectedValue(new Error('network down'));
    await expect(createNotifier(d).notify(requestEvent)).resolves.toBeUndefined();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('network down'));
  });

  it('never throws: an inbox failure is logged and swallowed', async () => {
    const d = deps();
    d.inbox.createMany.mockRejectedValue(new Error('db down'));
    await expect(createNotifier(d).notify(requestEvent)).resolves.toBeUndefined();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('handlers', () => {
  function hdeps({ groupId = 'g1', prefs = undefined } = {}) {
    return {
      memberships: { findGroupId: jest.fn(async () => groupId) },
      inbox: { markRead: jest.fn(async (userId, ids) => ids.length), markAllRead: jest.fn(async () => 3), clearFor: jest.fn(async () => 5) },
      tokens: { upsert: jest.fn(async () => undefined), removeForUser: jest.fn(async () => undefined) },
      users: { getPrefs: jest.fn(async () => prefs), setPrefs: jest.fn(async (id, p) => p) },
    };
  }
  const me = { callerId: 'u1' };

  it('registerPushToken upserts a valid token for the caller', async () => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).registerPushToken({ token: 'ExponentPushToken[abc]', platform: 'ios', deviceName: 'iPhone' }, me)).resolves.toEqual({ registered: true });
    expect(d.tokens.upsert).toHaveBeenCalledWith({ userId: 'u1', token: 'ExponentPushToken[abc]', platform: 'ios', deviceName: 'iPhone' });
  });

  it.each(['', 'abc', 'ExpoPushToken[x]', 42])('registerPushToken rejects token %p', async (token) => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).registerPushToken({ token, platform: 'ios' }, me)).rejects.toThrow(MESSAGES.invalidToken);
  });

  it('registerPushToken normalises an unknown platform to "android" or "ios" only', async () => {
    const d = hdeps();
    await createNotificationHandlers(d).registerPushToken({ token: 'ExponentPushToken[abc]', platform: 'windows' }, me);
    expect(d.tokens.upsert.mock.calls[0][0].platform).toBe('unknown');
  });

  it('rejects non-members', async () => {
    const d = hdeps({ groupId: null });
    await expect(createNotificationHandlers(d).registerPushToken({ token: 'ExponentPushToken[abc]', platform: 'ios' }, me)).rejects.toThrow(MESSAGES.notMember);
    await expect(createNotificationHandlers(d).markAllNotificationsRead({}, me)).rejects.toThrow(MESSAGES.notMember);
  });

  it('unregisterPushToken removes the caller token', async () => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).unregisterPushToken({ token: 'ExponentPushToken[abc]' }, me)).resolves.toEqual({ unregistered: true });
    expect(d.tokens.removeForUser).toHaveBeenCalledWith('u1', 'ExponentPushToken[abc]');
  });

  it('markNotificationsRead only accepts string ids and reports the count', async () => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).markNotificationsRead({ ids: ['n1', 7, 'n2', ''] }, me)).resolves.toEqual({ updated: 2 });
    expect(d.inbox.markRead).toHaveBeenCalledWith('u1', ['n1', 'n2']);
  });

  it('markAllNotificationsRead reports the count', async () => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).markAllNotificationsRead({}, me)).resolves.toEqual({ updated: 3 });
    expect(d.inbox.markAllRead).toHaveBeenCalledWith('u1');
  });

  it('clearNotifications empties only the caller inbox', async () => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).clearNotifications({}, me)).resolves.toEqual({ removed: 5 });
    expect(d.inbox.clearFor).toHaveBeenCalledWith('u1');
  });

  it('clearNotifications refuses non-members', async () => {
    const d = hdeps({ groupId: null });
    await expect(createNotificationHandlers(d).clearNotifications({}, me)).rejects.toThrow(MESSAGES.notMember);
    expect(d.inbox.clearFor).not.toHaveBeenCalled();
  });

  it('updateNotificationPrefs merges booleans over defaults and stored values', async () => {
    const d = hdeps({ prefs: { funds: false } });
    const result = await createNotificationHandlers(d).updateNotificationPrefs({ calls: false }, me);
    expect(result).toEqual({ ...DEFAULT_PREFS, funds: false, calls: false });
    expect(d.users.setPrefs).toHaveBeenCalledWith('u1', { ...DEFAULT_PREFS, funds: false, calls: false });
  });

  it.each([{ calls: 'no' }, { bogus: true }, 'x'])('updateNotificationPrefs rejects %p', async (prefs) => {
    const d = hdeps();
    await expect(createNotificationHandlers(d).updateNotificationPrefs(prefs, me)).rejects.toThrow(MESSAGES.invalidPrefs);
  });
});
