import { View } from 'react-native';

import { useT } from '../../i18n';
import { Button, Text } from '../../ui';
import type { CallRoomProps } from './CallRoom.types';

export function CallRoom({ onLeave }: CallRoomProps) {
  const t = useT();
  return (
    <View className="gap-4">
      <Text variant="muted">{t('calls.room.webOnly')}</Text>
      <Button title={t('common.back')} variant="secondary" onPress={onLeave} />
    </View>
  );
}
