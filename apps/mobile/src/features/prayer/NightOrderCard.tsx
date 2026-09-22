import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useT } from '../../i18n';
import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';

/**
 * The steps of the all-night prayer, numbered, under the date card. Members see it once an
 * admin has set it; an admin sees a prompt to set it and an Edit link.
 */
export function NightOrderCard({ items, isAdmin }: { items: string[]; isAdmin: boolean }) {
  const router = useRouter();
  const t = useT();
  if (!items.length && !isAdmin) return null;
  const edit = () => router.push('/prayer/order');
  return (
    <Card className="gap-2.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="title" className="text-[17px]">
          {t('prayer.order.title')}
        </Text>
        {isAdmin ? (
          <Pressable accessibilityRole="button" onPress={edit} hitSlop={8}>
            <Text variant="label" color="primary" className="text-[13px]">
              {items.length ? t('prayer.order.edit') : t('prayer.order.set')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {items.length ? (
        items.map((item, i) => (
          <View key={`${i}-${item}`} className="flex-row gap-3">
            <Text variant="label" color="muted" className="w-6 text-right text-[16px] leading-[26px]">
              {i + 1}.
            </Text>
            <Text className="flex-1 text-[17px] leading-[26px]">{item}</Text>
          </View>
        ))
      ) : (
        <Text variant="caption">{t('prayer.order.empty')}</Text>
      )}
    </Card>
  );
}
