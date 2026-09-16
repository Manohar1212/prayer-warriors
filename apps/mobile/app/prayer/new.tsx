import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CATEGORIES, usePrayerRequests, type PrayerCategory } from '@/features/prayer';
import { useLanguage, type TranslationKey } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { Button, Chip, Input, Screen, Text } from '@/ui';

export default function NewPrayerRequestScreen() {
  const router = useRouter();
  const { t } = useLanguage();
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
      goBackOr(router, '/(tabs)/prayer');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prayer.new.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll backdrop className="gap-7 pt-6">
      <Text variant="muted" className="text-[15px] leading-[22px]">
        {t('prayer.new.intro')}
      </Text>
      <View className="gap-5">
        <Input label={t('prayer.new.what')} value={title} onChangeText={setTitle} maxLength={120} autoFocus />
        <Input
          label={t('prayer.new.details')}
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          multiline
          className="min-h-[96px]"
          style={{ minHeight: 96, textAlignVertical: 'top' }}
        />
        <View className="gap-2">
          <Text variant="label">{t('common.category')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={t(`prayer.category.${c.id}` as TranslationKey)} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: urgent }}
          onPress={() => setUrgent((u) => !u)}
          className="flex-row items-center justify-between rounded-[14px] border border-border bg-surface px-4 py-3"
        >
          <View className="gap-0.5">
            <Text variant="label">{t('prayer.new.urgent')}</Text>
            <Text variant="muted" className="text-[13px]">
              {t('prayer.new.urgentHint')}
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
        <Button title={t('prayer.new.post')} onPress={submit} loading={busy} disabled={!canSubmit} className="mt-1" />
      </View>
    </Screen>
  );
}
