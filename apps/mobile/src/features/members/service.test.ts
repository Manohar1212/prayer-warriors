import { createMembersService } from './service';

const rows = [
  { id: 'm2', role: 'member', status: 'active', user: { id: 'u2', displayName: 'Mary' } },
  { id: 'm1', role: 'admin', status: 'active', user: { id: 'u1', displayName: 'Shiny' } },
  { id: 'm3', role: 'member', status: 'active', user: { id: 'u3', displayName: 'Anna' } },
  { id: 'm4', role: 'member', status: 'active', user: null },
];

function svc(cloudResult: unknown = {}) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  return { service: createMembersService({ fetchMemberships: async () => rows, cloud }), cloud };
}

describe('membersService', () => {
  it('lists admins first, then members by name, dropping rows without a user', async () => {
    const { service } = svc();
    const members = await service.list();
    expect(members.map((m) => m.displayName)).toEqual(['Shiny', 'Anna', 'Mary']);
    expect(members[0]).toEqual({
      id: 'm1',
      userId: 'u1',
      displayName: 'Shiny',
      role: 'admin',
      status: 'active',
    });
  });

  it('falls back to "Member" when a name is missing', async () => {
    const service = createMembersService({
      fetchMemberships: async () => [{ id: 'm', role: 'member', status: 'active', user: { id: 'u' } }],
      cloud: { run: jest.fn() },
    });
    expect((await service.list())[0].displayName).toBe('Member');
  });

  it('adds a member through the cloud function', async () => {
    const added = { id: 'u9', displayName: 'Mary', email: 'm@e.com', phone: null, startingPassword: 'x' };
    const { service, cloud } = svc(added);
    await expect(service.add({ displayName: 'Mary', email: 'm@e.com' })).resolves.toEqual(added);
    expect(cloud.run).toHaveBeenCalledWith('addMember', {
      displayName: 'Mary',
      email: 'm@e.com',
      phone: undefined,
    });
  });

  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(
      Object.assign(new Error('Only admins can add members.'), { code: 141 }),
    );
    await expect(service.add({ displayName: 'M', email: 'm@e.com' })).rejects.toThrow(
      'Only admins can add members.',
    );
  });
});
