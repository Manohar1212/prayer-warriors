import { createJournalService } from './journal';
import type { RawJournalEntry } from './types';

const rows: RawJournalEntry[] = [
  { id: 'a', title: 'Career', body: '', category: 'work', answered: false, createdAt: '2026-09-01T00:00:00.000Z', answeredAt: null },
  { id: 'b', title: 'Safe journey', body: 'Flight home', category: 'family', answered: true, createdAt: '2026-09-02T00:00:00.000Z', answeredAt: '2026-09-05T00:00:00.000Z' },
  { id: 'c', title: 'Peace', body: '', category: 'spiritual', answered: false, createdAt: '2026-09-03T00:00:00.000Z', answeredAt: null },
];

function svc() {
  const store = {
    fetchEntries: jest.fn(async () => rows),
    saveEntry: jest.fn(async (input) => ({ ...rows[0], ...input, id: input.id ?? 'new' })),
    deleteEntry: jest.fn(async () => undefined),
  };
  return { service: createJournalService(store), store };
}

describe('journalService', () => {
  it('lists newest first, split into active and answered', async () => {
    const { service } = svc();
    const { active, answered } = await service.list();
    expect(active.map((e) => e.id)).toEqual(['c', 'a']);
    expect(answered.map((e) => e.id)).toEqual(['b']);
  });

  it('saves a new entry and an edit', async () => {
    const { service, store } = svc();
    await service.save({ title: ' Hope ', body: 'x', category: 'personal', answered: false });
    expect(store.saveEntry).toHaveBeenCalledWith({ title: 'Hope', body: 'x', category: 'personal', answered: false });
    await service.save({ id: 'a', title: 'Career', body: '', category: 'work', answered: true });
    expect(store.saveEntry.mock.calls[1][0]).toMatchObject({ id: 'a', answered: true });
  });

  it('rejects an empty title before saving', async () => {
    const { service, store } = svc();
    await expect(service.save({ title: '  ', body: '', category: 'other', answered: false })).rejects.toThrow('Give the entry a short title.');
    expect(store.saveEntry).not.toHaveBeenCalled();
  });

  it('deletes', async () => {
    const { service, store } = svc();
    await service.remove('a');
    expect(store.deleteEntry).toHaveBeenCalledWith('a');
  });
});
