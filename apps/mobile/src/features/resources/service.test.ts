import { createResourcesService, matchesQuery } from './service';
import type { RawResource, Resource } from './types';

const raw = (o: Partial<RawResource>): RawResource => ({
  id: 'r1', type: 'song', title: 'Amazing Grace', body: '', reference: '', url: '', note: '',
  createdAt: '2026-09-08T10:00:00.000Z', createdBy: { id: 'u1', displayName: 'Shiny' }, ...o,
});

const rows: RawResource[] = [
  raw({ id: 'a', type: 'song', title: 'Oceans', reference: 'Hillsong', url: 'https://youtu.be/x', createdAt: '2026-09-01T00:00:00.000Z' }),
  raw({ id: 'b', type: 'scripture', title: 'James 5:16', body: 'The prayer of a righteous person…', createdAt: '2026-09-02T00:00:00.000Z', createdBy: null }),
  raw({ id: 'c', type: 'song', title: 'Amazing Grace', body: 'Amazing grace how sweet the sound', createdAt: '2026-09-03T00:00:00.000Z' }),
];

function svc(cloudResult: unknown = {}) {
  const cloud = { run: jest.fn(async () => cloudResult) };
  return { service: createResourcesService({ fetchResources: async () => rows, cloud }), cloud };
}

describe('resourcesService.list', () => {
  it('filters by type, newest first, with a sharer name fallback', async () => {
    const { service } = svc();
    const songs = await service.list('song');
    expect(songs.map((r) => r.id)).toEqual(['c', 'a']);
    expect(songs[1]).toMatchObject({ sharedBy: 'Shiny', url: 'https://youtu.be/x' });
    const scripture = await service.list('scripture');
    expect(scripture).toHaveLength(1);
    expect(scripture[0].sharedBy).toBe('Member');
  });
});

describe('resourcesService.listRecent', () => {
  it('returns the newest across all types', async () => {
    const { service } = svc();
    const recent = await service.listRecent(2);
    expect(recent.map((r) => r.id)).toEqual(['c', 'b']);
  });
});

describe('matchesQuery', () => {
  const r: Resource = { id: 'x', type: 'song', title: 'Oceans', body: 'Spirit lead me', reference: 'Hillsong', url: '', note: '', sharedBy: 'S', createdById: 'u', createdAt: '' };
  it.each([['ocean', true], ['HILLSONG', true], ['lead me', true], ['grace', false], ['', true]])('%s → %s', (q, expected) => {
    expect(matchesQuery(r, q)).toBe(expected);
  });
});

describe('resourcesService writes', () => {
  it('creates through the cloud function', async () => {
    const dto = { ...raw({ id: 'n' }), createdBy: undefined, groupId: 'g', createdById: 'u1' };
    const { service, cloud } = svc(dto);
    const created = await service.create({ type: 'song', title: 'Oceans', body: '', reference: 'Hillsong', url: 'https://youtu.be/x', note: '' });
    expect(cloud.run).toHaveBeenCalledWith('createResource', { type: 'song', title: 'Oceans', body: '', reference: 'Hillsong', url: 'https://youtu.be/x', note: '' });
    expect(created.id).toBe('n');
  });
  it('removes through the cloud function', async () => {
    const { service, cloud } = svc({ deleted: true });
    await service.remove('a');
    expect(cloud.run).toHaveBeenCalledWith('deleteResource', { resourceId: 'a' });
  });
  it('passes cloud messages through', async () => {
    const { service, cloud } = svc();
    cloud.run.mockRejectedValueOnce(Object.assign(new Error('Add some text or a link.'), { code: 141 }));
    await expect(service.create({ type: 'song', title: 'x', body: '', reference: '', url: '', note: '' })).rejects.toThrow('Add some text or a link.');
  });
});
