import { mapParseError } from '../auth/errors';
import type { JournalEntry, JournalInput, JournalService, PrayerCategory, RawJournalEntry } from './types';

type Store = {
  fetchEntries: () => Promise<RawJournalEntry[]>;
  saveEntry: (input: JournalInput) => Promise<RawJournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
};

function toEntry(row: RawJournalEntry): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? '',
    category: (row.category || 'other') as PrayerCategory,
    answered: Boolean(row.answered),
    createdAt: row.createdAt,
    answeredAt: row.answeredAt ?? null,
  };
}

const newestFirst = (a: JournalEntry, b: JournalEntry) => b.createdAt.localeCompare(a.createdAt);

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    throw mapParseError(err);
  }
}

export function createJournalService(store: Store): JournalService {
  return {
    list: () =>
      guarded(async () => {
        const entries = (await store.fetchEntries()).map(toEntry).sort(newestFirst);
        return {
          active: entries.filter((e) => !e.answered),
          answered: entries.filter((e) => e.answered),
        };
      }),

    save: (input) =>
      guarded(async () => {
        const title = input.title.trim();
        if (!title) throw new Error('Give the entry a short title.');
        const saved = await store.saveEntry({ ...input, title });
        return toEntry(saved);
      }),

    remove: (id) => guarded(() => store.deleteEntry(id)),
  };
}
