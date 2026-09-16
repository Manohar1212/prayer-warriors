import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useT } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { prayerPointsService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

/** Admin: add or rename one of the regular monthly prayer points, or remove it from the list. */
export default function PrayerPointScreen() {
  const router = useRouter();
  const t = useT();
  const { id, title: initial } = useLocalSearchParams<{ id?: string; title?: string }>();
  const [title, setTitle] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await work();
      goBackOr(router, '/(tabs)/prayer');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.points.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-5 pt-5">
      <Text variant="muted">{t('prayer.points.editIntro')}</Text>
      <Input label={t('prayer.points.titleLabel')} placeholder={t('prayer.points.titlePlaceholder')} value={title} onChangeText={setTitle} maxLength={120} autoFocus error={error} />
      <Button title={t('common.save')} onPress={() => run(() => (id ? prayerPointsService.update(id, title) : prayerPointsService.add(title)))} loading={busy} disabled={!title.trim()} />
      {id ? (
        <View className="mt-2">
          <Button title={t('prayer.points.remove')} variant="danger" onPress={() => run(() => prayerPointsService.remove(id))} disabled={busy} />
        </View>
      ) : null}
    </Screen>
  );
}
