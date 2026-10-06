import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuth } from '@/features/auth';
import { useLanguage } from '@/i18n';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Text } from '@/ui';

import { dayLabel, midnightCard, useMidnightTonight } from './midnight';

const SKY = ['#152C49', '#232A5C', '#3A2F73'] as const;
const MOONLIGHT = '#FDF0D8';
const STARLIGHT = '#C9D3F2';

/** Faint stars scattered over the card: position as fractions of its size, radius in points, opacity. */
const STARS = [
  [0.12, 0.15, 1.2, 0.7],
  [0.35, 0.09, 1, 0.5],
  [0.55, 0.22, 1.4, 0.6],
  [0.67, 0.08, 1, 0.8],
  [0.47, 0.47, 1, 0.4],
  [0.61, 0.64, 1.3, 0.5],
  [0.88, 0.8, 1, 0.6],
  [0.21, 0.85, 1.2, 0.4],
] as const;

function Stars() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {STARS.map(([x, y, r, o]) => (
        <View
          key={`${x}-${y}`}
          style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: r * 2.4, height: r * 2.4, borderRadius: r * 1.2, backgroundColor: '#FFFFFF', opacity: o }}
        />
      ))}
    </View>
  );
}

function Moon() {
  return (
    <Svg width={60} height={60} viewBox="0 0 64 64" style={{ position: 'absolute', top: 12, right: 14 }} pointerEvents="none">
      <Circle cx={32} cy={32} r={30} fill={colors.gold} opacity={0.12} />
      <Path d="M40 16a18 18 0 1 0 8 30a15 15 0 1 1 -8 -30z" fill={MOONLIGHT} />
    </Svg>
  );
}

/** Home: who prays at 12:00 AM tonight, drawn as a small night sky; on your night, "I prayed". */
export function MidnightPrayerCard() {
  const router = useRouter();
  const { t, locale, language } = useLanguage();
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

  const when = t('midnight.when');
  const headline = card.kind === 'other' ? card.name : card.kind === 'yours' ? t('midnight.yourNight') : card.kind === 'confirm' ? t('midnight.confirmTitle') : t('midnight.prayed');
  const line = card.kind === 'other' ? t('midnight.prayingFor') : null;
  const sub = card.kind === 'other' && card.myNext ? t('midnight.next', { date: dayLabel(card.myNext, locale) }) : null;
  // Telugu has no capitals; spaced small caps only suit the English label.
  const labelStyle = language === 'te' ? undefined : { letterSpacing: 1, textTransform: 'uppercase' as const };

  return (
    <LinearGradient colors={[...SKY]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={{ borderRadius: 20, overflow: 'hidden' }}>
      <Stars />
      <Moon />
      <View style={{ padding: 20, gap: 14 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[when, headline, line, sub].filter(Boolean).join('. ')}
          onPress={() => router.push('/prayer/midnight')}
          className="gap-3.5 pr-14 active:opacity-90"
        >
          <Text variant="caption" className="text-[12px] font-semibold" style={[{ color: STARLIGHT }, labelStyle]}>
            {when}
          </Text>
          <View className="gap-0.5">
            <View className="flex-row items-center gap-2">
              {card.kind === 'prayed' ? <Ionicons name="checkmark-circle" size={22} color={colors.gold} /> : null}
              <Text variant="display" color="cream" className={card.kind === 'other' ? 'text-[24px] leading-[30px]' : 'text-[20px] leading-[26px]'}>
                {headline}
              </Text>
            </View>
            {line ? (
              <Text variant="body" style={{ color: '#DCE3F7' }}>
                {line}
              </Text>
            ) : null}
          </View>
          {sub ? (
            <Text variant="caption" style={{ color: STARLIGHT }}>
              {sub}
            </Text>
          ) : null}
        </Pressable>
        {card.kind === 'confirm' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={() => confirm(card.day)}
            className="min-h-[44px] flex-row items-center justify-center gap-2 self-start rounded-full px-[22px] active:opacity-85"
            style={{ backgroundColor: colors.gold }}
          >
            {busy ? <ActivityIndicator color={SKY[0]} /> : null}
            <Text variant="label" className="text-[15px]" style={{ color: SKY[0] }}>
              {t('midnight.confirm')}
            </Text>
          </Pressable>
        ) : null}
        {error ? (
          <Text variant="caption" style={{ color: '#FBE4EC' }}>
            {error}
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}
