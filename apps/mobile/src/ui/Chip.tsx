import { Pressable } from 'react-native';

import { cardShadow } from '../theme/tokens';

import { Text } from './Text';

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full px-3.5 py-2 ${selected ? 'bg-primary' : 'bg-surface'}`}
      style={selected ? null : cardShadow}
    >
      <Text variant="label" color={selected ? 'cream' : 'ink'} className="text-[13px] leading-[16px]">
        {label}
      </Text>
    </Pressable>
  );
}
