const { createPrayerHandlers, MESSAGES, CATEGORIES } = require('./prayer');

const NOW = new Date('2026-09-08T10:00:00.000Z');
const caller = { callerId: 'u1' };

function dto(overrides = {}) {
  return {
    id: 'r1', groupId: 'g1', authorId: 'u1', title: 'Healing', description: '', category: 'family',
    urgency: 'normal', status: 'active', prayingCount: 0, createdAt: NOW.toISOString(),
    answeredAt: null, testimony: null, ...overrides,
  };
}

function deps({ groupId = 'g1', adminGroupId = null, request = dto(), response = null } = {}) {
  return {
    memberships: {
      findGroupId: jest.fn(async () => groupId),
      findAdminGroupId: jest.fn(async () => adminGroupId),
    },
    requests: {
      create: jest.fn(async (fields) => dto({ ...fields, id: 'new1', prayingCount: 0 })),
      get: jest.fn(async () => request),
      update: jest.fn(async (id, patch) => dto({ ...request, ...patch })),
      incrementPraying: jest.fn(async (id, delta) => (request ? request.prayingCount : 0) + delta),
    },
    responses: {
      find: jest.fn(async () => response),
      create: jest.fn(async () => ({ id: 'resp1' })),
      remove: jest.fn(async () => undefined),
    },
    now: () => NOW,
  };
}

describe('createPrayerRequest', () => {
  const input = { title: '  Healing for Mom ', description: ' Surgery Friday ', category: 'family', urgency: 'urgent' };

  it('creates in the caller group with trimmed fields', async () => {
    const d = deps();
    const result = await createPrayerHandlers(d).createPrayerRequest(input, caller);
    expect(d.requests.create).toHaveBeenCalledWith({
      groupId: 'g1', authorId: 'u1', title: 'Healing for Mom', description: 'Surgery Friday',
      category: 'family', urgency: 'urgent', status: 'active', prayingCount: 0,
    });
    expect(result.id).toBe('new1');
  });

  it('defaults urgency to normal and description to empty', async () => {
    const d = deps();
    await createPrayerHandlers(d).createPrayerRequest({ title: 'Peace', category: 'personal' }, caller);
    expect(d.requests.create.mock.calls[0][0]).toMatchObject({ urgency: 'normal', description: '' });
  });

  it('rejects non-members', async () => {
    const d = deps({ groupId: null });
    await expect(createPrayerHandlers(d).createPrayerRequest(input, caller)).rejects.toThrow(MESSAGES.notMember);
    expect(d.requests.create).not.toHaveBeenCalled();
  });

  it.each([
    ['empty title', { ...input, title: '  ' }, 'titleRequired'],
    ['long title', { ...input, title: 'x'.repeat(121) }, 'titleTooLong'],
    ['long description', { ...input, description: 'x'.repeat(2001) }, 'descriptionTooLong'],
    ['bad category', { ...input, category: 'money' }, 'invalidCategory'],
    ['bad urgency', { ...input, urgency: 'asap' }, 'invalidUrgency'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createPrayerHandlers(d).createPrayerRequest(bad, caller)).rejects.toThrow(MESSAGES[key]);
    expect(d.requests.create).not.toHaveBeenCalled();
  });

  it('exposes the category list', () => {
    expect(CATEGORIES).toEqual(['family', 'personal', 'work', 'spiritual', 'relationships', 'other']);
  });
});

describe('togglePraying', () => {
  it('starts praying when no response exists', async () => {
    const d = deps({ request: dto({ prayingCount: 2 }) });
    const result = await createPrayerHandlers(d).togglePraying({ requestId: 'r1' }, { callerId: 'u2' });
    expect(d.responses.create).toHaveBeenCalledWith('r1', 'u2', 'g1');
    expect(d.requests.incrementPraying).toHaveBeenCalledWith('r1', 1);
    expect(result).toEqual({ praying: true, prayingCount: 3 });
  });

  it('stops praying when a response exists', async () => {
    const d = deps({ request: dto({ prayingCount: 2 }), response: { id: 'resp9' } });
    const result = await createPrayerHandlers(d).togglePraying({ requestId: 'r1' }, { callerId: 'u2' });
    expect(d.responses.remove).toHaveBeenCalledWith('resp9');
    expect(d.requests.incrementPraying).toHaveBeenCalledWith('r1', -1);
    expect(result).toEqual({ praying: false, prayingCount: 1 });
  });

  it('rejects missing requests', async () => {
    const d = deps({ request: null });
    await expect(createPrayerHandlers(d).togglePraying({ requestId: 'nope' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });

  it('rejects requests from another group', async () => {
    const d = deps({ request: dto({ groupId: 'g2' }) });
    await expect(createPrayerHandlers(d).togglePraying({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });

  it('rejects answered requests', async () => {
    const d = deps({ request: dto({ status: 'answered' }) });
    await expect(createPrayerHandlers(d).togglePraying({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notActive);
  });

  it('rejects non-members', async () => {
    const d = deps({ groupId: null });
    await expect(createPrayerHandlers(d).togglePraying({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('markAnswered', () => {
  it('lets the author mark answered with a testimony', async () => {
    const d = deps();
    const result = await createPrayerHandlers(d).markAnswered({ requestId: 'r1', testimony: ' God is good ' }, caller);
    expect(d.requests.update).toHaveBeenCalledWith('r1', { status: 'answered', answeredAt: NOW, testimony: 'God is good' });
    expect(result.status).toBe('answered');
  });

  it('lets a group admin mark answered', async () => {
    const d = deps({ adminGroupId: 'g1' });
    await createPrayerHandlers(d).markAnswered({ requestId: 'r1' }, { callerId: 'admin' });
    expect(d.requests.update).toHaveBeenCalledWith('r1', { status: 'answered', answeredAt: NOW, testimony: null });
  });

  it('refuses other members', async () => {
    const d = deps();
    await expect(createPrayerHandlers(d).markAnswered({ requestId: 'r1' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.notAllowed);
    expect(d.requests.update).not.toHaveBeenCalled();
  });

  it('refuses already answered requests', async () => {
    const d = deps({ request: dto({ status: 'answered' }) });
    await expect(createPrayerHandlers(d).markAnswered({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notActive);
  });

  it('rejects a long testimony', async () => {
    const d = deps();
    await expect(createPrayerHandlers(d).markAnswered({ requestId: 'r1', testimony: 'x'.repeat(1001) }, caller)).rejects.toThrow(MESSAGES.testimonyTooLong);
  });

  it('rejects missing requests', async () => {
    const d = deps({ request: null });
    await expect(createPrayerHandlers(d).markAnswered({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });
});
