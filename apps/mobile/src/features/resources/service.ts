import { mapParseError } from '../auth/errors';
import type { NewResource, RawResource, Resource, ResourceDto, ResourceType, ResourcesService } from './types';

type Deps = {
  fetchResources: () => Promise<RawResource[]>;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
};

function base(row: Omit<RawResource, 'createdBy'>): Omit<Resource, 'sharedBy' | 'createdById'> {
  return {
    id: row.id,
    type: row.type as ResourceType,
    title: row.title,
    body: row.body ?? '',
    reference: row.reference ?? '',
    url: row.url ?? '',
    note: row.note ?? '',
    createdAt: row.createdAt,
  };
}

function fromRaw(row: RawResource): Resource {
  return {
    ...base(row),
    sharedBy: row.createdBy?.displayName?.trim() || 'Member',
    createdById: row.createdBy?.id ?? null,
  };
}

function fromDto(dto: ResourceDto): Resource {
  return { ...base(dto), sharedBy: 'You', createdById: dto.createdById };
}

const newestFirst = (a: Resource, b: Resource) => b.createdAt.localeCompare(a.createdAt);

/** Case-insensitive match over title, reference, and body. Empty query matches everything. */
export function matchesQuery(resource: Resource, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [resource.title, resource.reference, resource.body].some((s) => s.toLowerCase().includes(q));
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createResourcesService({ fetchResources, cloud }: Deps): ResourcesService {
  return {
    list: (type) =>
      guarded(async () => {
        const rows = await fetchResources();
        return rows.filter((r) => r.type === type).map(fromRaw).sort(newestFirst);
      }),

    listRecent: (limit) =>
      guarded(async () => {
        const rows = await fetchResources();
        return rows.map(fromRaw).sort(newestFirst).slice(0, limit);
      }),

    create: (input: NewResource) =>
      guarded(async () => fromDto((await cloud.run('createResource', { ...input })) as ResourceDto)),

    update: (id, input: NewResource) =>
      guarded(async () => fromDto((await cloud.run('updateResource', { resourceId: id, ...input })) as ResourceDto)),

    remove: (id) =>
      guarded(async () => {
        await cloud.run('deleteResource', { resourceId: id });
      }),
  };
}
