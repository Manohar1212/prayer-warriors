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
      remove: jest.fn(async () => undefined),
    },
    responses: {
      find: jest.fn(async () => response),
      create: jest.fn(async () => ({ id: 'resp1' })),
      remove: jest.fn(async () => undefined),
      removeAllFor: jest.fn(async () => undefined),
    },
    comments: { removeAllFor: jest.fn(async () => undefined) },
    points: { unlinkRequest: jest.fn(async () => undefined) },
    notifications: { removeByRoute: jest.fn(async () => undefined) },
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

describe('deletePrayerRequest', () => {
  it('lets the asker delete, taking the taps, comments and notifications with it and unlinking the monthly point', async () => {
    const d = deps();
    await expect(createPrayerHandlers(d).deletePrayerRequest({ requestId: 'r1' }, caller)).resolves.toEqual({ id: 'r1' });
    expect(d.responses.removeAllFor).toHaveBeenCalledWith('r1');
    expect(d.comments.removeAllFor).toHaveBeenCalledWith('r1');
    expect(d.points.unlinkRequest).toHaveBeenCalledWith('r1');
    expect(d.notifications.removeByRoute).toHaveBeenCalledWith('/prayer/r1');
    expect(d.requests.remove).toHaveBeenCalledWith('r1');
  });

  it('lets a group admin delete an answered request', async () => {
    const d = deps({ adminGroupId: 'g1', request: dto({ status: 'answered' }) });
    await createPrayerHandlers(d).deletePrayerRequest({ requestId: 'r1' }, { callerId: 'admin' });
    expect(d.requests.remove).toHaveBeenCalledWith('r1');
  });

  it('refuses other members and touches nothing', async () => {
    const d = deps();
    await expect(createPrayerHandlers(d).deletePrayerRequest({ requestId: 'r1' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.notAllowedDelete);
    expect(d.responses.removeAllFor).not.toHaveBeenCalled();
    expect(d.requests.remove).not.toHaveBeenCalled();
  });

  it('refuses a request from another group', async () => {
    const d = deps({ request: dto({ groupId: 'g2' }) });
    await expect(createPrayerHandlers(d).deletePrayerRequest({ requestId: 'r1' }, caller)).rejects.toThrow(MESSAGES.notFound);
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

describe('addComment', () => {
  function deps({ groupId = 'g1', request = { id: 'r1', groupId: 'g1', authorId: 'a1', title: 'Healing', status: 'active' } } = {}) {
    return {
      memberships: { findGroupId: jest.fn(async () => groupId), findAdminGroupId: jest.fn(async () => null) },
      requests: { get: jest.fn(async () => request) },
      responses: {},
      comments: { create: jest.fn(async (f) => ({ id: 'c1', body: f.body, userId: f.userId, createdAt: '2026-09-12T00:00:00.000Z' })) },
    };
  }
  it('stores a trimmed comment and returns request context for notifications', async () => {
    const d = deps();
    const result = await createPrayerHandlers(d).addComment({ requestId: 'r1', body: '  Praying with you  ' }, { callerId: 'u2' });
    expect(d.comments.create).toHaveBeenCalledWith({ requestId: 'r1', userId: 'u2', groupId: 'g1', body: 'Praying with you' });
    expect(result).toMatchObject({ id: 'c1', body: 'Praying with you', requestId: 'r1', requestTitle: 'Healing', requestAuthorId: 'a1' });
  });
  it('rejects empty and overlong comments', async () => {
    const d = deps();
    await expect(createPrayerHandlers(d).addComment({ requestId: 'r1', body: '   ' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.commentRequired);
    await expect(createPrayerHandlers(d).addComment({ requestId: 'r1', body: 'x'.repeat(501) }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.commentTooLong);
  });
  it('rejects non-members and requests outside the group', async () => {
    await expect(createPrayerHandlers(deps({ groupId: null })).addComment({ requestId: 'r1', body: 'hi' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.notMember);
    await expect(createPrayerHandlers(deps({ request: { id: 'r1', groupId: 'other', authorId: 'a1', title: 'x', status: 'active' } })).addComment({ requestId: 'r1', body: 'hi' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.notFound);
  });
});
