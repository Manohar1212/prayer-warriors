import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { lyricsSearchUrl, numberSongs, SongReader, ToolButton, useResources } from '@/features/resources';
import { useLanguage } from '@/i18n';
import { useKeepScreenOn } from '@/lib/keepAwake';
import { goBackOr } from '@/lib/navigation';
import { Button, Screen, Text } from '@/ui';

/** One of the group's own songs, sung from the book with the screen kept on. */
export default function SongScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { resources, loading, remove } = useResources('song');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useKeepScreenOn('songbook');

  const songs = numberSongs(resources);
  const index = songs.findIndex((s) => s.id === id);
  const song = index >= 0 ? songs[index] : null;
  const previous = index > 0 ? songs[index - 1] : null;
  const next = index >= 0 && index < songs.length - 1 ? songs[index + 1] : null;

  if (!song) {
    return (
      <Screen edges={['bottom']} className="justify-center">
        <Text variant="muted" className="text-center">
          {loading ? t('common.loading') : t('resources.detail.notAvailable')}
        </Text>
      </Screen>
    );
  }

  const canEdit = song.createdById === user?.id || isAdmin;
  const open = (songId: string) => router.setParams({ id: songId });
  const edit = () => router.push({ pathname: '/resources/new', params: { id: song.id, type: 'song' } });

  async function destroy() {
    if (!song) return;
    setBusy(true);
    setError(null);
    try {
      await remove(song.id);
      goBackOr(router, '/(tabs)/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resources.detail.removeFailed'));
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="pt-4">
      <SongReader
        number={song.number}
        title={song.title}
        subtitle={song.reference || undefined}
        body={song.body}
        numberLabel={t('resources.song.number', { n: song.number })}
        previous={previous ? { number: previous.number, title: previous.title } : null}
        next={next ? { number: next.number, title: next.title } : null}
        onPrevious={() => previous && open(previous.id)}
        onNext={() => next && open(next.id)}
        labels={{ smaller: t('resources.song.smaller'), larger: t('resources.song.larger'), previous: t('resources.song.previous'), next: t('resources.song.next') }}
        tools={
          <>
            {song.url ? <ToolButton icon="play" label={t('resources.detail.play')} onPress={() => Linking.openURL(song.url).catch(() => setError(t('resources.detail.linkFailed')))} /> : null}
            {canEdit ? <ToolButton icon="create-outline" label={t('resources.song.edit')} onPress={edit} /> : null}
          </>
        }
        empty={
          <View className="gap-3 rounded-[14px] bg-panel p-4">
            <Text variant="muted">{t('resources.song.noLyrics')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {canEdit ? <Button title={t('resources.song.addLyrics')} icon="create-outline" size="compact" onPress={edit} /> : null}
              <Button title={t('resources.detail.searchLyrics')} icon="search-outline" variant="secondary" size="compact" onPress={() => Linking.openURL(lyricsSearchUrl(song.title)).catch(() => setError(t('resources.detail.linkFailed')))} />
            </View>
          </View>
        }
        footer={
          <>
            {error ? (
              <Text variant="caption" color="roseDeep">
                {error}
              </Text>
            ) : null}
            {canEdit ? (
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
          </>
        }
      />
    </Screen>
  );
}
