import { Pressable } from 'react-native';


import { Text } from './Text';

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-[8px] border px-3.5 py-2 ${selected ? 'border-primary bg-primary' : 'border-border bg-surface'}`}
    >
      <Text variant="label" color={selected ? 'goldLight' : 'ink'} className="text-[14px] leading-[18px]">
        {label}
      </Text>
    </Pressable>
  );
}
