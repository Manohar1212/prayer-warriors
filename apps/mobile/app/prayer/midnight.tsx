import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { useMembers } from '@/features/members';
import { dayLabel, useMidnightMonth, useMidnightTonight } from '@/features/prayer';
import { useLanguage } from '@/i18n';
import { midnightService } from '@/lib/parse';
import { colors } from '@/theme/tokens';
import { Button, Card, Screen, Text } from '@/ui';

/** The month's midnight prayer: who prays each night, and who has prayed. Admins can change it. */
export default function MidnightCalendarScreen() {
  const { data: tonight, error } = useMidnightTonight(midnightService);
  const [showNext, setShowNext] = useState(false);
  if (!tonight) {
    return (
      <Screen edges={['bottom']} className="pt-5">
        {error ? (
          <Text variant="caption" color="roseDeep">
            {error}
          </Text>
        ) : null}
      </Screen>
    );
  }
  const thisMonth = tonight.today.slice(0, 7);
  return <MonthList key={showNext ? 'next' : 'this'} thisMonth={thisMonth} today={tonight.today} showNext={showNext} onShowNext={setShowNext} />;
}

function MonthList({ thisMonth, today, showNext, onShowNext }: { thisMonth: string; today: string; showNext: boolean; onShowNext: (next: boolean) => void }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useMembers();
  const { data: current, error } = useMidnightMonth(midnightService, thisMonth);
  const nextMonth = current?.nextMonth ?? null;

  return (
    <Screen edges={['bottom']} scroll className="gap-4 pt-5">
      <Text variant="muted">{t('midnight.intro')}</Text>
      {nextMonth ? (
        <View className="flex-row gap-2">
          <Button title={t('midnight.thisMonth')} size="compact" variant={showNext ? 'secondary' : undefined} className="flex-1" onPress={() => onShowNext(false)} />
          <Button title={t('midnight.nextMonth')} size="compact" variant={showNext ? undefined : 'secondary'} className="flex-1" onPress={() => onShowNext(true)} />
        </View>
      ) : null}
      {isAdmin ? <Button title={t('midnight.rotation')} variant="secondary" onPress={() => router.push('/prayer/midnight-rotation')} /> : null}
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
      {showNext && nextMonth ? (
        <Nights month={nextMonth} today={today} me={user?.id ?? null} isAdmin={isAdmin} locale={locale} />
      ) : current ? (
        <NightRows nights={current.nights} today={today} me={user?.id ?? null} isAdmin={isAdmin} locale={locale} />
      ) : null}
    </Screen>
  );
}

/** The next month, loaded only once the server has said it can be opened. */
function Nights({ month, ...rest }: { month: string; today: string; me: string | null; isAdmin: boolean; locale: string }) {
  const { data } = useMidnightMonth(midnightService, month);
  return data ? <NightRows nights={data.nights} {...rest} /> : null;
}

function NightRows({ nights, today, me, isAdmin, locale }: { nights: { day: string; userId: string; name: string; prayed: boolean }[]; today: string; me: string | null; isAdmin: boolean; locale: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  if (!nights.length) return <Text variant="muted">{t('midnight.empty')}</Text>;
  return (
    <Card className="gap-0 p-0">
      {nights.map((night, index) => {
        const isTonight = night.day === today;
        const editable = isAdmin && night.day >= today;
        return (
          <Pressable
            key={night.day}
            disabled={!editable}
            accessibilityRole={editable ? 'button' : undefined}
            onPress={() => router.push({ pathname: '/prayer/midnight-assign', params: { day: night.day } })}
            className={`flex-row items-center gap-3 px-4 py-3 ${index ? 'border-t border-border' : ''} ${isTonight ? 'bg-lavender' : ''}`}
          >
            <Text variant="caption" className="w-28">
              {isTonight ? t('midnight.tonight') : dayLabel(night.day, locale)}
            </Text>
            <Text variant="label" className={`flex-1 text-[15px] ${night.userId === me ? 'text-primary' : ''}`} numberOfLines={1}>
              {night.name}
            </Text>
            {night.prayed ? <Ionicons name="checkmark-circle" size={20} color={colors.leaf} /> : null}
            {editable ? <Ionicons name="chevron-forward" size={16} color={colors.violet} /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}
