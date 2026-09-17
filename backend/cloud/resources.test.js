const { createResourceHandlers, MESSAGES, TYPES } = require('./resources');

const caller = { callerId: 'u1' };

function dto(overrides = {}) {
  return {
    id: 'res1', groupId: 'g1', createdById: 'u1', type: 'song', title: 'Amazing Grace',
    body: '', reference: '', url: '', note: '', createdAt: '2026-09-08T10:00:00.000Z', ...overrides,
  };
}

function deps({ groupId = 'g1', adminGroupId = null, resource = dto() } = {}) {
  return {
    memberships: {
      findGroupId: jest.fn(async () => groupId),
      findAdminGroupId: jest.fn(async () => adminGroupId),
    },
    resources: {
      create: jest.fn(async (fields) => dto({ ...fields, id: 'new1' })),
      get: jest.fn(async () => resource),
      update: jest.fn(async (id, patch) => dto({ ...patch, id })),
      remove: jest.fn(async () => undefined),
    },
  };
}

describe('createResource', () => {
  const input = {
    type: 'song', title: '  Amazing Grace ', reference: ' John Newton ',
    url: ' https://youtu.be/abc ', body: ' Amazing grace, how sweet the sound ', note: ' Our Sunday song ',
  };

  it('creates in the caller group with trimmed fields', async () => {
    const d = deps();
    const result = await createResourceHandlers(d).createResource(input, caller);
    expect(d.resources.create).toHaveBeenCalledWith({
      groupId: 'g1', createdById: 'u1', type: 'song', title: 'Amazing Grace', reference: 'John Newton',
      url: 'https://youtu.be/abc', body: 'Amazing grace, how sweet the sound', note: 'Our Sunday song',
    });
    expect(result.id).toBe('new1');
  });

  it('defaults optional fields to empty strings', async () => {
    const d = deps();
    await createResourceHandlers(d).createResource({ type: 'prayer', title: 'Morning prayer', body: 'Lord…' }, caller);
    expect(d.resources.create.mock.calls[0][0]).toMatchObject({ reference: '', url: '', note: '' });
  });

  it('rejects non-members', async () => {
    const d = deps({ groupId: null });
    await expect(createResourceHandlers(d).createResource(input, caller)).rejects.toThrow(MESSAGES.notMember);
  });

  it.each([
    ['bad type', { ...input, type: 'video' }, 'invalidType'],
    ['empty title', { ...input, title: ' ' }, 'titleRequired'],
    ['long title', { ...input, title: 'x'.repeat(121) }, 'titleTooLong'],
    ['long body', { ...input, body: 'x'.repeat(4001) }, 'bodyTooLong'],
    ['long reference', { ...input, reference: 'x'.repeat(81) }, 'referenceTooLong'],
    ['long note', { ...input, note: 'x'.repeat(501) }, 'noteTooLong'],
    ['bad url', { ...input, url: 'javascript:alert(1)' }, 'invalidUrl'],
    ['ftp url', { ...input, url: 'ftp://x' }, 'invalidUrl'],
    ['nothing to share', { type: 'scripture', title: 'James 5:16' }, 'nothingToShare'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createResourceHandlers(d).createResource(bad, caller)).rejects.toThrow(MESSAGES[key]);
    expect(d.resources.create).not.toHaveBeenCalled();
  });

  it('accepts a link with no text', async () => {
    const d = deps();
    await expect(createResourceHandlers(d).createResource({ type: 'song', title: 'Oceans', url: 'https://open.spotify.com/x' }, caller)).resolves.toBeTruthy();
  });

  it('exposes the type list', () => {
    expect(TYPES).toEqual(['song', 'scripture', 'prayer']);
  });
});

describe('deleteResource', () => {
  it('lets the creator delete', async () => {
    const d = deps();
    await expect(createResourceHandlers(d).deleteResource({ resourceId: 'res1' }, caller)).resolves.toEqual({ deleted: true });
    expect(d.resources.remove).toHaveBeenCalledWith('res1');
  });
  it('lets a group admin delete', async () => {
    const d = deps({ adminGroupId: 'g1' });
    await createResourceHandlers(d).deleteResource({ resourceId: 'res1' }, { callerId: 'admin' });
    expect(d.resources.remove).toHaveBeenCalledWith('res1');
  });
  it('refuses other members', async () => {
    const d = deps();
    await expect(createResourceHandlers(d).deleteResource({ resourceId: 'res1' }, { callerId: 'u2' })).rejects.toThrow(MESSAGES.notAllowed);
    expect(d.resources.remove).not.toHaveBeenCalled();
  });
  it('rejects missing resources', async () => {
    const d = deps({ resource: null });
    await expect(createResourceHandlers(d).deleteResource({ resourceId: 'x' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });
  it('rejects resources from another group', async () => {
    const d = deps({ resource: dto({ groupId: 'g2' }) });
    await expect(createResourceHandlers(d).deleteResource({ resourceId: 'res1' }, caller)).rejects.toThrow(MESSAGES.notFound);
  });
  it('rejects non-members', async () => {
    const d = deps({ groupId: null });
    await expect(createResourceHandlers(d).deleteResource({ resourceId: 'res1' }, caller)).rejects.toThrow(MESSAGES.notMember);
  });
});

describe('updateResource', () => {
  const patch = { resourceId: 'res1', title: ' Amazing Grace ', reference: 'John Newton', url: '', body: ' Amazing grace ', note: '' };

  it('lets the creator fix the fields', async () => {
    const d = deps();
    const result = await createResourceHandlers(d).updateResource(patch, caller);
    expect(d.resources.update).toHaveBeenCalledWith('res1', { title: 'Amazing Grace', reference: 'John Newton', url: '', body: 'Amazing grace', note: '' });
    expect(result.title).toBe('Amazing Grace');
  });

  it('lets an admin edit someone else’s song, but not another member', async () => {
    const other = dto({ createdById: 'u9' });
    await expect(createResourceHandlers(deps({ resource: other, adminGroupId: 'g1' })).updateResource(patch, caller)).resolves.toBeTruthy();
    await expect(createResourceHandlers(deps({ resource: other })).updateResource(patch, caller)).rejects.toThrow(MESSAGES.notAllowedEdit);
  });

  it('validates like a new resource', async () => {
    const h = createResourceHandlers(deps());
    await expect(h.updateResource({ ...patch, title: ' ' }, caller)).rejects.toThrow(MESSAGES.titleRequired);
    await expect(h.updateResource({ ...patch, body: '', url: '' }, caller)).rejects.toThrow(MESSAGES.nothingToShare);
    await expect(h.updateResource({ ...patch, url: 'ftp://x' }, caller)).rejects.toThrow(MESSAGES.invalidUrl);
    await expect(createResourceHandlers(deps({ resource: null })).updateResource(patch, caller)).rejects.toThrow(MESSAGES.notFound);
  });
});
