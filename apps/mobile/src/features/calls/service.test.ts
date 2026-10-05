import { createCallsService } from './service';
import { isJoinable, type GroupCall } from './types';

const rows = [
  { id: 'c1', title: 'Evening prayer', scheduledAt: '2026-09-10T14:00:00.000Z', status: 'scheduled', startedAt: null, endedAt: null, createdBy: { id: 'a' } },
  { id: 'c2', title: 'Morning', scheduledAt: '2026-09-09T05:00:00.000Z', status: 'ended', startedAt: '2026-09-09T05:00:00.000Z', endedAt: '2026-09-09T06:00:00.000Z', createdBy: null },
  { id: 'c3', title: 'Now', scheduledAt: '2026-09-09T09:55:00.000Z', status: 'live', startedAt: '2026-09-09T09:55:00.000Z', endedAt: null, createdBy: { id: 'a' } },
];
const parts = [
  { callId: 'c3', user: { id: 'u1', displayName: 'Shiny' }, leftAt: null },
  { callId: 'c3', user: { id: 'u2', displayName: 'Mary' }, leftAt: '2026-09-09T10:00:00.000Z' },
  { callId: 'c2', user: { id: 'u1', displayName: 'Shiny' }, leftAt: '2026-09-09T06:00:00.000Z' },
];

function svc(cloudResult: unknown = {}) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  const service = createCallsService({
    fetchCalls: async () => rows,
    fetchParticipants: async (id?: string) => (id ? parts.filter((p) => p.callId === id) : parts),
    cloud,
    now: () => new Date('2026-09-09T10:00:00.000Z'),
  });
  return { service, cloud };
}

describe('callsService', () => {
  it('splits upcoming (soonest first) and past (latest first) with participant counts', async () => {
    const { service } = svc();
    const { upcoming, past } = await service.list();
    expect(upcoming.map((c) => c.id)).toEqual(['c3', 'c1']);
    expect(upcoming[0].participantCount).toBe(2);
    expect(past.map((c) => c.id)).toEqual(['c2']);
  });
  it('lists current participants by name', async () => {
    const { service } = svc();
    await expect(service.participants('c3')).resolves.toEqual(['Shiny']);
  });
  it('schedules through the cloud function', async () => {
    const { service, cloud } = svc({ id: 'n', title: 'X', scheduledAt: '2026-09-11T10:00:00.000Z', status: 'scheduled', startedAt: null, endedAt: null, createdById: 'a' });
    const call = await service.schedule('X', new Date('2026-09-11T10:00:00.000Z'));
    expect(cloud.run).toHaveBeenCalledWith('scheduleCall', { title: 'X', scheduledAt: '2026-09-11T10:00:00.000Z' });
    expect(call).toMatchObject({ id: 'n', createdById: 'a', participantCount: 0 });
  });
  it('joins and returns credentials', async () => {
    const creds = { url: 'wss://x', token: 't', roomName: 'r' };
    const { service, cloud } = svc(creds);
    await expect(service.join('c3')).resolves.toEqual(creds);
    expect(cloud.run).toHaveBeenCalledWith('joinCall', { callId: 'c3' });
  });
  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error("This call isn't open right now."), { code: 141 }));
    await expect(service.join('c1')).rejects.toThrow("This call isn't open right now.");
  });
});

describe('callsService stale calls', () => {
  it('moves a call nobody ended into past 12 hours after its scheduled start', async () => {
    const stuck = { id: 'c9', title: 'All-night prayer', scheduledAt: '2026-09-08T17:00:00.000Z', status: 'live', startedAt: '2026-09-08T17:00:00.000Z', endedAt: null, createdBy: { id: 'a' } };
    const service = createCallsService({
      fetchCalls: async () => [stuck],
      fetchParticipants: async () => [],
      cloud: { run: jest.fn() },
      now: () => new Date('2026-09-09T05:00:00.000Z'),
    });
    const { upcoming, past } = await service.list();
    expect(upcoming).toEqual([]);
    expect(past.map((c) => [c.id, c.status])).toEqual([['c9', 'ended']]);
  });
});

describe('isJoinable', () => {
  const base: GroupCall = { id: 'c', title: 't', scheduledAt: '2026-09-09T10:00:00.000Z', status: 'scheduled', startedAt: null, endedAt: null, createdById: null, participantCount: 0 };
  it.each([
    ['15 min before', '2026-09-09T09:45:00.000Z', true],
    ['20 min before', '2026-09-09T09:40:00.000Z', false],
    ['after start', '2026-09-09T10:30:00.000Z', true],
  ])('%s', (_, now, expected) => {
    expect(isJoinable(base, new Date(now))).toBe(expected);
  });
  it('live is always joinable; ended never', () => {
    expect(isJoinable({ ...base, status: 'live' }, new Date('2026-09-01T00:00:00.000Z'))).toBe(true);
    expect(isJoinable({ ...base, status: 'ended' }, new Date('2026-09-09T10:30:00.000Z'))).toBe(false);
  });
});
