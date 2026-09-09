import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { RESOURCE_TYPES, useResources, type ResourceType } from '@/features/resources';
import { goBackOr } from '@/lib/navigation';
import { Button, Chip, Input, Screen, Text } from '@/ui';

const fieldCopy: Record<
  ResourceType,
  { title: string; reference?: string; body: string; url?: string; intro: string }
> = {
  song: {
    intro: 'A link to YouTube or Spotify is the easiest way to share a song.',
    title: 'Song title',
    reference: 'Artist (optional)',
    url: 'Link (optional)',
    body: 'A line of lyrics or why you love it (optional)',
  },
  scripture: {
    intro: 'Share a verse and, if you like, a word about what it means to you.',
    title: 'Reference, e.g. James 5:16',
    body: 'Verse text',
    url: 'Link to the passage (optional)',
  },
  prayer: {
    intro: 'A written prayer the group can pray together.',
    title: 'Prayer title',
    body: 'Prayer text',
  },
};

function isType(value: unknown): value is ResourceType {
  return RESOURCE_TYPES.some((t) => t.id === value);
}

export default function NewResourceScreen() {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : 'Could not share this.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <View className="flex-row flex-wrap gap-2">
        {RESOURCE_TYPES.map((t) => (
          <Chip key={t.id} label={t.label} selected={type === t.id} onPress={() => setType(t.id)} />
        ))}
      </View>
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {copy.intro}
      </Text>
      <View className="gap-5">
        <Input label={copy.title} value={title} onChangeText={setTitle} maxLength={120} autoFocus />
        {copy.reference ? <Input label={copy.reference} value={reference} onChangeText={setReference} maxLength={80} /> : null}
        {copy.url ? (
          <Input label={copy.url} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" autoComplete="url" />
        ) : null}
        <Input label={copy.body} value={body} onChangeText={setBody} maxLength={4000} multiline style={{ minHeight: 110, textAlignVertical: 'top' }} />
        {type !== 'song' ? (
          <Input label="A note for the group (optional)" value={note} onChangeText={setNote} maxLength={500} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        ) : null}
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button title="Share with the group" onPress={submit} loading={busy} disabled={!canSubmit} className="mt-1" />
      </View>
    </Screen>
  );
}
