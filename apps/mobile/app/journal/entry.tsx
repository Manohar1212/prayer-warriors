import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CATEGORIES, useJournal, type PrayerCategory } from '@/features/prayer';
import { goBackOr } from '@/lib/navigation';
import { Button, Chip, Input, Screen, Text } from '@/ui';

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { active, answered, loading, save, remove } = useJournal();
  const existing = id ? [...active, ...answered].find((e) => e.id === id) ?? null : null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('personal');
  const [isAnswered, setIsAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || !existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setCategory(existing.category);
    setIsAnswered(existing.answered);
    setLoaded(true);
  }, [existing, loaded]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await save({ id: existing?.id, title, body, category, answered: isAnswered });
      goBackOr(router, '/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the entry.');
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!existing) return;
    setBusy(true);
    try {
      await remove(existing.id);
      goBackOr(router, '/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the entry.');
      setBusy(false);
    }
  }

  if (id && !existing && loading) {
    return (
      <Screen edges={['bottom']} backdrop className="justify-center">
        <Text variant="muted">Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-7 pt-6">
      <View className="gap-5">
        <Input label="What are you praying for?" value={title} onChangeText={setTitle} maxLength={120} autoFocus={!existing} />
        <Input
          label="Notes (optional)"
          value={body}
          onChangeText={setBody}
          maxLength={4000}
          multiline
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
        <View className="gap-2">
          <Text variant="label">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: isAnswered }}
          onPress={() => setIsAnswered((a) => !a)}
          className="flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
        >
          <View className="gap-0.5">
            <Text variant="label">Answered</Text>
            <Text variant="muted" className="text-[13px]">
              Moves this entry to your answered prayers.
            </Text>
          </View>
          <View className={`h-7 w-12 rounded-full p-1 ${isAnswered ? 'bg-gold' : 'bg-border'}`}>
            <View className={`h-5 w-5 rounded-full bg-surface ${isAnswered ? 'ml-auto' : ''}`} />
          </View>
        </Pressable>
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button title={existing ? 'Save changes' : 'Save entry'} onPress={submit} loading={busy} disabled={!title.trim()} className="mt-1" />
        {existing ? (
          confirmDelete ? (
            <View className="gap-2">
              <Text variant="muted">Delete this entry? This cannot be undone.</Text>
              <Button title="Delete entry" variant="secondary" onPress={destroy} loading={busy} />
              <Button title="Keep it" variant="ghost" onPress={() => setConfirmDelete(false)} />
            </View>
          ) : (
            <Button title="Delete entry" variant="ghost" onPress={() => setConfirmDelete(true)} className="self-start px-0" />
          )
        ) : null}
      </View>
    </Screen>
  );
}
