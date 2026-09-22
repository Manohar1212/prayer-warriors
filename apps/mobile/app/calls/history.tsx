import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { callTitle, useCalls } from '@/features/calls';
import { useLanguage } from '@/i18n';
import { Badge, Card, Screen, Text } from '@/ui';

function when(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CallHistoryScreen() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { past, loading } = useCalls();
  return (
    <Screen edges={['bottom']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-3 px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        {past.length === 0 ? (
          <Text variant="muted">{loading ? t('common.loading') : t('calls.history.empty')}</Text>
        ) : (
          past.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: c.id } })}>
              <Card className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Badge label={c.status === 'cancelled' ? t('calls.cancelled') : t('calls.ended')} tone={c.status === 'cancelled' ? 'blush' : 'sage'} />
                  <Text variant="muted" className="text-[13px]">
                    {when(c.scheduledAt, locale)}
                  </Text>
                </View>
                <Text variant="title" className="text-[16px]">
                  {callTitle(c.title, t)}
                </Text>
                <Text variant="muted" className="text-[13px]">
                  {c.participantCount} {t('common.joined')}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
