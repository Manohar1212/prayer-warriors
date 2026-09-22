const { createPrayerNightHandlers, daysUntil, MESSAGES } = require('./prayerNight');

const NOW = new Date('2026-09-18T04:30:00.000Z'); // 10:00 on 18 Sept in India
const admin = { callerId: 'admin' };
const member = { callerId: 'u2' };

function night(overrides = {}) {
  return { id: 'n1', groupId: 'g1', month: '2026-10', scheduledAt: '2026-10-03T16:30:00.000Z', note: 'Bring your Bible', cancelledAt: null, lastReminderDay: '', ...overrides };
}

function deps({ upcoming = null, byMonth = null, rows = [], call = null } = {}) {
  const store = new Map();
  const d = {
    calls: {
      get: jest.fn(async () => call),
      create: jest.fn(async (fields) => ({ id: 'call-new', ...fields })),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
    },
    memberships: { findGroupId: jest.fn(async () => 'g1'), findAdminGroupId: jest.fn(async (id) => (id === 'admin' ? 'g1' : null)) },
    groups: { getNightOrder: jest.fn(async () => ['పాటలు', 'ఆరాధన']), setNightOrder: jest.fn(async () => undefined) },
    nights: {
      findUpcoming: jest.fn(async () => upcoming),
      findByMonth: jest.fn(async () => byMonth),
      get: jest.fn(async (id) => store.get(id) || (upcoming && upcoming.id === id ? upcoming : null)),
      create: jest.fn(async (fields) => { const row = night({ id: 'new', ...fields, scheduledAt: fields.scheduledAt.toISOString() }); store.set('new', row); return row; }),
      update: jest.fn(async (id, patch) => { const base = store.get(id) || rows.find((r) => r.id === id) || upcoming || byMonth || night({ id }); const row = { ...base, ...patch, scheduledAt: patch.scheduledAt ? patch.scheduledAt.toISOString() : base.scheduledAt }; store.set(id, row); return row; }),
      listUpcoming: jest.fn(async () => rows),
    },
    notify: jest.fn(async () => undefined),
    now: () => NOW,
  };
  return d;
}

describe('daysUntil', () => {
  it('counts Indian calendar days', () => {
    expect(daysUntil(new Date('2026-09-18T20:00:00.000Z'), NOW)).toBe(1); // 01:30 on the 19th in India
    expect(daysUntil(new Date('2026-09-25T16:30:00.000Z'), NOW)).toBe(7);
    expect(daysUntil(new Date('2026-09-17T16:30:00.000Z'), NOW)).toBe(-1);
  });
});

describe('schedulePrayerNight', () => {
  it('creates the month\'s night, announces it, and flags short notice', async () => {
    const d = deps();
    const result = await createPrayerNightHandlers(d).schedulePrayerNight({ scheduledAt: '2026-10-03T16:30:00.000Z', note: ' Bring your Bible ' }, admin);
    expect(d.calls.create).toHaveBeenCalledWith({ groupId: 'g1', title: 'All-night prayer', scheduledAt: new Date('2026-10-03T16:30:00.000Z'), status: 'scheduled', createdById: 'admin' });
    expect(d.nights.create).toHaveBeenCalledWith({ groupId: 'g1', month: '2026-10', scheduledAt: new Date('2026-10-03T16:30:00.000Z'), note: 'Bring your Bible', createdById: 'admin', callId: 'call-new' });
    expect(result).toMatchObject({ month: '2026-10', daysUntil: 15, reminding: false, shortNotice: false, note: 'Bring your Bible', callId: 'call-new' });
    expect(d.notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'prayerNight', groupId: 'g1', actorId: 'admin', daysUntil: 15 }));
    const soon = await createPrayerNightHandlers(deps()).schedulePrayerNight({ scheduledAt: '2026-09-26T16:30:00.000Z' }, admin);
    expect(soon.shortNotice).toBe(true);
  });

  it('moves an existing night for that month instead of adding another', async () => {
    const d = deps({ byMonth: night({ lastReminderDay: '2026-09-17', callId: 'c1' }), call: { id: 'c1', status: 'scheduled' } });
    const result = await createPrayerNightHandlers(d).schedulePrayerNight({ scheduledAt: '2026-10-10T16:30:00.000Z' }, admin);
    expect(d.nights.create).not.toHaveBeenCalled();
    expect(d.calls.create).not.toHaveBeenCalled();
    expect(d.calls.update).toHaveBeenCalledWith('c1', { scheduledAt: new Date('2026-10-10T16:30:00.000Z'), title: 'All-night prayer' });
    expect(d.nights.update).toHaveBeenCalledWith('n1', { scheduledAt: new Date('2026-10-10T16:30:00.000Z'), note: '', cancelledAt: null, lastReminderDay: '', callId: 'c1', pointsResetAt: null });
    expect(result.scheduledAt).toBe('2026-10-10T16:30:00.000Z');
    expect(d.notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'prayerNightMoved' }));
  });

  it('refuses members, bad dates, and the past', async () => {
    const h = createPrayerNightHandlers(deps());
    await expect(h.schedulePrayerNight({ scheduledAt: '2026-10-03T16:30:00.000Z' }, member)).rejects.toThrow(MESSAGES.adminOnly);
    await expect(h.schedulePrayerNight({ scheduledAt: 'soon' }, admin)).rejects.toThrow(MESSAGES.invalidDate);
    await expect(h.schedulePrayerNight({ scheduledAt: '2026-09-01T16:30:00.000Z' }, admin)).rejects.toThrow(MESSAGES.inPast);
  });
});

