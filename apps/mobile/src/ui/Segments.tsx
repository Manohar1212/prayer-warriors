import { Pressable, View } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (value: T) => void };

/** Pill tabs: a lavender track with the active choice lifted on a white pill. */
export function Segments<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-full bg-lavender p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-full py-2 ${active ? 'bg-surface' : ''}`}
            style={active ? { borderWidth: 1, borderColor: colors.border } : null}
          >
            <Text variant="label" color={active ? 'primary' : 'muted'} className="text-[14px]">
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
