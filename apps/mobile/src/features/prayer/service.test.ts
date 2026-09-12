import { createPrayerService } from './service';
import type { RawPrayerRequest } from './types';

const raw = (overrides: Partial<RawPrayerRequest>): RawPrayerRequest => ({
  id: 'r1',
  title: 'Healing',
  description: '',
  category: 'family',
  urgency: 'normal',
  status: 'active',
  prayingCount: 0,
  createdAt: '2026-09-08T10:00:00.000Z',
  answeredAt: null,
  testimony: null,
  author: { id: 'u1', displayName: 'Shiny' },
  ...overrides,
});

const rows: RawPrayerRequest[] = [
  raw({ id: 'old', title: 'Old normal', createdAt: '2026-09-01T10:00:00.000Z' }),
  raw({ id: 'urg', title: 'Urgent', urgency: 'urgent', createdAt: '2026-09-02T10:00:00.000Z', prayingCount: 3 }),
  raw({ id: 'new', title: 'New normal', createdAt: '2026-09-08T10:00:00.000Z', author: null }),
];

function svc(cloudResult: unknown = {}, myIds: string[] = ['urg']) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  const service = createPrayerService({
    fetchRequests: jest.fn(async () => rows),
    fetchMyPrayingRequestIds: jest.fn(async () => myIds),
    fetchPrayingNames: jest.fn(async () => ['Shiny', 'Mary']),
    fetchComments: jest.fn(async () => []),
    cloud,
  });
  return { service, cloud };
}

describe('prayerService.list', () => {
  it('sorts urgent first then newest and marks the ones I am praying for', async () => {
    const { service } = svc();
    const list = await service.list('active');
    expect(list.map((r) => r.id)).toEqual(['urg', 'new', 'old']);
    expect(list[0]).toMatchObject({ praying: true, prayingCount: 3, authorName: 'Shiny' });
    expect(list[1]).toMatchObject({ praying: false, authorName: 'Member' });
  });
});

describe('prayerService writes', () => {
  it('creates through the cloud function', async () => {
    const created = raw({ id: 'x' });
    const { service, cloud } = svc({ ...created, groupId: 'g1', authorId: 'u1' });
    const result = await service.create({ title: 'Peace', description: 'For the family', category: 'personal', urgency: 'normal' });
    expect(cloud.run).toHaveBeenCalledWith('createPrayerRequest', {
      title: 'Peace', description: 'For the family', category: 'personal', urgency: 'normal',
    });
    expect(result.id).toBe('x');
  });

  it('toggles praying', async () => {
    const { service, cloud } = svc({ praying: true, prayingCount: 4 });
    await expect(service.togglePraying('r1')).resolves.toEqual({ praying: true, prayingCount: 4 });
    expect(cloud.run).toHaveBeenCalledWith('togglePraying', { requestId: 'r1' });
  });

  it('marks answered', async () => {
    const { service, cloud } = svc({ ...raw({ status: 'answered', testimony: 'Thank you' }), groupId: 'g1', authorId: 'u1' });
    const result = await service.markAnswered('r1', 'Thank you');
    expect(cloud.run).toHaveBeenCalledWith('markAnswered', { requestId: 'r1', testimony: 'Thank you' });
    expect(result.status).toBe('answered');
  });

  it('lists who is praying', async () => {
    const { service } = svc();
    await expect(service.prayingMembers('r1')).resolves.toEqual(['Shiny', 'Mary']);
  });

  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error('Give your request a short title.'), { code: 141 }));
    await expect(service.create({ title: '', description: '', category: 'family', urgency: 'normal' })).rejects.toThrow(
      'Give your request a short title.',
    );
  });
});
