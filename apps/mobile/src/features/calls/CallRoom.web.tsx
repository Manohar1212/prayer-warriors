import { View } from 'react-native';

import { Button, Text } from '../../ui';
import type { CallRoomProps } from './CallRoom.types';

export function CallRoom({ onLeave }: CallRoomProps) {
  return (
    <View className="gap-4">
      <Text variant="muted">Calls are available in the mobile app.</Text>
      <Button title="Back" variant="secondary" onPress={onLeave} />
    </View>
  );
}
