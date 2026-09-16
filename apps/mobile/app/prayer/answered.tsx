import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useT } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { prayerPointsService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

/** Close a monthly prayer point for good: it stops returning and moves to Answered. */
export default function PointAnsweredScreen() {
  const router = useRouter();
  const t = useT();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [testimony, setTestimony] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await prayerPointsService.markAnswered(id, testimony);
      goBackOr(router, '/(tabs)/prayer');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.points.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-5 pt-5">
      <Text variant="title" className="text-[20px]">
        {title}
      </Text>
      <Text variant="muted">{t('prayer.points.answeredIntro')}</Text>
      <Input label={t('prayer.detail.testimony')} value={testimony} onChangeText={setTestimony} maxLength={1000} multiline autoFocus error={error} />
      <Button title={t('prayer.points.markAnswered')} icon="sparkles-outline" onPress={submit} loading={busy} />
    </Screen>
  );
}
