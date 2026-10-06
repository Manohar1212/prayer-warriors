import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useMembers } from '@/features/members';
import { useMidnightMonth, useMidnightTonight } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { goBackOr } from '@/lib/navigation';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

/** Admin: who takes turns at the midnight prayer. */
export default function MidnightRotationScreen() {
  const { data: tonight, refresh: refreshTonight } = useMidnightTonight(midnightService);
  if (!tonight) return <Screen edges={['bottom']} className="pt-5" />;
  return <RotationForm month={tonight.today.slice(0, 7)} onSaved={refreshTonight} />;
}

function RotationForm({ month, onSaved }: { month: string; onSaved: () => Promise<unknown> | void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { members } = useMembers();
  const { data, refresh } = useMidnightMonth(midnightService, month);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const selected = chosen ?? data?.rotation.map((r) => r.userId) ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(userId: string) {
    setChosen(selected.includes(userId) ? selected.filter((id) => id !== userId) : [...selected, userId]);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await midnightService.setRotation(selected);
      await Promise.all([refresh(), onSaved()]);
      goBackOr(router, '/prayer/midnight');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('midnight.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="muted">{t('midnight.rotationIntro')}</Text>
      <Card className="gap-0 p-0">
        {members
          .filter((m) => m.status === 'active')
          .map((m, index) => {
            const on = selected.includes(m.userId);
            return (
              <Pressable key={m.userId} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(m.userId)} className={`flex-row items-center px-4 py-3.5 ${index ? 'border-t border-border' : ''}`}>
                <Text variant="label" className="flex-1 text-[15px]">
                  {m.displayName}
                </Text>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={colors.violet} />
              </Pressable>
            );
          })}
      </Card>
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      {/* Saving before the rotation has loaded would empty it. */}
      <Button title={t('common.save')} onPress={save} loading={busy} disabled={busy || !data} />
    </Screen>
  );
}
