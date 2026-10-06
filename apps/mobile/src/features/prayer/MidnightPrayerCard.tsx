import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useLanguage } from '@/i18n';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Text } from '@/ui';

import { dayLabel, midnightCard, useMidnightTonight } from './midnight';

/** Home: who prays at 12:00 AM tonight; on your night, a reminder and then "I prayed". */
export function MidnightPrayerCard() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { data, refresh } = useMidnightTonight(midnightService);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Focus already refetches (useCachedQuery); coming back to the app does not, and tonight's
  // card moves on at 11 PM and at midnight.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  if (!data || !user) return null;
  const card = midnightCard(data, user.id);
  if (card.kind === 'hidden') return null;

  async function confirm(day: string) {
    setBusy(true);
    setError(null);
    try {
      await midnightService.markPrayed(day);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  const headline =
    card.kind === 'other' ? t('midnight.other', { name: card.name }) : card.kind === 'yours' ? t('midnight.yours') : card.kind === 'confirm' ? t('midnight.confirmTitle') : t('midnight.prayed');
  const sub = card.kind === 'other' && card.myNext ? t('midnight.next', { date: dayLabel(card.myNext, locale) }) : null;

  return (
    <Card className="gap-3 p-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('midnight.title')}. ${headline}${sub ? `. ${sub}` : ''}`}
        onPress={() => router.push('/prayer/midnight')}
        className="flex-row items-center gap-3.5 active:opacity-90"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-lavender">
          <Ionicons name={card.kind === 'prayed' ? 'checkmark' : 'moon'} size={22} color={colors.violet} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="caption">{t('midnight.title')}</Text>
          <Text variant="label" className="text-[15px]">
            {headline}
          </Text>
          {sub ? <Text variant="caption">{sub}</Text> : null}
        </View>
      </Pressable>
      {card.kind === 'confirm' ? <Button title={t('midnight.confirm')} size="compact" onPress={() => confirm(card.day)} loading={busy} disabled={busy} /> : null}
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
    </Card>
  );
}
