export type PrayerCategory = 'family' | 'personal' | 'work' | 'spiritual' | 'relationships' | 'other';
export type PrayerUrgency = 'normal' | 'urgent';
export type PrayerStatus = 'active' | 'answered' | 'archived';

export const CATEGORIES: { id: PrayerCategory; label: string }[] = [
  { id: 'family', label: 'Family' },
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'spiritual', label: 'Spiritual' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'other', label: 'Other' },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';
}

export type PrayerRequest = {
  id: string;
  title: string;
  description: string;
  category: PrayerCategory;
  urgency: PrayerUrgency;
  status: PrayerStatus;
  authorId: string | null;
  authorName: string;
  prayingCount: number;
  praying: boolean;
  createdAt: string;
  answeredAt: string | null;
  testimony: string | null;
};

export type NewPrayerRequest = {
  title: string;
  description: string;
  category: PrayerCategory;
  urgency: PrayerUrgency;
};

/** A PrayerRequest row as read from Parse with the author included. */
export type RawPrayerRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  prayingCount: number;
  createdAt: string;
  answeredAt: string | null;
  testimony: string | null;
  author: { id: string; displayName?: string } | null;
};

/** DTO returned by the cloud functions. */
export type PrayerRequestDto = Omit<RawPrayerRequest, 'author'> & {
  groupId: string | null;
  authorId: string | null;
};

export type PrayerService = {
  list(status: PrayerStatus): Promise<PrayerRequest[]>;
  create(input: NewPrayerRequest): Promise<PrayerRequest>;
  togglePraying(requestId: string): Promise<{ praying: boolean; prayingCount: number }>;
  markAnswered(requestId: string, testimony: string): Promise<PrayerRequest>;
  prayingMembers(requestId: string): Promise<string[]>;
};

// ---------- journal (private) ----------

export type RawJournalEntry = {
  id: string;
  title: string;
  body: string;
  category: string;
  answered: boolean;
  createdAt: string;
  answeredAt: string | null;
};

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  category: PrayerCategory;
  answered: boolean;
  createdAt: string;
  answeredAt: string | null;
};

export type JournalInput = {
  id?: string;
  title: string;
  body: string;
  category: PrayerCategory;
  answered: boolean;
};

export type JournalService = {
  list(): Promise<{ active: JournalEntry[]; answered: JournalEntry[] }>;
  save(input: JournalInput): Promise<JournalEntry>;
  remove(id: string): Promise<void>;
};
