const { createMemberHandlers, MESSAGES } = require('./members');

function deps({ adminGroupId = 'g1', existing = null } = {}) {
  return {
    memberships: {
      findAdminGroupId: jest.fn(async () => adminGroupId),
      create: jest.fn(async () => ({ id: 'gm1' })),
    },
    users: {
      findByEmail: jest.fn(async () => existing),
      create: jest.fn(async () => ({ id: 'u2' })),
    },
    roles: { addUser: jest.fn(async () => undefined) },
    generatePassword: jest.fn(() => 'Starting123'),
  };
}

const caller = { callerId: 'admin1' };
const input = { displayName: '  Mary ', email: 'Mary@Example.com', phone: '+919876543210' };

describe('addMember', () => {
  it('creates the user, role, and membership and returns the starting password once', async () => {
    const d = deps();
    const result = await createMemberHandlers(d).addMember(input, caller);
    expect(d.users.create).toHaveBeenCalledWith({
      username: 'mary@example.com',
      email: 'mary@example.com',
      password: 'Starting123',
      displayName: 'Mary',
      phone: '+919876543210',
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
