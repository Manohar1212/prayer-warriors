import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isIsoDate, todayIso } from '@/features/funds/dates';
import { goBackOr } from '@/lib/navigation';
import { callsService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function ScheduleCallScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('Group prayer');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('19:00');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canSubmit = title.trim().length > 0 && isIsoDate(date) && isTime(time);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const [h, m] = time.split(':').map(Number);
      const [y, mo, d] = date.split('-').map(Number);
      await callsService.schedule(title, new Date(y, mo - 1, d, h, m));
      goBackOr(router, '/(tabs)/community');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule the call.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        Members can join from 15 minutes before the start time until you end the call.
      </Text>
      <Input label="Title" value={title} onChangeText={setTitle} maxLength={80} />
      <View className="flex-row gap-3">
        <Input label="Date (YYYY-MM-DD)" className="flex-1" value={date} onChangeText={setDate} autoCapitalize="none" error={date && !isIsoDate(date) ? 'Enter a valid date.' : null} />
        <Input label="Time (24h)" className="w-32" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" error={time && !isTime(time) ? 'Use HH:MM.' : null} />
      </View>
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      <Button title="Schedule call" onPress={submit} loading={busy} disabled={!canSubmit} />
    </Screen>
  );
}
