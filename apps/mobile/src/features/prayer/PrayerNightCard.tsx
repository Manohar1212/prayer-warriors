import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useLanguage } from '../../i18n';
import { colors } from '../../theme/tokens';
import { Button, Card, Text } from '../../ui';
import type { PrayerNight } from './night';

type Props = { night: PrayerNight | null; isAdmin: boolean; compact?: boolean };

const JOIN_WINDOW_MS = 15 * 60 * 1000;

/** True from 15 minutes before the start, like any group call. */
export function nightCallOpen(night: PrayerNight, now: Date): boolean {
  return Boolean(night.callId) && now.getTime() >= new Date(night.scheduledAt).getTime() - JOIN_WINDOW_MS;
}

export function nightWhen(night: PrayerNight, locale: string): string {
  return new Date(night.scheduledAt).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

/** The month's all-night prayer: date, countdown, and the admin's way to set or move it. */
export function PrayerNightCard({ night, isAdmin, compact = false }: Props) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const open = () => router.push('/prayer/night');

  if (!night) {
    if (!isAdmin && compact) return null;
    return (
      <Card tone="honey" className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-surface">
          <Ionicons name="moon-outline" size={20} color={colors.gold} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="label" className="text-[15px]">
            {t('prayer.night.title')}
          </Text>
          <Text variant="caption">{isAdmin ? t('prayer.night.noneAdmin') : t('prayer.night.none')}</Text>
        </View>
        {isAdmin ? <Button title={t('prayer.night.schedule')} size="compact" onPress={open} /> : null}
      </Card>
    );
  }

  const countdown = night.daysUntil === 0 ? t('prayer.night.tonight') : night.daysUntil === 1 ? t('prayer.night.tomorrow') : t('prayer.night.inDays', { n: night.daysUntil });

  return (
    <Card tone="forest" className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <Ionicons name="moon" size={20} color={colors.gold} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="caption" color="creamSoft" className="uppercase tracking-[1px]">
            {t('prayer.night.title')}
          </Text>
          <Text variant="label" color="cream" className="text-[16px]">
            {nightWhen(night, locale)}
          </Text>
        </View>
        <View className="rounded-full bg-honey px-3 py-1.5">
          <Text variant="label" color="ink" className="text-[12px]">
            {countdown}
          </Text>
        </View>
      </View>
      {!compact ? (
        <View className="gap-2">
          {night.note ? (
            <Text variant="body" color="creamSoft">
              {night.note}
            </Text>
          ) : null}
          <Text variant="caption" color="creamSoft">
            {night.reminding ? t('prayer.night.reminding') : t('prayer.night.pickHint')}
          </Text>
          {!night.callId ? null : nightCallOpen(night, new Date()) ? (
            <Text variant="caption" color="creamSoft">
              {t('prayer.night.callOpen')}
            </Text>
          ) : (
            <Text variant="caption" color="creamSoft">
              {t('prayer.night.callScheduled')}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2">
            {night.callId && nightCallOpen(night, new Date()) ? (
              <Button title={t('calls.join')} variant="inverse" size="compact" icon="call" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: night.callId as string } })} />
            ) : null}
            {isAdmin ? <Button title={t('prayer.night.change')} variant="inverse" size="compact" icon="calendar-outline" onPress={open} /> : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}
