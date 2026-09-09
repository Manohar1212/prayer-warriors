import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { useCalls } from '@/features/calls';
import { Badge, Card, Screen, Text } from '@/ui';

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CallHistoryScreen() {
  const router = useRouter();
  const { past, loading } = useCalls();
  return (
    <Screen edges={['bottom']} backdrop className="px-0 pt-0">
      <ScrollView contentContainerClassName="gap-3 px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        {past.length === 0 ? (
          <Text variant="muted">{loading ? 'Loading…' : 'No past calls yet.'}</Text>
        ) : (
          past.map((c) => (
            <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/calls/[id]', params: { id: c.id } })}>
              <Card className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Badge label={c.status === 'cancelled' ? 'Cancelled' : 'Ended'} tone={c.status === 'cancelled' ? 'blush' : 'sage'} />
                  <Text variant="muted" className="text-[13px]">
                    {when(c.scheduledAt)}
                  </Text>
                </View>
                <Text variant="title" className="text-[18px]">
                  {c.title}
                </Text>
                <Text variant="muted" className="text-[13px]">
                  {c.participantCount} joined
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
