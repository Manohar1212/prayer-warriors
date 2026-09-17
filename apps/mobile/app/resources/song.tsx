import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { lyricsSearchUrl, matchesSong, numberSongs, SONG_TEXT_SIZES, songTextStyle, useResources, useSongTextSize, verses } from '@/features/resources';
import { useLanguage } from '@/i18n';
import { useKeepScreenOn } from '@/lib/keepAwake';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/tokens';
import { Button, Screen, Text } from '@/ui';

function ToolButton({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} className={`h-10 w-10 items-center justify-center rounded-full border border-border bg-surface ${disabled ? 'opacity-30' : 'active:opacity-70'}`}>
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

/** One page of the songbook: big lyrics to sing from, with the screen kept on. */
export default function SongScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { resources, loading, remove } = useResources('song');
  const [size, setSize] = useSongTextSize();
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
  const sizeAt = SONG_TEXT_SIZES.indexOf(size);
  const style = songTextStyle[size];
  const open = (songId: string) => router.setParams({ id: songId });

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
    <Screen edges={['bottom']} scroll className="gap-5 pt-4">
      <View className="gap-1">
        <Text variant="label" color="gold" className="text-[13px] uppercase tracking-[1px]">
          {t('resources.song.number', { n: song.number })}
        </Text>
        <Text variant="display" className="text-[24px] leading-[31px]">
          {song.title}
        </Text>
        {song.reference ? <Text variant="muted">{song.reference}</Text> : null}
      </View>

      <View className="flex-row items-center gap-2">
        <ToolButton icon="remove" label={t('resources.song.smaller')} disabled={sizeAt === 0} onPress={() => setSize(SONG_TEXT_SIZES[sizeAt - 1])} />
        <ToolButton icon="add" label={t('resources.song.larger')} disabled={sizeAt === SONG_TEXT_SIZES.length - 1} onPress={() => setSize(SONG_TEXT_SIZES[sizeAt + 1])} />
        <View className="flex-1" />
        {song.url ? <ToolButton icon="play" label={t('resources.detail.play')} onPress={() => Linking.openURL(song.url).catch(() => setError(t('resources.detail.linkFailed')))} /> : null}
        {canEdit ? <ToolButton icon="create-outline" label={t('resources.song.edit')} onPress={() => router.push({ pathname: '/resources/new', params: { id: song.id, type: 'song' } })} /> : null}
      </View>

      {song.body ? (
        <View className="gap-5 py-1">
          {verses(song.body).map((verse, i) => (
            <Text key={i} style={{ fontSize: style.fontSize, lineHeight: style.lineHeight }}>
              {verse}
            </Text>
          ))}
        </View>
      ) : (
        <View className="gap-3 rounded-[14px] bg-panel p-4">
          <Text variant="muted">{t('resources.song.noLyrics')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {canEdit ? <Button title={t('resources.song.addLyrics')} icon="create-outline" size="compact" onPress={() => router.push({ pathname: '/resources/new', params: { id: song.id, type: 'song' } })} /> : null}
            <Button title={t('resources.detail.searchLyrics')} icon="search-outline" variant="secondary" size="compact" onPress={() => Linking.openURL(lyricsSearchUrl(song.title)).catch(() => setError(t('resources.detail.linkFailed')))} />
          </View>
        </View>
      )}

      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}

      <View className="flex-row gap-3 border-t border-border pt-4">
        <Pressable accessibilityRole="button" accessibilityLabel={t('resources.song.previous')} disabled={!previous} onPress={() => previous && open(previous.id)} className={`flex-1 flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3 py-3 ${previous ? 'active:opacity-70' : 'opacity-40'}`}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <View className="flex-1">
            <Text variant="caption" color="muted">
              {t('resources.song.previous')}
            </Text>
            <Text variant="label" numberOfLines={1}>
              {previous ? `${previous.number}. ${previous.title}` : '—'}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('resources.song.next')} disabled={!next} onPress={() => next && open(next.id)} className={`flex-1 flex-row items-center gap-2 rounded-[12px] border border-border bg-surface px-3 py-3 ${next ? 'active:opacity-70' : 'opacity-40'}`}>
          <View className="flex-1">
            <Text variant="caption" color="muted" className="text-right">
              {t('resources.song.next')}
            </Text>
            <Text variant="label" className="text-right" numberOfLines={1}>
              {next ? `${next.number}. ${next.title}` : '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

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
    </Screen>
  );
}
