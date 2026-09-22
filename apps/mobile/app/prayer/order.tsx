import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useNightOrder } from '@/features/prayer';
import { useT } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { prayerNightService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

/** Admin: the steps of the all-night prayer, one per line. */
export default function NightOrderScreen() {
  const router = useRouter();
  const t = useT();
  const { items, loading, error: loadError, refresh } = useNightOrder(prayerNightService);
  const [text, setText] = useState<string | null>(null);
  const value = text ?? items.join('\n');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await prayerNightService.setOrder(value.split('\n'));
      await refresh();
      goBackOr(router, '/(tabs)/prayer');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.order.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-5 pt-5">
      <Text variant="muted">{t('prayer.order.intro')}</Text>
      <Input label={t('prayer.order.label')} value={value} onChangeText={setText} multiline editable={!loading} style={{ minHeight: 220, textAlignVertical: 'top' }} error={error ?? loadError} />
      {/* Saving before the steps have loaded would replace them with an empty list. */}
      <Button title={t('common.save')} onPress={save} loading={busy} disabled={loading || Boolean(loadError)} />
    </Screen>
  );
}
