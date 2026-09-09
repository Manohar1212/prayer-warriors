import { Pressable, View } from 'react-native';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (value: T) => void };

/** Underline tabs: quiet text with a gold rule under the active choice. */
export function Segments<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row gap-6 border-b border-border">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            hitSlop={{ top: 8, bottom: 8 }}
            className={`-mb-px border-b-2 pb-2.5 pt-1 ${active ? 'border-gold' : 'border-transparent'}`}
          >
            <Text variant="label" color={active ? 'primary' : 'muted'} className="text-[15px]">
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
