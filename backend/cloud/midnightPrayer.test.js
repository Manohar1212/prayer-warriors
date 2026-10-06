const { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth } = require('./midnightPrayer');

const FIVE = ['a', 'b', 'c', 'd', 'e'];

function counts(plan) {
  const out = {};
  plan.forEach((p) => (out[p.userId] = (out[p.userId] || 0) + 1));
  return out;
}

describe('day helpers', () => {
  it('reads the Indian day and hour', () => {
    expect(istNow(new Date('2026-10-06T18:29:00.000Z'))).toEqual({ day: '2026-10-06', hour: 23 });
    expect(istNow(new Date('2026-10-06T18:30:00.000Z'))).toEqual({ day: '2026-10-07', hour: 0 });
  });
  it('moves across month and year ends', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(nextMonth('2026-12')).toBe('2027-01');
  });
  it('lists every day of a month', () => {
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2026-10')[30]).toBe('2026-10-31');
  });
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom('g1:2026-10');
    const b = seededRandom('g1:2026-10');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    xs.forEach((x) => expect(x >= 0 && x < 1).toBe(true));
  });
});

describe('planMonth', () => {
  it('fills every night, fairly, with no back-to-back nights', () => {
    for (let s = 0; s < 50; s += 1) {
      const plan = planMonth({ month: '2026-10', rotation: FIVE, lastPersonBefore: 'e', random: seededRandom(`seed${s}`) });
      expect(plan.map((p) => p.day)).toEqual(daysOfMonth('2026-10'));
      const c = Object.values(counts(plan));
      expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
      expect(plan[0].userId).not.toBe('e');
      plan.slice(1).forEach((p, i) => expect(p.userId).not.toBe(plan[i].userId));
    }
  });
  it('handles a rotation of two and of one', () => {
    const two = planMonth({ month: '2026-10', rotation: ['a', 'b'], lastPersonBefore: null, random: seededRandom('x') });
    expect(two).toHaveLength(31);
    two.slice(1).forEach((p, i) => expect(p.userId).not.toBe(two[i].userId));
    const one = planMonth({ month: '2026-10', rotation: ['a'], lastPersonBefore: 'a', random: seededRandom('x') });
    expect(one.every((p) => p.userId === 'a')).toBe(true);
    expect(one).toHaveLength(31);
  });
  it('plans nothing for an empty rotation', () => {
    expect(planMonth({ month: '2026-10', rotation: [], lastPersonBefore: null, random: seededRandom('x') })).toEqual([]);
  });
});

const { createMidnightPrayerHandlers, MESSAGES } = require('./midnightPrayer');

const NAMES = { a: 'Shiny', b: 'Alekhya', c: 'Ratna Kumari', d: 'Daya Ratnam', e: 'Divya Jyothsna', x: 'Devaki', admin: 'Shiny' };

/** In-memory repos; `clock.at` is the current instant. */
function world({ rotation = FIVE, at = '2026-10-06T10:00:00.000Z', admin = 'a', members = [...FIVE, 'x'] } = {}) {
  const clock = { at: new Date(at) };
  let seq = 0;
  const rows = [];
  const state = { rotation: [...rotation] };
  const sorted = (list) => [...list].sort((p, q) => p.day.localeCompare(q.day) || p.createdAt.localeCompare(q.createdAt));
  const notify = jest.fn(async () => undefined);
  const deps = {
    memberships: {
      findGroupId: async (u) => (members.includes(u) ? 'g1' : null),
      findAdminGroupId: async (u) => (u === admin ? 'g1' : null),
      isActiveMember: async (u, g) => g === 'g1' && members.includes(u),
    },
    rotations: { get: async () => [...state.rotation], set: async (_g, ids) => (state.rotation = [...ids]) },
    users: { findMany: async (ids) => ids.map((id) => ({ id, displayName: NAMES[id] || null })) },
    nights: {
      listMonth: async (g, m) => sorted(rows.filter((r) => r.groupId === g && r.month === m)),
      listFrom: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day >= d)),
      findDay: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day === d))[0] || null,
      findLastBefore: async (g, d) => sorted(rows.filter((r) => r.groupId === g && r.day < d)).pop() || null,
      listDay: async (d) => sorted(rows.filter((r) => r.day === d)),
      createMany: async (list) => list.forEach((r) => rows.push({ id: `n${(seq += 1)}`, prayedAt: null, remindedAt: null, nudgedAt: null, createdAt: new Date(1e12 + seq).toISOString(), ...r })),
      update: async (id, patch) => Object.assign(rows.find((r) => r.id === id), patch),
      remove: async (ids) => ids.forEach((id) => rows.splice(rows.findIndex((r) => r.id === id), 1)),
    },
    notify,
    now: () => clock.at,
  };
  return { h: createMidnightPrayerHandlers(deps), rows, state, clock, notify };
}

