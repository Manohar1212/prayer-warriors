import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CATEGORIES, usePrayerRequests, type PrayerCategory } from '@/features/prayer';
import { Button, Chip, Input, Screen, Text } from '@/ui';

export default function NewPrayerRequestScreen() {
  const router = useRouter();
  const { create } = usePrayerRequests('active');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PrayerCategory | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length > 0 && category !== null;

  async function submit() {
    if (!canSubmit || !category) return;
    setBusy(true);
    setError(null);
    try {
      await create({ title, description, category, urgency: urgent ? 'urgent' : 'normal' });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll backdrop className="gap-7 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        Everyone in the group will see this and can pray with you.
      </Text>
      <View className="gap-5">
        <Input label="What can we pray for?" value={title} onChangeText={setTitle} maxLength={120} autoFocus />
        <Input
          label="Details (optional)"
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          multiline
          className="min-h-[96px]"
          style={{ minHeight: 96, textAlignVertical: 'top' }}
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
          accessibilityState={{ checked: urgent }}
          onPress={() => setUrgent((u) => !u)}
          className="flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
        >
          <View className="gap-0.5">
            <Text variant="label">Urgent</Text>
            <Text variant="muted" className="text-[13px]">
              Shown first, with an Urgent tag.
            </Text>
          </View>
          <View className={`h-7 w-12 rounded-full p-1 ${urgent ? 'bg-primary' : 'bg-border'}`}>
            <View className={`h-5 w-5 rounded-full bg-surface ${urgent ? 'ml-auto' : ''}`} />
          </View>
        </Pressable>
        {error ? (
          <Text variant="muted" color="rose">
            {error}
          </Text>
        ) : null}
        <Button title="Post request" onPress={submit} loading={busy} disabled={!canSubmit} className="mt-1" />
      </View>
    </Screen>
  );
}
