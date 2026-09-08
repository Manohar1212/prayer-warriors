export type ResourceType = 'song' | 'scripture' | 'prayer';

export const RESOURCE_TYPES: { id: ResourceType; label: string; plural: string }[] = [
  { id: 'song', label: 'Song', plural: 'Songs' },
  { id: 'scripture', label: 'Scripture', plural: 'Scripture' },
  { id: 'prayer', label: 'Prayer', plural: 'Prayers' },
];

export type Resource = {
  id: string;
  type: ResourceType;
  title: string;
  body: string;
  reference: string;
  url: string;
  note: string;
  sharedBy: string;
  createdById: string | null;
  createdAt: string;
};

export type NewResource = {
  type: ResourceType;
  title: string;
  body: string;
  reference: string;
  url: string;
  note: string;
};

export type RawResource = {
  id: string;
  type: string;
  title: string;
  body: string;
  reference: string;
  url: string;
  note: string;
  createdAt: string;
  createdBy: { id: string; displayName?: string } | null;
};

export type ResourceDto = Omit<RawResource, 'createdBy'> & {
  groupId: string | null;
  createdById: string | null;
};

export type ResourcesService = {
  list(type: ResourceType): Promise<Resource[]>;
  create(input: NewResource): Promise<Resource>;
  remove(id: string): Promise<void>;
};