describe('getMidnightMonth', () => {
  it('creates the month once and returns names', async () => {
    const { h, rows } = world();
    const first = await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    expect(first.nights).toHaveLength(31);
    expect(first.nights[0]).toEqual({ day: '2026-10-01', userId: expect.any(String), name: expect.any(String), prayed: false });
    expect(first.rotation.map((r) => r.name)).toEqual(['Shiny', 'Alekhya', 'Ratna Kumari', 'Daya Ratnam', 'Divya Jyothsna']);
    expect(first.nextMonth).toBeNull();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'c' });
    expect(rows).toHaveLength(31);
  });
  it('keeps the oldest row when a race made two for one night', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const original = rows.find((r) => r.day === '2026-10-09');
    rows.push({ ...original, id: 'dup', userId: 'x', createdAt: '2099-01-01T00:00:00.000Z' });
    const again = await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    expect(again.nights.find((n) => n.day === '2026-10-09').userId).toBe(original.userId);
    expect(rows.find((r) => r.id === 'dup')).toBeUndefined();
  });
  it('opens next month only from the 20th, and never a past month', async () => {
    const early = world({ at: '2026-10-19T10:00:00.000Z' });
    await expect(early.h.getMidnightMonth({ month: '2026-11' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.badMonth);
    await expect(early.h.getMidnightMonth({ month: '2026-09' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.badMonth);
    const late = world({ at: '2026-10-20T10:00:00.000Z' });
    expect((await late.h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' })).nextMonth).toBe('2026-11');
    expect((await late.h.getMidnightMonth({ month: '2026-11' }, { callerId: 'b' })).nights).toHaveLength(30);
  });
  it('turns away non-members and returns no nights for an empty rotation', async () => {
    await expect(world().h.getMidnightMonth({ month: '2026-10' }, { callerId: 'zz' })).rejects.toThrow(MESSAGES.notMember);
    expect((await world({ rotation: [] }).h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' })).nights).toEqual([]);
  });
});

describe('getMidnightTonight', () => {
  it('returns tonight, yesterday across a month end, and my next night', async () => {
    const { h, rows } = world({ at: '2026-10-01T10:00:00.000Z' });
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    rows.push({ id: 'sep30', groupId: 'g1', month: '2026-09', day: '2026-09-30', userId: 'c', prayedAt: null, remindedAt: null, nudgedAt: null, createdAt: '2026-09-01T00:00:00.000Z' });
    const me = rows.find((r) => r.day > '2026-10-01').userId;
    const res = await h.getMidnightTonight({}, { callerId: me });
    expect(res.today).toBe('2026-10-01');
    expect(res.hour).toBe(15);
    expect(res.tonight.day).toBe('2026-10-01');
    expect(res.yesterday).toEqual({ day: '2026-09-30', userId: 'c', name: 'Ratna Kumari', prayed: false });
    expect(res.myNext >= '2026-10-01').toBe(true);
    expect(res.inRotation).toBe(true);
  });
  it('says so when the caller is not in the rotation', async () => {
    const res = await world().h.getMidnightTonight({}, { callerId: 'x' });
    expect(res.inRotation).toBe(false);
    expect(res.myNext).toBeNull();
  });
});

describe('markMidnightPrayed', () => {
  async function setup(at) {
    const w = world({ at: '2026-10-06T10:00:00.000Z' });
    await w.h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const row = w.rows.find((r) => r.day === '2026-10-06');
    w.clock.at = new Date(at);
    return { ...w, row };
  }
  it('opens at 11 PM on the night and closes at the end of the next day', async () => {
    let w = await setup('2026-10-06T17:29:00.000Z'); // 10:59 PM IST
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).rejects.toThrow(MESSAGES.tooEarly);
    w = await setup('2026-10-06T17:30:00.000Z'); // 11:00 PM IST
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).resolves.toEqual({ day: '2026-10-06', prayed: true });
    w = await setup('2026-10-07T18:29:00.000Z'); // 11:59 PM IST on D+1
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).resolves.toEqual({ day: '2026-10-06', prayed: true });
    w = await setup('2026-10-07T18:30:00.000Z'); // 12:00 AM on D+2
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId })).rejects.toThrow(MESSAGES.tooLate);
  });
  it('is only for the night’s person and is idempotent', async () => {
    const w = await setup('2026-10-07T03:00:00.000Z');
    const other = FIVE.find((u) => u !== w.row.userId);
    await expect(w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: other })).rejects.toThrow(MESSAGES.notYours);
    await w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId });
    const first = w.row.prayedAt;
    await w.h.markMidnightPrayed({ day: '2026-10-06' }, { callerId: w.row.userId });
    expect(w.row.prayedAt).toBe(first);
  });
});

