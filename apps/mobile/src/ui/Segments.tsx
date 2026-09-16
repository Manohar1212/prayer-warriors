import { Pressable, View } from 'react-native';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (value: T) => void };

/** Pill tabs: a lavender track with the active choice lifted on a white pill. */
export function Segments<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-[10px] border border-border bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-[7px] py-2 ${active ? 'bg-primary' : ''}`}
          >
            <Text variant="label" color={active ? 'goldLight' : 'muted'} className="text-[15px]">
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
