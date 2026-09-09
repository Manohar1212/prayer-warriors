const { createCallHandlers, MESSAGES } = require('./calls');

const NOW = new Date('2026-09-09T10:00:00.000Z');
const admin = { callerId: 'admin1' };
const member = { callerId: 'u2' };

function call(o = {}) {
  return { id: 'c1', groupId: 'g1', title: 'Evening prayer', scheduledAt: '2026-09-09T10:05:00.000Z', roomName: 'pw-g1-c1', status: 'scheduled', startedAt: null, endedAt: null, createdById: 'admin1', ...o };
}

function deps({ adminGroupId = 'g1', groupId = 'g1', existing = call(), name = 'Mary', configured = true } = {}) {
  return {
    memberships: {
      findAdminGroupId: jest.fn(async () => adminGroupId),
      findGroupId: jest.fn(async () => groupId),
    },
    calls: {
      create: jest.fn(async (f) => call({ ...f, id: 'cNew', roomName: `pw-${f.groupId}-cNew` })),
      get: jest.fn(async () => existing),
      update: jest.fn(async (id, patch) => call({ ...existing, ...patch })),
    },
    participants: { upsertJoined: jest.fn(async () => undefined), markLeft: jest.fn(async () => undefined) },
    users: { displayName: jest.fn(async () => name) },
    tokens: configured ? { url: 'wss://x.livekit.cloud', mint: jest.fn(() => 'jwt') } : null,
    now: () => NOW,
  };
}

describe('scheduleCall', () => {
  it('creates a scheduled call with a room name', async () => {
    const d = deps();
    const result = await createCallHandlers(d).scheduleCall({ title: ' Evening prayer ', scheduledAt: '2026-09-09T14:30:00.000Z' }, admin);
    expect(d.calls.create).toHaveBeenCalledWith({ groupId: 'g1', title: 'Evening prayer', scheduledAt: new Date('2026-09-09T14:30:00.000Z'), status: 'scheduled', createdById: 'admin1' });
    expect(result.roomName).toBe('pw-g1-cNew');
  });
  it('rejects non-admins', async () => {
    const d = deps({ adminGroupId: null });
    await expect(createCallHandlers(d).scheduleCall({ title: 'x', scheduledAt: '2026-09-09T14:30:00.000Z' }, member)).rejects.toThrow(MESSAGES.adminOnly);
  });
  it.each([
    ['empty title', { title: ' ', scheduledAt: '2026-09-09T14:30:00.000Z' }, 'titleRequired'],
    ['long title', { title: 'x'.repeat(81), scheduledAt: '2026-09-09T14:30:00.000Z' }, 'titleTooLong'],
    ['bad time', { title: 'x', scheduledAt: 'tonight' }, 'invalidTime'],
    ['past time', { title: 'x', scheduledAt: '2026-09-09T08:00:00.000Z' }, 'pastTime'],
  ])('rejects %s', async (_, bad, key) => {
    await expect(createCallHandlers(deps()).scheduleCall(bad, admin)).rejects.toThrow(MESSAGES[key]);
  });
});

describe('joinCall', () => {
  it('returns credentials, marks the call live, and records the participant', async () => {
    const d = deps();
    const result = await createCallHandlers(d).joinCall({ callId: 'c1' }, member);
    expect(d.tokens.mint).toHaveBeenCalledWith({ identity: 'u2', name: 'Mary', room: 'pw-g1-c1', ttlSeconds: 7200 });
    expect(d.calls.update).toHaveBeenCalledWith('c1', { status: 'live', startedAt: NOW });
    expect(d.participants.upsertJoined).toHaveBeenCalledWith('c1', 'u2', 'g1');
    expect(result).toEqual({ url: 'wss://x.livekit.cloud', token: 'jwt', roomName: 'pw-g1-c1' });
  });
  it('does not re-mark a live call', async () => {
    const d = deps({ existing: call({ status: 'live', startedAt: '2026-09-09T09:50:00.000Z' }) });
    await createCallHandlers(d).joinCall({ callId: 'c1' }, member);
    expect(d.calls.update).not.toHaveBeenCalled();
  });
  it('refuses before the join window', async () => {
    const d = deps({ existing: call({ scheduledAt: '2026-09-09T12:00:00.000Z' }) });
    await expect(createCallHandlers(d).joinCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.notJoinable);
  });
  it.each([['ended'], ['cancelled']])('refuses %s calls', async (status) => {
    const d = deps({ existing: call({ status }) });
    await expect(createCallHandlers(d).joinCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.notJoinable);
  });
  it('refuses other groups and non-members', async () => {
    await expect(createCallHandlers(deps({ existing: call({ groupId: 'g2' }) })).joinCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.notFound);
    await expect(createCallHandlers(deps({ groupId: null })).joinCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.notMember);
  });
  it('explains when LiveKit is not configured', async () => {
    await expect(createCallHandlers(deps({ configured: false })).joinCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.notConfigured);
  });
});

describe('leave / end / cancel', () => {
  it('marks the participant as left', async () => {
    const d = deps();
    await createCallHandlers(d).leaveCall({ callId: 'c1' }, member);
    expect(d.participants.markLeft).toHaveBeenCalledWith('c1', 'u2', NOW);
  });
  it('admin ends a call', async () => {
    const d = deps({ existing: call({ status: 'live' }) });
    await createCallHandlers(d).endCall({ callId: 'c1' }, admin);
    expect(d.calls.update).toHaveBeenCalledWith('c1', { status: 'ended', endedAt: NOW });
  });
  it('admin cancels a scheduled call', async () => {
    const d = deps();
    await createCallHandlers(d).cancelCall({ callId: 'c1' }, admin);
    expect(d.calls.update).toHaveBeenCalledWith('c1', { status: 'cancelled' });
  });
  it('members cannot end or cancel', async () => {
    const d = deps({ adminGroupId: null });
    await expect(createCallHandlers(d).endCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.adminOnly);
    await expect(createCallHandlers(d).cancelCall({ callId: 'c1' }, member)).rejects.toThrow(MESSAGES.adminOnly);
  });
});
