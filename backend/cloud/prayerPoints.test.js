const { createPrayerPointHandlers, monthKeyFor, MESSAGES } = require('./prayerPoints');

const NOW = new Date('2026-09-16T20:30:00.000Z'); // 02:00 on the 17th in India, still September
const caller = { callerId: 'u1' };
const admin = { callerId: 'a1' };

function point(overrides = {}) {
  return { id: 'p1', groupId: 'g1', title: 'Our nation', order: 1, active: true, answeredAt: null, testimony: '', ...overrides };
}

function claimRow(overrides = {}) {
  return { id: 'c1', pointId: 'p1', userId: 'u1', userName: 'Shiny', groupId: 'g1', month: '2026-09', doneAt: null, ...overrides };
}

function deps({ groupId = 'g1', adminGroupId = null, points = [point()], claims = [], found = null, mine = null } = {}) {
  return {
    memberships: {
      findGroupId: jest.fn(async () => groupId),
      findAdminGroupId: jest.fn(async () => adminGroupId),
    },
    points: {
      listActive: jest.fn(async () => points.filter((p) => !p.answeredAt)),
      listAnswered: jest.fn(async () => points.filter((p) => p.answeredAt)),
      get: jest.fn(async (id) => points.find((p) => p.id === id) || null),
      create: jest.fn(async (fields) => ({ id: 'new1', ...fields })),
      update: jest.fn(async (id, patch) => ({ ...points.find((p) => p.id === id), ...patch })),
    },
    claims: {
      listForMonth: jest.fn(async () => claims),
      find: jest.fn(async () => found),
      findMine: jest.fn(async () => mine),
      create: jest.fn(async (fields) => claimRow({ id: 'c-new', ...fields })),
      remove: jest.fn(async () => undefined),
      markDone: jest.fn(async (id, at) => claimRow({ id, doneAt: at.toISOString() })),
    },
    now: () => NOW,
  };
}

describe('monthKeyFor', () => {
  it('uses the Indian calendar month', () => {
    expect(monthKeyFor(new Date('2026-09-30T19:00:00.000Z'))).toBe('2026-10'); // 00:30 IST on 1 Oct
    expect(monthKeyFor(new Date('2026-09-30T18:00:00.000Z'))).toBe('2026-09');
  });
});

