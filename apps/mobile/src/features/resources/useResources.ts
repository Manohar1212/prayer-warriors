import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { resourcesService } from '../../lib/parse';
import type { NewResource, Resource, ResourceType } from './types';

export type ResourcesState = {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: NewResource) => Promise<Resource>;
  remove: (id: string) => Promise<void>;
};

export function useResources(type: ResourceType): ResourcesState {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setResources(await resourcesService.list(type));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load resources.');
    }
  }, [type]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = useCallback(
    async (input: NewResource) => {
      const created = await resourcesService.create(input);
      await load();
      return created;
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await resourcesService.remove(id);
      await load();
    },
    [load],
  );

  return { resources, loading, error, refresh: load, create, remove };
}
