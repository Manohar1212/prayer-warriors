const { createPrayerPointHandlers, monthKeyFor, MESSAGES } = require('./prayerPoints');

const NOW = new Date('2026-09-16T20:30:00.000Z'); // 02:00 on the 17th in India, still September
const caller = { callerId: 'u1' };
const admin = { callerId: 'a1' };

function point(overrides = {}) {
  return { id: 'p1', groupId: 'g1', title: 'Our nation', order: 1, active: true, answeredAt: null, testimony: '', requestId: null, ...overrides };
}

function claimRow(overrides = {}) {
  return { id: 'c1', pointId: 'p1', userId: 'u1', userName: 'Shiny', groupId: 'g1', month: '2026-09', doneAt: null, ...overrides };
}

function deps({ groupId = 'g1', adminGroupId = null, points = [point()], claims = [], found = null, mine = null, request = null, linked = null } = {}) {
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
      findByRequest: jest.fn(async () => linked),
    },
    requests: {
      get: jest.fn(async () => request),
      update: jest.fn(async (id, patch) => ({ ...request, ...patch })),
    },
    claims: {
      listForMonth: jest.fn(async () => claims),
      find: jest.fn(async () => found),
      findOpenMine: jest.fn(async () => mine),
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

  it('refuses a new point while one is still being prayed (not yet Done)', async () => {
    const d = deps({ points: [point({ id: 'p1' }), point({ id: 'p9' })], mine: claimRow({ pointId: 'p9' }) });
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyHave);
  });

  it('frees a pick whose point was removed or answered, instead of blocking the member', async () => {
    const d = deps({ points: [point({ id: 'p1' }), point({ id: 'p9', active: false })], mine: claimRow({ id: 'old', pointId: 'p9' }) });
    await createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller);
    expect(d.claims.remove).toHaveBeenCalledWith('old');
    expect(d.claims.create).toHaveBeenCalledWith(expect.objectContaining({ pointId: 'p1' }));
  });

  it('keeps a night on the 30th in its own month through the early hours of the 1st', async () => {
    const d = deps();
    d.now = () => new Date('2026-09-30T19:30:00.000Z'); // 01:00 on 1 October in India
    await createPrayerPointHandlers(d).listPrayerPoints({}, caller);
    expect(d.claims.listForMonth).toHaveBeenCalledWith('g1', '2026-09');
  });

  it('lets a member pick the next point once the last one is Done', async () => {
    const d = deps({ mine: null });
    await createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller);
    expect(d.claims.findOpenMine).toHaveBeenCalledWith('u1', 'g1', expect.any(String));
    expect(d.claims.create).toHaveBeenCalledWith(expect.objectContaining({ pointId: 'p1', userId: 'u1' }));
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

  it('lets the holder mark a point answered with a testimony once it is done', async () => {
    const d = deps({ found: claimRow({ doneAt: '2026-09-10T00:00:00.000Z' }) });
    const result = await createPrayerPointHandlers(d).markPrayerPointAnswered({ pointId: 'p1', testimony: ' God moved ' }, caller);
    expect(d.points.update).toHaveBeenCalledWith('p1', { answeredAt: NOW, testimony: 'God moved' });
    expect(result.answeredAt).toBe(NOW);
  });

  it('refuses the holder before the point is marked done', async () => {
    const d = deps({ found: claimRow() });
    await expect(createPrayerPointHandlers(d).markPrayerPointAnswered({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.notDoneYet);
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

describe('addRequestToMonthly', () => {
  const request = { id: 'r1', groupId: 'g1', title: 'Healing for Mom', status: 'active' };

  it('creates a linked point from an open request (admin only)', async () => {
    const d = deps({ adminGroupId: 'g1', request });
    const created = await createPrayerPointHandlers(d).addRequestToMonthly({ requestId: 'r1' }, admin);
    expect(d.points.create).toHaveBeenCalledWith({ groupId: 'g1', title: 'Healing for Mom', order: 2, active: true, requestId: 'r1' });
    expect(created.requestId).toBe('r1');
    await expect(createPrayerPointHandlers(deps({ request })).addRequestToMonthly({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notAdmin);
  });

  it('refuses answered, foreign, missing or already-listed requests', async () => {
    await expect(createPrayerPointHandlers(deps({ adminGroupId: 'g1', request: { ...request, status: 'answered' } })).addRequestToMonthly({ requestId: 'r1' }, admin)).rejects.toThrow(MESSAGES.requestNotActive);
    await expect(createPrayerPointHandlers(deps({ adminGroupId: 'g1', request: { ...request, groupId: 'g2' } })).addRequestToMonthly({ requestId: 'r1' }, admin)).rejects.toThrow(MESSAGES.requestNotFound);
    await expect(createPrayerPointHandlers(deps({ adminGroupId: 'g1', request: null })).addRequestToMonthly({ requestId: 'r1' }, admin)).rejects.toThrow(MESSAGES.requestNotFound);
    await expect(createPrayerPointHandlers(deps({ adminGroupId: 'g1', request, linked: point() })).addRequestToMonthly({ requestId: 'r1' }, admin)).rejects.toThrow(MESSAGES.requestAlreadyMonthly);
  });

  it('answering a linked point answers the request too', async () => {
    const d = deps({ adminGroupId: 'g1', points: [point({ requestId: 'r1' })], request });
    await createPrayerPointHandlers(d).markPrayerPointAnswered({ pointId: 'p1', testimony: 'Healed' }, admin);
    expect(d.requests.update).toHaveBeenCalledWith('r1', { status: 'answered', answeredAt: NOW, testimony: 'Healed' });
  });

  it('exposes the link in the monthly list', async () => {
    const d = deps({ points: [point({ requestId: 'r1' })] });
    const result = await createPrayerPointHandlers(d).listPrayerPoints({}, caller);
    expect(result.points[0].requestId).toBe('r1');
  });
});

describe('reset after the all-night prayer', () => {
  function withNight(night) {
    const d = deps();
    d.claims.removeForGroup = jest.fn(async () => undefined);
    d.nights = {
      findLatestStartedBefore: jest.fn(async () => night),
      update: jest.fn(async () => undefined),
    };
    return d;
  }

  it('clears every pick once a night is over, and records that it did', async () => {
    const d = withNight({ id: 'n1', scheduledAt: '2026-09-01T16:30:00.000Z', pointsResetAt: null });
    await createPrayerPointHandlers(d).listPrayerPoints({}, caller);
    expect(d.nights.findLatestStartedBefore).toHaveBeenCalledWith('g1', new Date(NOW.getTime() - 12 * 60 * 60 * 1000));
    expect(d.claims.removeForGroup).toHaveBeenCalledWith('g1');
    expect(d.nights.update).toHaveBeenCalledWith('n1', { pointsResetAt: NOW });
  });

  it('does not clear again for a night already reset', async () => {
    const d = withNight({ id: 'n1', scheduledAt: '2026-09-01T16:30:00.000Z', pointsResetAt: '2026-09-02T05:00:00.000Z' });
    await createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller);
    expect(d.claims.removeForGroup).not.toHaveBeenCalled();
  });

  it('leaves picks alone while no night has finished yet', async () => {
    const d = withNight(null);
    await createPrayerPointHandlers(d).listPrayerPoints({}, caller);
    expect(d.claims.removeForGroup).not.toHaveBeenCalled();
    expect(d.nights.update).not.toHaveBeenCalled();
  });
});

describe('reorderPrayerPoints', () => {
  const three = [point({ id: 'p1', order: 1 }), point({ id: 'p2', order: 2 }), point({ id: 'p3', order: 3 })];

  it('lets an admin set a new order, writing only the points that moved', async () => {
    const d = deps({ adminGroupId: 'g1', points: three });
    await expect(createPrayerPointHandlers(d).reorderPrayerPoints({ ids: ['p1', 'p3', 'p2'] }, caller)).resolves.toEqual({ ids: ['p1', 'p3', 'p2'] });
    expect(d.points.update.mock.calls).toEqual([['p3', { order: 2 }], ['p2', { order: 3 }]]);
  });

  it('refuses members', async () => {
    const d = deps({ points: three });
    await expect(createPrayerPointHandlers(d).reorderPrayerPoints({ ids: ['p3', 'p2', 'p1'] }, caller)).rejects.toThrow(MESSAGES.notAdmin);
  });

  it('refuses a list that misses, repeats or invents points', async () => {
    const d = deps({ adminGroupId: 'g1', points: three });
    const h = createPrayerPointHandlers(d);
    await expect(h.reorderPrayerPoints({ ids: ['p1', 'p2'] }, caller)).rejects.toThrow(MESSAGES.badOrder);
    await expect(h.reorderPrayerPoints({ ids: ['p1', 'p1', 'p2'] }, caller)).rejects.toThrow(MESSAGES.badOrder);
    await expect(h.reorderPrayerPoints({ ids: ['p1', 'p2', 'x9'] }, caller)).rejects.toThrow(MESSAGES.badOrder);
    expect(d.points.update).not.toHaveBeenCalled();
  });
});

describe('removePrayerPoint', () => {
  it('frees the member who was praying it', async () => {
    const d = deps({ adminGroupId: 'g1', found: claimRow({ id: 'c7', pointId: 'p1', userId: 'u2' }) });
    await createPrayerPointHandlers(d).removePrayerPoint({ pointId: 'p1' }, caller);
    expect(d.points.update).toHaveBeenCalledWith('p1', { active: false });
    expect(d.claims.remove).toHaveBeenCalledWith('c7');
  });
});

describe('double taps on Pick', () => {
  it('lets the earliest pick of a point stand and takes back a later one', async () => {
    const d = deps();
    d.claims.listForPoint = jest.fn(async () => [claimRow({ id: 'c-first', userId: 'u2' }), claimRow({ id: 'c-new' })]);
    d.claims.listOpenMine = jest.fn(async () => [claimRow({ id: 'c-new' })]);
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.taken);
    expect(d.claims.remove).toHaveBeenCalledWith('c-new');
  });

  it('keeps a member to one open pick when two different points are tapped at once', async () => {
    const d = deps();
    d.claims.listForPoint = jest.fn(async () => [claimRow({ id: 'c-new' })]);
    d.claims.listOpenMine = jest.fn(async () => [claimRow({ id: 'c-other', pointId: 'p2' }), claimRow({ id: 'c-new' })]);
    await expect(createPrayerPointHandlers(d).claimPrayerPoint({ pointId: 'p1' }, caller)).rejects.toThrow(MESSAGES.alreadyHave);
    expect(d.claims.remove).toHaveBeenCalledWith('c-new');
  });
});