describe('reassignMidnightNight', () => {
  it('lets the admin move tonight to any member and clears its reminders', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const row = rows.find((r) => r.day === '2026-10-06');
    Object.assign(row, { remindedAt: new Date(), prayedAt: new Date() });
    const res = await h.reassignMidnightNight({ day: '2026-10-06', userId: 'x' }, { callerId: 'a' });
    expect(res).toEqual({ day: '2026-10-06', userId: 'x', name: 'Devaki', prayed: false });
    expect(row).toMatchObject({ userId: 'x', remindedAt: null, prayedAt: null, nudgedAt: null });
  });
  it('refuses non-admins, past nights and non-members', async () => {
    const { h } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    await expect(h.reassignMidnightNight({ day: '2026-10-07', userId: 'c' }, { callerId: 'b' })).rejects.toThrow(MESSAGES.adminOnly);
    await expect(h.reassignMidnightNight({ day: '2026-10-05', userId: 'c' }, { callerId: 'a' })).rejects.toThrow(MESSAGES.pastNight);
    await expect(h.reassignMidnightNight({ day: '2026-10-07', userId: 'zz' }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badMember);
  });
});

describe('setMidnightRotation', () => {
  it('saves the rotation and hands a removed member’s coming nights to the others', async () => {
    const { h, rows, state } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    const pastE = rows.filter((r) => r.userId === 'e' && r.day < '2026-10-06').map((r) => r.id);
    const res = await h.setMidnightRotation({ userIds: ['a', 'b', 'c', 'd'] }, { callerId: 'a' });
    expect(res.rotation.map((r) => r.userId)).toEqual(['a', 'b', 'c', 'd']);
    expect(state.rotation).toEqual(['a', 'b', 'c', 'd']);
    const future = rows.filter((r) => r.day >= '2026-10-06');
    expect(future.some((r) => r.userId === 'e')).toBe(false);
    expect(rows.filter((r) => r.userId === 'e').map((r) => r.id)).toEqual(pastE);
    future.slice(1).forEach((r, i) => expect(r.userId).not.toBe(future[i].userId));
  });
  it('removes coming nights when the rotation is emptied', async () => {
    const { h, rows } = world();
    await h.getMidnightMonth({ month: '2026-10' }, { callerId: 'b' });
    await h.setMidnightRotation({ userIds: [] }, { callerId: 'a' });
    expect(rows.every((r) => r.day < '2026-10-06')).toBe(true);
  });
  it('validates the list', async () => {
    const { h } = world();
    await expect(h.setMidnightRotation({ userIds: ['a', 'a'] }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badRotation);
    await expect(h.setMidnightRotation({ userIds: ['zz'] }, { callerId: 'a' })).rejects.toThrow(MESSAGES.badRotation);
    await expect(h.setMidnightRotation({ userIds: ['a'] }, { callerId: 'b' })).rejects.toThrow(MESSAGES.adminOnly);
  });
});
