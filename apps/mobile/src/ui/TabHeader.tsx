import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

type Props = { title: string; subtitle?: string; right?: ReactNode };

/** Large serif title with a quiet line under it; the same shape on every tab. */
export function TabHeader({ title, subtitle, right }: Props) {
  return (
    <View className="flex-row items-end justify-between gap-3 pb-0.5 pt-1">
      <View className="flex-1 gap-0.5">
        <Text variant="display" color="primaryDark" className="text-[24px] leading-[30px]">
          {title}
        </Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      {right ? <View className="pb-1">{right}</View> : null}
    </View>
  );
}
