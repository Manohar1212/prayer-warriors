import { useCallback } from 'react';

import { resourcesService } from '../../lib/parse';
import { useCachedQuery } from '../../lib/useCachedQuery';
import type { NewResource, Resource, ResourceType } from './types';

export type ResourcesState = {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: NewResource) => Promise<Resource>;
  update: (id: string, input: NewResource) => Promise<Resource>;
  remove: (id: string) => Promise<void>;
};

export function useResources(type: ResourceType): ResourcesState {
  const { data, loading, error, refresh } = useCachedQuery(`resources:${type}`, () => resourcesService.list(type), { fallback: 'Could not load resources.' });

  const create = useCallback(
    async (input: NewResource) => {
      const created = await resourcesService.create(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: NewResource) => {
      const updated = await resourcesService.update(id, input);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await resourcesService.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { resources: data ?? [], loading, error, refresh, create, update, remove };
}