describe('getPrayerNight and reminders', () => {
  it('returns the upcoming night with the countdown', async () => {
    const result = await createPrayerNightHandlers(deps({ upcoming: night() })).getPrayerNight({}, member);
    expect(result).toMatchObject({ id: 'n1', daysUntil: 15, reminding: false });
    expect(await createPrayerNightHandlers(deps()).getPrayerNight({}, member)).toBeNull();
  });

  it('sends one reminder a day during the last week, whoever asks first', async () => {
    const d = deps({ upcoming: night({ scheduledAt: '2026-09-21T16:30:00.000Z' }) });
    const h = createPrayerNightHandlers(d);
    const first = await h.getPrayerNight({}, member);
    expect(first.reminding).toBe(true);
    expect(d.nights.update).toHaveBeenCalledWith('n1', { lastReminderDay: '2026-09-18' });
    expect(d.notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'prayerNightReminder', daysUntil: 3, inboxOnly: true }));
    d.nights.findUpcoming.mockResolvedValue(night({ scheduledAt: '2026-09-21T16:30:00.000Z', lastReminderDay: '2026-09-18' }));
    await h.getPrayerNight({}, member);
    expect(d.notify).toHaveBeenCalledTimes(1);
  });

  it('does not remind more than a week ahead', async () => {
    const d = deps({ upcoming: night({ scheduledAt: '2026-09-26T16:30:00.000Z' }) });
    await createPrayerNightHandlers(d).getPrayerNight({}, member);
    expect(d.notify).not.toHaveBeenCalled();
  });

  it('the job reminds every group with a night due', async () => {
    const rows = [night({ id: 'a', groupId: 'g1', scheduledAt: '2026-09-20T16:30:00.000Z' }), night({ id: 'b', groupId: 'g2', scheduledAt: '2026-10-20T16:30:00.000Z' })];
    const d = deps({ rows });
    const result = await createPrayerNightHandlers(d).sendDueReminders();
    expect(result).toEqual({ checked: 2, sent: 1 });
  });
});

describe('cancelPrayerNight', () => {
  it('cancels and tells the group', async () => {
    const d = deps({ upcoming: night({ callId: 'c1' }), call: { id: 'c1', status: 'scheduled' } });
    await createPrayerNightHandlers(d).cancelPrayerNight({ nightId: 'n1' }, admin);
    expect(d.calls.update).toHaveBeenCalledWith('c1', { status: 'cancelled' });
    expect(d.nights.update).toHaveBeenCalledWith('n1', { cancelledAt: NOW });
    expect(d.notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'prayerNightCancelled' }));
    await expect(createPrayerNightHandlers(deps({ upcoming: night() })).cancelPrayerNight({ nightId: 'zzz' }, admin)).rejects.toThrow(MESSAGES.notFound);
  });
});

describe('order of the night', () => {
  it('lets any member read the steps', async () => {
    const d = deps();
    await expect(createPrayerNightHandlers(d).getNightOrder({}, { callerId: 'm1' })).resolves.toEqual({ items: ['పాటలు', 'ఆరాధన'] });
    expect(d.groups.getNightOrder).toHaveBeenCalledWith('g1');
  });

  it('lets an admin replace them, trimming and dropping blank lines', async () => {
    const d = deps();
    const result = await createPrayerNightHandlers(d).setNightOrder({ items: [' సిద్ధపాటు ప్రార్థన ', '', 'పాటలు', 7] }, { callerId: 'admin' });
    expect(result).toEqual({ items: ['సిద్ధపాటు ప్రార్థన', 'పాటలు'] });
    expect(d.groups.setNightOrder).toHaveBeenCalledWith('g1', ['సిద్ధపాటు ప్రార్థన', 'పాటలు']);
  });

  it('refuses members and overlong orders', async () => {
    const d = deps();
    await expect(createPrayerNightHandlers(d).setNightOrder({ items: ['x'] }, { callerId: 'm1' })).rejects.toThrow(MESSAGES.adminOnlyOrder);
    await expect(createPrayerNightHandlers(d).setNightOrder({ items: ['x'.repeat(121)] }, { callerId: 'admin' })).rejects.toThrow(MESSAGES.orderTooLong);
    expect(d.groups.setNightOrder).not.toHaveBeenCalled();
  });
});
