export type ParseConfig = {
  serverUrl: string;
  appId: string;
  jsKey: string;
};

export type PrayerRequest = {
  id: string;
  title: string;
  details: string;
  author: string;
  prayerCount: number;
  createdAt: string;
};

export type NewPrayerRequest = {
  title: string;
  details: string;
  author: string;
};

type ParseObject = {
  objectId: string;
  title?: string;
  details?: string;
  author?: string;
  prayerCount?: number;
  createdAt: string;
};

const CLASS_NAME = 'PrayerRequest';
const DEFAULT_AUTHOR = 'Anonymous';

function headers(config: ParseConfig): Record<string, string> {
  return {
    'X-Parse-Application-Id': config.appId,
    'X-Parse-JavaScript-Key': config.jsKey,
    'Content-Type': 'application/json',
  };
}

async function parseRequest<T>(
  config: ParseConfig,
  fetchFn: typeof fetch,
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: unknown,
): Promise<T> {
  const response = await fetchFn(`${config.serverUrl}${path}`, {
    method,
    headers: headers(config),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data?.error ?? `Parse request failed (${response.status})`);
  }
  return data;
}

function toPrayerRequest(obj: ParseObject): PrayerRequest {
  return {
    id: obj.objectId,
    title: obj.title ?? '',
    details: obj.details ?? '',
    author: obj.author?.trim() || DEFAULT_AUTHOR,
    prayerCount: obj.prayerCount ?? 0,
    createdAt: obj.createdAt,
  };
}

export async function listPrayerRequests(
  config: ParseConfig,
  fetchFn: typeof fetch = fetch,
): Promise<PrayerRequest[]> {
  const data = await parseRequest<{ results: ParseObject[] }>(
    config,
    fetchFn,
    `/classes/${CLASS_NAME}?order=-createdAt&limit=100`,
    'GET',
  );
  return data.results.map(toPrayerRequest);
}

export async function createPrayerRequest(
  config: ParseConfig,
  input: NewPrayerRequest,
  fetchFn: typeof fetch = fetch,
): Promise<PrayerRequest> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Title is required');
  }
  const payload = {
    title,
    details: input.details.trim(),
    author: input.author.trim() || DEFAULT_AUTHOR,
    prayerCount: 0,
  };
  const data = await parseRequest<{ objectId: string; createdAt: string }>(
    config,
    fetchFn,
    `/classes/${CLASS_NAME}`,
    'POST',
    payload,
  );
  return { id: data.objectId, createdAt: data.createdAt, ...payload };
}

export async function incrementPrayerCount(
  config: ParseConfig,
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<number> {
  const data = await parseRequest<{ prayerCount: number }>(
    config,
    fetchFn,
    `/classes/${CLASS_NAME}/${id}`,
    'PUT',
    { prayerCount: { __op: 'Increment', amount: 1 } },
  );
  return data.prayerCount;
}
