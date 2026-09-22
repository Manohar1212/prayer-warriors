import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { joinPointTitle, splitPointTitle } from '@/features/prayer';
import { useT } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { prayerPointsService } from '@/lib/parse';
import { Button, Input, Screen, Text } from '@/ui';

/** Admin: add or rename one of the regular monthly prayer points, or remove it from the list. */
export default function PrayerPointScreen() {
  const router = useRouter();
  const t = useT();
  const { id, title: initial } = useLocalSearchParams<{ id?: string; title?: string }>();
  // The point and the people it names are edited apart, one name per line, as the list shows them.
  const parts = splitPointTitle(initial ?? '');
  const [title, setTitle] = useState(parts.heading);
  const [names, setNames] = useState(parts.names.join('\n'));
  const full = joinPointTitle(title, names.split('\n'));
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
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
      <Input label={t('prayer.points.titleLabel')} placeholder={t('prayer.points.titlePlaceholder')} value={title} onChangeText={setTitle} maxLength={120} autoFocus />
      <Input
        label={t('prayer.points.namesLabel')}
        placeholder={t('prayer.points.namesPlaceholder')}
        value={names}
        onChangeText={setNames}
        multiline
        style={{ minHeight: 140, textAlignVertical: 'top' }}
        error={error ?? (full.length > 120 ? t('prayer.points.tooLong') : null)}
      />
      <Button title={t('common.save')} onPress={() => run(() => (id ? prayerPointsService.update(id, full) : prayerPointsService.add(full)))} loading={busy} disabled={!title.trim() || full.length > 120} />
      {id ? (
        <View className="mt-2">
          {/* Two taps, like removing a member: a system alert does nothing on web. */}
          {confirmRemove ? (
            <View className="gap-2 rounded-[12px] bg-panel p-3">
              <Text variant="caption">{t('prayer.points.removeConfirm')}</Text>
              <View className="flex-row gap-2">
                <Button title={t('common.keepIt')} size="compact" variant="secondary" className="flex-1" disabled={busy} onPress={() => setConfirmRemove(false)} />
                <Button title={t('prayer.points.remove')} size="compact" variant="danger" className="flex-1" loading={busy} onPress={() => run(() => prayerPointsService.remove(id))} />
              </View>
            </View>
          ) : (
            <Button title={t('prayer.points.remove')} variant="danger" onPress={() => setConfirmRemove(true)} disabled={busy} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}
