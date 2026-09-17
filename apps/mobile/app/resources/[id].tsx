import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { useResources, type Resource } from '@/features/resources';
import { goBackOr } from '@/lib/navigation';
import { useLanguage, type TranslationKey } from '@/i18n';
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

function longDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ResourceScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
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
        <Text variant="muted">{loading ? t('common.loading') : t('resources.detail.notAvailable')}</Text>
      </Screen>
    );
  }

  if (resource.type === 'song') return <Redirect href={{ pathname: '/resources/song', params: { id: resource.id } }} />;

  const typeLabel = t(`resources.type.${resource.type}` as TranslationKey);
  const canRemove = resource.createdById === user?.id || isAdmin;

  async function destroy() {
    if (!resource) return;
    setBusy(true);
    setError(null);
    try {
      await remove(resource.id);
      goBackOr(router, '/(tabs)/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resources.detail.removeFailed'));
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="gap-3">
        <Meta parts={[{ text: typeLabel, dot: resource.type === 'scripture' ? 'sage' : 'blush' }, { text: t('resources.sharedBy', { name: resource.sharedBy }) }]} />
        <Text variant="display" className="text-[22px] leading-[28px]">
          {resource.title}
        </Text>
        {resource.reference ? (
          <Text variant="label" color="gold" className="text-[14px]">
            {resource.reference}
          </Text>
        ) : null}
        <Text variant="caption">{longDate(resource.createdAt, locale)}</Text>
      </View>

      {resource.url ? (
        <Button
          title={t('resources.detail.openLink')}
          onPress={() => Linking.openURL(resource.url).catch(() => setError(t('resources.detail.linkFailed')))}
        />
      ) : null}

      {resource.body ? (
        resource.type === 'scripture' ? (
          <View className="gap-3 border-l-2 border-gold pl-4">
            <Text variant="scripture" className="text-[17px] leading-[27px]">
              {resource.body}
            </Text>
          </View>
        ) : (
          <Text className="text-[15px] leading-[24px]">{resource.body}</Text>
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
            <Text variant="muted">{t('resources.detail.removeConfirm')}</Text>
            <Button title={t('resources.detail.remove')} variant="secondary" onPress={destroy} loading={busy} />
            <Button title={t('common.keepIt')} variant="ghost" onPress={() => setConfirm(false)} />
          </View>
        ) : (
          <Button title={t('resources.detail.remove')} variant="ghost" onPress={() => setConfirm(true)} className="self-start px-0" />
        )
      ) : null}
    </Screen>
  );
}
