const { createMemberHandlers, MESSAGES } = require('./members');

function deps({ adminGroupId = 'g1', existing = null, target = { id: 'gm2', groupId: 'g1', userId: 'u2', role: 'member', status: 'active' }, adminCount = 2 } = {}) {
  return {
    memberships: {
      findAdminGroupId: jest.fn(async () => adminGroupId),
      create: jest.fn(async () => ({ id: 'gm1' })),
      findActive: jest.fn(async () => target),
      countActiveAdmins: jest.fn(async () => adminCount),
      deactivate: jest.fn(async () => undefined),
    },
    users: {
      findByEmail: jest.fn(async () => existing),
      create: jest.fn(async () => ({ id: 'u2' })),
    },
    roles: { addUser: jest.fn(async () => undefined), removeUser: jest.fn(async () => undefined) },
    sessions: { revokeAll: jest.fn(async () => undefined) },
    pushTokens: { removeAllForUser: jest.fn(async () => undefined) },
    prayerPoints: { releaseClaims: jest.fn(async () => undefined) },
    generatePassword: jest.fn(() => 'Starting123'),
    now: () => new Date('2026-09-21T06:00:00.000Z'),
  };
}

const caller = { callerId: 'admin1' };
const input = { displayName: '  Mary ', email: 'Mary@Example.com', phone: '+919876543210' };

describe('addMember', () => {
  it('creates the user, role, and membership, marks the password as temporary, and returns it once', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).addMember(input, caller);
    expect(d.users.create).toHaveBeenCalledWith({
      username: 'mary@example.com',
      email: 'mary@example.com',
      password: 'Starting123',
      displayName: 'Mary',
      phone: '+919876543210',
      mustSetPassword: true,
    });
    expect(d.roles.addUser).toHaveBeenCalledWith('g1', 'member', 'u2');
    expect(d.memberships.create).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u2', role: 'member' });
    expect(result).toEqual({
      id: 'u2',
      displayName: 'Mary',
      email: 'mary@example.com',
      phone: '+919876543210',
      startingPassword: 'Starting123',
    });
  });

  it('allows a missing phone', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).addMember(
      { displayName: 'Mary', email: 'm@e.com' },
      caller,
    );
    expect(d.users.create.mock.calls[0][0].phone).toBeUndefined();
    expect(result.phone).toBeNull();
  });

  it('rejects anonymous callers', async () => {
    const d = deps();
    await expect(createMemberHandlers(d).addMember(input, {})).rejects.toThrow(MESSAGES.adminOnly);
    expect(d.memberships.findAdminGroupId).not.toHaveBeenCalled();
  });

  it('rejects non-admins before touching users', async () => {
    const d = deps({ adminGroupId: null });
    await expect(createMemberHandlers(d).addMember(input, caller)).rejects.toThrow(
      MESSAGES.adminOnly,
    );
    expect(d.users.findByEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['missing name', { ...input, displayName: '  ' }, 'nameRequired'],
    ['bad email', { ...input, email: 'nope' }, 'invalidEmail'],
    ['bad phone', { ...input, phone: '12345' }, 'invalidPhone'],
  ])('rejects %s', async (_, bad, key) => {
    const d = deps();
    await expect(createMemberHandlers(d).addMember(bad, caller)).rejects.toThrow(MESSAGES[key]);
    expect(d.users.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email', async () => {
    const d = deps({ existing: { id: 'u9' } });
    await expect(createMemberHandlers(d).addMember(input, caller)).rejects.toThrow(
      MESSAGES.duplicate,
    );
    expect(d.users.create).not.toHaveBeenCalled();
  });
});

describe('removeMember', () => {
  it('deactivates the membership, drops both roles and locks the member out', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).removeMember({ userId: 'u2' }, caller);
    expect(d.memberships.deactivate).toHaveBeenCalledWith({ id: 'gm2', removedBy: 'admin1', removedAt: d.now() });
    expect(d.roles.removeUser).toHaveBeenCalledWith('g1', 'member', 'u2');
    expect(d.roles.removeUser).toHaveBeenCalledWith('g1', 'admin', 'u2');
    expect(d.sessions.revokeAll).toHaveBeenCalledWith('u2');
    expect(d.pushTokens.removeAllForUser).toHaveBeenCalledWith('u2');
    expect(result).toEqual({ userId: 'u2' });
  });

  it('frees the monthly prayer point the member was holding', async () => {
    const d = deps();
    await createMemberHandlers(d).removeMember({ userId: 'u2' }, caller);
    expect(d.prayerPoints.releaseClaims).toHaveBeenCalledWith({ groupId: 'g1', userId: 'u2' });
  });

  it('rejects anonymous callers and non-admins', async () => {
    await expect(createMemberHandlers(deps()).removeMember({ userId: 'u2' }, {})).rejects.toThrow(MESSAGES.adminOnlyRemove);
    const notAdmin = deps({ adminGroupId: null });
    await expect(createMemberHandlers(notAdmin).removeMember({ userId: 'u2' }, caller)).rejects.toThrow(MESSAGES.adminOnlyRemove);
    expect(notAdmin.memberships.deactivate).not.toHaveBeenCalled();
  });

  it('refuses to remove yourself', async () => {
    const d = deps({ target: { id: 'gm1', groupId: 'g1', userId: 'admin1', role: 'admin', status: 'active' } });
    await expect(createMemberHandlers(d).removeMember({ userId: 'admin1' }, caller)).rejects.toThrow(MESSAGES.notYourself);
    expect(d.memberships.deactivate).not.toHaveBeenCalled();
  });

  it('refuses to remove the last admin', async () => {
    const d = deps({ target: { id: 'gm3', groupId: 'g1', userId: 'u3', role: 'admin', status: 'active' }, adminCount: 1 });
    await expect(createMemberHandlers(d).removeMember({ userId: 'u3' }, caller)).rejects.toThrow(MESSAGES.lastAdmin);
    expect(d.memberships.deactivate).not.toHaveBeenCalled();
  });

  it('refuses someone who is not an active member of the group', async () => {
    const d = deps({ target: null });
    await expect(createMemberHandlers(d).removeMember({ userId: 'nope' }, caller)).rejects.toThrow(MESSAGES.notAMember);
    const other = deps({ target: { id: 'gm9', groupId: 'g2', userId: 'u9', role: 'member', status: 'active' } });
    await expect(createMemberHandlers(other).removeMember({ userId: 'u9' }, caller)).rejects.toThrow(MESSAGES.notAMember);
  });

  it('needs a user id', async () => {
    await expect(createMemberHandlers(deps()).removeMember({}, caller)).rejects.toThrow(MESSAGES.notAMember);
  });
});
