import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isIsoDate } from '@/features/funds/dates';
import { usePrayerNight } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { prayerNightService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Admin: set the date and time of this month's all-night prayer and announce it. */
export default function PrayerNightScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { night, loading } = usePrayerNight(prayerNightService);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00');
  const [note, setNote] = useState('');
  const [filled, setFilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (night && !filled) {
    const at = new Date(night.scheduledAt);
    setDate(`${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`);
    setTime(`${pad(at.getHours())}:${pad(at.getMinutes())}`);
    setNote(night.note);
    setFilled(true);
  }
  const canSubmit = isIsoDate(date) && isTime(time) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const [y, mo, d] = date.split('-').map(Number);
      const [h, m] = time.split(':').map(Number);
      const result = await prayerNightService.schedule(new Date(y, mo - 1, d, h, m), note);
      if (result.shortNotice) {
        setNotice(t('prayer.night.form.shortNotice'));
        setBusy(false);
        return;
      }
      goBackOr(router, { pathname: '/(tabs)/prayer', params: { tab: 'monthly' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.night.form.failed'));
      setBusy(false);
    }
  }

  async function cancelNight() {
    if (!night) return;
    setBusy(true);
    setError(null);
    try {
      await prayerNightService.cancel(night.id);
      goBackOr(router, { pathname: '/(tabs)/prayer', params: { tab: 'monthly' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.night.form.failed'));
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-6 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t('prayer.night.form.intro')}
      </Text>
      <View className="flex-row gap-3">
        <Input label={t('common.date')} className="flex-1" value={date} onChangeText={setDate} autoCapitalize="none" placeholder="2026-10-03" error={date && !isIsoDate(date) ? t('common.invalidDate') : null} />
        <Input label={t('calls.schedule.time')} className="w-32" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" error={time && !isTime(time) ? t('calls.schedule.invalidTime') : null} />
      </View>
      <Input label={t('prayer.night.form.note')} value={note} onChangeText={setNote} maxLength={300} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <View className="gap-3 rounded-[12px] bg-honey p-4">
          <Text variant="body">{notice}</Text>
          <Button title={t('common.done')} size="compact" onPress={() => goBackOr(router, { pathname: '/(tabs)/prayer', params: { tab: 'monthly' } })} />
        </View>
      ) : (
        <Button title={t(night ? 'prayer.night.form.update' : 'prayer.night.form.submit')} icon="megaphone-outline" onPress={submit} loading={busy} disabled={!canSubmit || loading} />
      )}
      {night ? (
        confirmCancel ? (
          <View className="gap-2">
            <Text variant="muted">{t('prayer.night.form.cancelConfirm')}</Text>
            <Button title={t('prayer.night.form.cancel')} variant="danger" onPress={cancelNight} loading={busy} />
            <Button title={t('common.keepIt')} variant="ghost" onPress={() => setConfirmCancel(false)} />
          </View>
        ) : (
          <Button title={t('prayer.night.form.cancel')} variant="ghost" onPress={() => setConfirmCancel(true)} className="self-start px-0" />
        )
      ) : null}
    </Screen>
  );
}