describe('listPrayerPoints', () => {
  it('returns points in order with this month claims attached', async () => {
    const d = deps({ points: [point({ id: 'p2', order: 2, title: 'Families' }), point()], claims: [claimRow({ pointId: 'p2', doneAt: '2026-09-10T00:00:00.000Z' })] });
    const result = await createPrayerPointHandlers(d).listPrayerPoints({}, caller);
    expect(result.month).toBe('2026-09');
    expect(result.points.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.points[0].claim).toBeNull();
    expect(result.points[1].claim).toEqual({ userId: 'u1', userName: 'Shiny', doneAt: '2026-09-10T00:00:00.000Z' });
    expect(d.claims.listForMonth).toHaveBeenCalledWith('g1', '2026-09');
  });

  it('refuses non-members', async () => {
    await expect(createPrayerPointHandlers(deps({ groupId: null })).listPrayerPoints({}, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('admin edits', () => {
  it('adds a point at the end of the list', async () => {
    const d = deps({ adminGroupId: 'g1', points: [point({ order: 3 })] });
    const created = await createPrayerPointHandlers(d).addPrayerPoint({ title: '  Our families ' }, admin);
    expect(d.points.create).toHaveBeenCalledWith({ groupId: 'g1', title: 'Our families', order: 4, active: true });
    expect(created.id).toBe('new1');
  });

  it('rejects an empty or long title', async () => {
    const h = createPrayerPointHandlers(deps({ adminGroupId: 'g1' }));
    await expect(h.addPrayerPoint({ title: '  ' }, admin)).rejects.toThrow(MESSAGES.titleRequired);
    await expect(h.addPrayerPoint({ title: 'x'.repeat(121) }, admin)).rejects.toThrow(MESSAGES.titleTooLong);
  });

  it('only admins may add, rename or remove', async () => {
    const h = createPrayerPointHandlers(deps());
    await expect(h.addPrayerPoint({ title: 'Nation' }, caller)).rejects.toThrow(MESSAGES.notAdmin);
    await expect(h.updatePrayerPoint({ pointId: 'p1', title: 'Nation' }, caller)).rejects.toThrow(MESSAGES.notAdmin);
    await expect(h.removePrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notAdmin);
  });

  it('renames and soft-removes points in the admin group only', async () => {
    const d = deps({ adminGroupId: 'g1' });
    const h = createPrayerPointHandlers(d);
    await h.updatePrayerPoint({ pointId: 'p1', title: 'Our nation and leaders' }, admin);
    expect(d.points.update).toHaveBeenCalledWith('p1', { title: 'Our nation and leaders' });
    await h.removePrayerPoint({ pointId: 'p1' }, admin);
    expect(d.points.update).toHaveBeenCalledWith('p1', { active: false });
    await expect(h.updatePrayerPoint({ pointId: 'missing', title: 'x' }, admin)).rejects.toThrow(MESSAGES.notFound);
  });
});

describe('claimPrayerPoint', () => {
  it('creates a claim for this month', async () => {
    const d = deps();
    const claim = await createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller);
    expect(d.claims.create).toHaveBeenCalledWith({ pointId: 'p1', userId: 'u1', groupId: 'g1', month: '2026-09' });
    expect(claim.id).toBe('c-new');
  });

  it('refuses a point someone else already holds', async () => {
    const d = deps({ found: claimRow({ userId: 'u2' }) });
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.taken);
  });

  it('refuses a second point in the same month', async () => {
    const d = deps({ mine: claimRow({ pointId: 'p9' }) });
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyHave);
  });

  it('refuses removed points', async () => {
    const d = deps({ points: [point({ active: false })] });
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });
});

describe('releasePrayerPoint and markPrayerPointDone', () => {
  it('lets the holder give a point back before it is done', async () => {
    const d = deps({ found: claimRow() });
    const result = await createPrayerPointHandlers(d).releasePrayerPoint({ pointId: 'p1' }, caller);
    expect(d.claims.remove).toHaveBeenCalledWith('c1');
    expect(result).toEqual({ pointId: 'p1', released: true });
  });

  it('marks the holder claim done with the current time', async () => {
    const d = deps({ found: claimRow() });
    const result = await createPrayerPointHandlers(d).markPrayerPointDone({ pointId: 'p1' }, caller);
    expect(d.claims.markDone).toHaveBeenCalledWith('c1', NOW);
    expect(result.doneAt).toBe(NOW.toISOString());
  });

  it('refuses when the claim belongs to someone else or is already done', async () => {
    const other = createPrayerPointHandlers(deps({ found: claimRow({ userId: 'u2' }) }));
    await expect(other.markPrayerPointDone({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notYours);
    await expect(other.releasePrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notYours);
    const done = createPrayerPointHandlers(deps({ found: claimRow({ doneAt: '2026-09-10T00:00:00.000Z' }) }));
    await expect(done.markPrayerPointDone({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyDone);
    await expect(done.releasePrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyDone);
  });
});

describe('answered points', () => {
  it('lists answered points newest first', async () => {
    const d = deps({ points: [point({ id: 'p1', answeredAt: '2026-08-01T00:00:00.000Z', testimony: 'Peace came' }), point({ id: 'p2', answeredAt: '2026-09-01T00:00:00.000Z' }), point({ id: 'p3' })] });
    const result = await createPrayerPointHandlers(d).listAnsweredPrayerPoints({}, caller);
    expect(result.map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(result[1].testimony).toBe('Peace came');
  });

  it('lets the holder mark a point answered with a testimony', async () => {
    const d = deps({ found: claimRow() });
    const result = await createPrayerPointHandlers(d).markPrayerPointAnswered({ pointId: 'p1', testimony: ' God moved ' }, caller);
    expect(d.points.update).toHaveBeenCalledWith('p1', { answeredAt: NOW, testimony: 'God moved' });
    expect(result.answeredAt).toBe(NOW);
  });

  it('lets an admin mark any point answered, but refuses other members', async () => {
    const a = deps({ adminGroupId: 'g1', found: claimRow({ userId: 'u2' }) });
    await createPrayerPointHandlers(a).markPrayerPointAnswered({ pointId: 'p1' }, admin);
    expect(a.points.update).toHaveBeenCalled();
    const m = deps({ found: claimRow({ userId: 'u2' }) });
    await expect(createPrayerPointHandlers(m).markPrayerPointAnswered({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notHolder);
  });

  it('keeps answered points out of the monthly list and refuses further claims', async () => {
    const d = deps({ points: [point({ answeredAt: '2026-09-01T00:00:00.000Z' })] });
    const h = createPrayerPointHandlers(d);
    expect((await h.listPrayerPoints({}, caller)).points).toEqual([]);
    await expect(h.claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyAnswered);
  });
});
