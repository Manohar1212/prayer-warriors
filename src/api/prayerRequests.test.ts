import {
  createPrayerRequest,
  incrementPrayerCount,
  listPrayerRequests,
  type ParseConfig,
} from './prayerRequests';

const config: ParseConfig = {
  serverUrl: 'https://parseapi.back4app.com',
  appId: 'app-id',
  jsKey: 'js-key',
};

function mockFetch(status: number, body: unknown) {
  return jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe('listPrayerRequests', () => {
  it('queries the PrayerRequest class newest-first and maps results', async () => {
    const fetchFn = mockFetch(200, {
      results: [
        {
          objectId: 'abc',
          title: 'Healing for Mom',
          details: 'Surgery on Friday',
          author: 'Sam',
          prayerCount: 3,
          createdAt: '2026-09-07T10:00:00.000Z',
        },
      ],
    });

    const result = await listPrayerRequests(config, fetchFn);

    expect(result).toEqual([
      {
        id: 'abc',
        title: 'Healing for Mom',
        details: 'Surgery on Friday',
        author: 'Sam',
        prayerCount: 3,
        createdAt: '2026-09-07T10:00:00.000Z',
      },
    ]);
    const [url, init] = (fetchFn as jest.Mock).mock.calls[0];
    expect(url).toBe(
      'https://parseapi.back4app.com/classes/PrayerRequest?order=-createdAt&limit=100',
    );
    expect(init.method).toBe('GET');
    expect(init.headers['X-Parse-Application-Id']).toBe('app-id');
    expect(init.headers['X-Parse-JavaScript-Key']).toBe('js-key');
  });

  it('defaults missing optional fields', async () => {
    const fetchFn = mockFetch(200, {
      results: [{ objectId: 'x', title: 'T', createdAt: '2026-01-01T00:00:00.000Z' }],
    });
    const [item] = await listPrayerRequests(config, fetchFn);
    expect(item).toMatchObject({ details: '', author: 'Anonymous', prayerCount: 0 });
  });

  it('throws with the Parse error message on failure', async () => {
    const fetchFn = mockFetch(401, { code: 209, error: 'unauthorized' });
    await expect(listPrayerRequests(config, fetchFn)).rejects.toThrow('unauthorized');
  });
});

describe('createPrayerRequest', () => {
  it('posts the request with prayerCount 0 and returns the new record', async () => {
    const fetchFn = mockFetch(201, {
      objectId: 'new1',
      createdAt: '2026-09-07T11:00:00.000Z',
    });

    const created = await createPrayerRequest(
      config,
      { title: 'Peace', details: 'For the family', author: 'Ana' },
      fetchFn,
    );

    const [url, init] = (fetchFn as jest.Mock).mock.calls[0];
    expect(url).toBe('https://parseapi.back4app.com/classes/PrayerRequest');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      title: 'Peace',
      details: 'For the family',
      author: 'Ana',
      prayerCount: 0,
    });
    expect(created).toEqual({
      id: 'new1',
      title: 'Peace',
      details: 'For the family',
      author: 'Ana',
      prayerCount: 0,
      createdAt: '2026-09-07T11:00:00.000Z',
    });
  });

  it('rejects an empty title without calling the server', async () => {
    const fetchFn = mockFetch(201, {});
    await expect(
      createPrayerRequest(config, { title: '   ', details: '', author: '' }, fetchFn),
    ).rejects.toThrow('Title is required');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('incrementPrayerCount', () => {
  it('sends an atomic Increment op and returns the new count', async () => {
    const fetchFn = mockFetch(200, {
      updatedAt: '2026-09-07T12:00:00.000Z',
      prayerCount: 4,
    });

    const count = await incrementPrayerCount(config, 'abc', fetchFn);

    const [url, init] = (fetchFn as jest.Mock).mock.calls[0];
    expect(url).toBe('https://parseapi.back4app.com/classes/PrayerRequest/abc');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({
      prayerCount: { __op: 'Increment', amount: 1 },
    });
    expect(count).toBe(4);
  });
});
