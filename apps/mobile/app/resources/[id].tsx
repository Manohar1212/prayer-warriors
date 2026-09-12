import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { RESOURCE_TYPES, useResources, type Resource } from '@/features/resources';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/tokens';
import { Button, Meta, Screen, Text } from '@/ui';

function useResourceById(id: string | undefined): { resource: Resource | null; loading: boolean; remove: (id: string) => Promise<void> } {
  const songs = useResources('song');
  const scripture = useResources('scripture');
  const prayers = useResources('prayer');
  const all = [...songs.resources, ...scripture.resources, ...prayers.resources];
  const resource = all.find((r) => r.id === id) ?? null;
  const loading = songs.loading || scripture.loading || prayers.loading;
  const remove = async (rid: string) => {
    const owner = [songs, scripture, prayers].find((s) => s.resources.some((r) => r.id === rid)) ?? songs;
    await owner.remove(rid);
  };
  return { resource, loading, remove };
}

function longDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ResourceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { resource, loading, remove } = useResourceById(id);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resource) {
    return (
      <Screen edges={['bottom']} backdrop className="justify-center">
        <Text variant="muted">{loading ? 'Loading…' : "That resource isn't available."}</Text>
      </Screen>
    );
  }

  const typeLabel = RESOURCE_TYPES.find((t) => t.id === resource.type)?.label ?? 'Resource';
  const canRemove = resource.createdById === user?.id || isAdmin;

  async function destroy() {
    if (!resource) return;
    setBusy(true);
    setError(null);
    try {
      await remove(resource.id);
      goBackOr(router, '/(tabs)/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this.');
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="gap-3">
        <Meta parts={[{ text: typeLabel, dot: resource.type === 'song' ? 'honey' : resource.type === 'scripture' ? 'sage' : 'blush' }, { text: `Shared by ${resource.sharedBy}` }]} />
        <Text variant="display" color="primary" className="text-[28px] leading-[34px]">
          {resource.title}
        </Text>
        {resource.reference ? (
          <Text variant="label" color="gold" className="text-[14px]">
            {resource.reference}
          </Text>
        ) : null}
        <Text variant="caption">{longDate(resource.createdAt)}</Text>
      </View>

      {resource.url ? (
        <Button
          title={resource.type === 'song' ? 'Play' : 'Open link'}
          onPress={() => Linking.openURL(resource.url).catch(() => setError('Could not open the link.'))}
        />
      ) : null}

      {resource.body ? (
        resource.type === 'scripture' ? (
          <View className="gap-3 border-l-2 border-gold pl-4">
            <Text variant="scripture" className="text-[21px] leading-[33px]">
              {resource.body}
            </Text>
          </View>
        ) : (
          <Text className="text-[17px] leading-[28px]">{resource.body}</Text>
        )
      ) : null}

      {resource.note ? (
        <View className="flex-row gap-3">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.muted} />
          <Text variant="muted" className="flex-1 text-[15px] leading-[22px]">
            {resource.note}
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}

      {canRemove ? (
        confirm ? (
          <View className="gap-2">
            <Text variant="muted">Remove this from the group? This cannot be undone.</Text>
            <Button title="Remove" variant="secondary" onPress={destroy} loading={busy} />
            <Button title="Keep it" variant="ghost" onPress={() => setConfirm(false)} />
          </View>
        ) : (
          <Button title="Remove" variant="ghost" onPress={() => setConfirm(true)} className="self-start px-0" />
        )
      ) : null}
    </Screen>
  );
}
