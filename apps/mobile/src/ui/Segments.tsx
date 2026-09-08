import { Pressable, View } from 'react-native';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (value: T) => void };

export function Segments<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-full border border-border bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-full py-2 ${active ? 'bg-primary' : ''}`}
          >
            <Text variant="label" color={active ? 'cream' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
