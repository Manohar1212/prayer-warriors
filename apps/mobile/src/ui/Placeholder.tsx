import { View } from 'react-native';

import { colors } from '../theme/tokens';
import { Mark } from './Mark';
import { Screen } from './Screen';
import { Text } from './Text';

export function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <Screen className="justify-center">
      <View className="items-start gap-5">
        <Mark size={40} ring={colors.border} cross={colors.muted} />
        <View className="gap-2">
          <Text variant="title">{title}</Text>
          <Text variant="muted" className="max-w-[300px] text-[15px] leading-[22px]">
            {message}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
