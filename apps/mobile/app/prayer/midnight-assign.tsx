import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useMembers } from '@/features/members';
import { dayLabel, useMidnightMonth } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Card, Screen, Text } from '@/ui';

/** Admin: choose who prays on one night. */
export default function MidnightAssignScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { day } = useLocalSearchParams<{ day: string }>();
  const { members } = useMembers();
  const { refresh } = useMidnightMonth(midnightService, (day ?? '').slice(0, 7));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(userId: string) {
    if (!day || busy) return;
    setBusy(true);
    setError(null);
    try {
      await midnightService.reassign(day, userId);
      await refresh();
      goBackOr(router, '/prayer/midnight');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="label">{day ? dayLabel(day, locale) : ''}</Text>
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      <Card className="gap-0 p-0">
        {members
          .filter((m) => m.status === 'active')
          .map((m, index) => (
            <Pressable key={m.userId} accessibilityRole="button" onPress={() => pick(m.userId)} className={`flex-row items-center px-4 py-3.5 ${index ? 'border-t border-border' : ''}`}>
              <Text variant="label" className="flex-1 text-[15px]">
                {m.displayName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.violet} />
            </Pressable>
          ))}
      </Card>
    </Screen>
  );
}
