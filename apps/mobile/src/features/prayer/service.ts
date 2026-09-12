import { mapParseError } from '../auth/errors';
import type {
  NewPrayerRequest,
  PrayerCategory,
  PrayerComment,
  PrayerRequest,
  PrayerRequestDto,
  PrayerService,
  PrayerStatus,
  PrayerUrgency,
  RawPrayerComment,
  RawPrayerRequest,
} from './types';

type Deps = {
  fetchRequests: (status: PrayerStatus) => Promise<RawPrayerRequest[]>;
  fetchMyPrayingRequestIds: () => Promise<string[]>;
  fetchPrayingNames: (requestId: string) => Promise<string[]>;
  fetchComments: (requestId: string) => Promise<RawPrayerComment[]>;
  currentUserName?: () => string;
  cloud: { run(name: string, params?: Record<string, unknown>): Promise<unknown> };
};

function toRequest(
  row: RawPrayerRequest,
  extras: { authorId: string | null; authorName: string; praying: boolean },
): PrayerRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category as PrayerCategory,
    urgency: row.urgency === 'urgent' ? 'urgent' : 'normal',
    status: (row.status as PrayerStatus) ?? 'active',
    prayingCount: row.prayingCount ?? 0,
    createdAt: row.createdAt,
    answeredAt: row.answeredAt ?? null,
    testimony: row.testimony ?? null,
    ...extras,
  } as PrayerRequest & { urgency: PrayerUrgency };
}

function fromRaw(row: RawPrayerRequest, myIds: Set<string>): PrayerRequest {
  return toRequest(row, {
    authorId: row.author?.id ?? null,
    authorName: row.author?.displayName?.trim() || 'Member',
    praying: myIds.has(row.id),
  });
}

function fromDto(dto: PrayerRequestDto, praying = false): PrayerRequest {
  return toRequest({ ...dto, author: null }, { authorId: dto.authorId, authorName: 'You', praying });
}

function urgentFirstThenNewest(a: PrayerRequest, b: PrayerRequest): number {
  if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1;
  return b.createdAt.localeCompare(a.createdAt);
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createPrayerService(deps: Deps): PrayerService {
  return {
    list: (status) =>
      guarded(async () => {
        const [rows, mine] = await Promise.all([
          deps.fetchRequests(status),
          deps.fetchMyPrayingRequestIds(),
        ]);
        const myIds = new Set(mine);
        return rows.map((row) => fromRaw(row, myIds)).sort(urgentFirstThenNewest);
      }),

    create: (input: NewPrayerRequest) =>
      guarded(async () => {
        const dto = (await deps.cloud.run('createPrayerRequest', { ...input })) as PrayerRequestDto;
        return fromDto(dto);
      }),

    togglePraying: (requestId) =>
      guarded(async () => {
        return (await deps.cloud.run('togglePraying', { requestId })) as {
          praying: boolean;
          prayingCount: number;
        };
      }),

    markAnswered: (requestId, testimony) =>
      guarded(async () => {
        const dto = (await deps.cloud.run('markAnswered', { requestId, testimony })) as PrayerRequestDto;
        return fromDto(dto);
      }),

    prayingMembers: (requestId) => guarded(() => deps.fetchPrayingNames(requestId)),

    comments: (requestId) =>
      guarded(async () =>
        (await deps.fetchComments(requestId)).map((row) => ({
          id: row.id,
          body: row.body,
          authorId: row.user?.id ?? null,
          authorName: row.user?.displayName?.trim() || 'Member',
          createdAt: row.createdAt,
        })),
      ),

    addComment: (requestId, body) =>
      guarded(async () => {
        const dto = (await deps.cloud.run('addPrayerComment', { requestId, body })) as { id: string; body: string; userId: string; createdAt: string | null };
        const comment: PrayerComment = { id: dto.id, body: dto.body, authorId: dto.userId, authorName: deps.currentUserName?.() || 'You', createdAt: dto.createdAt ?? new Date().toISOString() };
        return comment;
      }),
  };
}
