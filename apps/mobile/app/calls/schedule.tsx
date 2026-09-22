import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isIsoDate, todayIso } from '@/features/funds/dates';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { callsService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function ScheduleCallScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState(() => t('calls.schedule.defaultTitle'));
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
      setError(err instanceof Error ? err.message : t('calls.schedule.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-6 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t('calls.schedule.intro')}
      </Text>
      <Input label={t('calls.schedule.callTitle')} value={title} onChangeText={setTitle} maxLength={80} />
      <View className="flex-row gap-3">
        <Input label={t('common.date')} className="flex-1" value={date} onChangeText={setDate} autoCapitalize="none" error={date && !isIsoDate(date) ? t('common.invalidDate') : null} />
        <Input label={t('calls.schedule.time')} className="w-32" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" error={time && !isTime(time) ? t('calls.schedule.invalidTime') : null} />
      </View>
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
      <Button title={t('calls.schedule.submit')} onPress={submit} loading={busy} disabled={!canSubmit} />
    </Screen>
  );
}
