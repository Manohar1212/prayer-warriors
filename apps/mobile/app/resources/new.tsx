import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { RESOURCE_TYPES, lyricsSearchUrl, useResources, youtubeSearchUrl, type ResourceType } from '@/features/resources';
import { useLanguage, type TranslationKey } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { Button, Chip, Input, Screen, Text } from '@/ui';

const fieldCopy: Record<ResourceType, { title: TranslationKey; reference?: TranslationKey; body: TranslationKey; url?: TranslationKey; intro: TranslationKey }> = {
  song: { intro: 'resources.new.songIntro', title: 'resources.new.songTitle', reference: 'resources.new.artist', url: 'resources.new.link', body: 'resources.new.lyrics' },
  scripture: { intro: 'resources.new.scriptureIntro', title: 'resources.new.reference', body: 'resources.new.verseText', url: 'resources.new.passageLink' },
  prayer: { intro: 'resources.new.prayerIntro', title: 'resources.new.prayerTitle', body: 'resources.new.prayerText' },
};

function isType(value: unknown): value is ResourceType {
  return RESOURCE_TYPES.some((t) => t.id === value);
}

export default function NewResourceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ type?: string; title?: string; body?: string }>();
  const [type, setType] = useState<ResourceType>(isType(params.type) ? params.type : 'song');
  const { create } = useResources(type);
  const [title, setTitle] = useState(params.title ?? '');
  const [reference, setReference] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState(params.body ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [searchHint, setSearchHint] = useState<string | null>(null);

  /** Opens a web search in the browser; the member copies what they find and pastes it here. */
  function openSearch(url: string) {
    if (!title.trim()) {
      setSearchHint(t('resources.new.searchNeedsTitle'));
      return;
    }
    setSearchHint(null);
    Linking.openURL(url).catch(() => setError(t('resources.detail.linkFailed')));
  }

  const copy = fieldCopy[type];
  const canSubmit = title.trim().length > 0 && (body.trim().length > 0 || url.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await create({ type, title, reference, url, body, note });
      goBackOr(router, '/(tabs)/resources');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resources.new.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="flex-row flex-wrap gap-2">
        {RESOURCE_TYPES.map((r) => (
          <Chip key={r.id} label={t(`resources.type.${r.id}` as TranslationKey)} selected={type === r.id} onPress={() => setType(r.id)} />
        ))}
      </View>
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t(copy.intro)}
      </Text>
      <View className="gap-5">
        <Input label={t(copy.title)} value={title} onChangeText={setTitle} maxLength={120} autoFocus />
        {type === 'song' ? (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <Button title={t('resources.new.searchLyrics')} icon="search-outline" variant="secondary" size="compact" className="flex-1" onPress={() => openSearch(lyricsSearchUrl(title))} />
              <Button title={t('resources.new.findVideo')} icon="logo-youtube" variant="secondary" size="compact" className="flex-1" onPress={() => openSearch(youtubeSearchUrl(title))} />
            </View>
            {searchHint ? (
              <Text variant="caption" color="muted">
                {searchHint}
              </Text>
            ) : null}
          </View>
        ) : null}
        {copy.reference ? <Input label={t(copy.reference)} value={reference} onChangeText={setReference} maxLength={80} /> : null}
        {copy.url ? (
          <Input label={t(copy.url)} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" autoComplete="url" />
        ) : null}
        <Input label={t(copy.body)} value={body} onChangeText={setBody} maxLength={4000} multiline style={{ minHeight: 110, textAlignVertical: 'top' }} />
        {type !== 'song' ? (
          <Input label={t('resources.new.note')} value={note} onChangeText={setNote} maxLength={500} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        ) : null}
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button title={t('resources.new.submit')} onPress={submit} loading={busy} disabled={!canSubmit} className="mt-1" />
      </View>
    </Screen>
  );
}
