import { Pressable, View } from 'react-native';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (value: T) => void; variant?: 'underline' | 'pill' };

/** Underline tabs for switching lists; a navy pill toggle for short binary choices such as language. */
export function Segments<T extends string>({ options, value, onChange, variant = 'underline' }: Props<T>) {
  if (variant === 'pill') {
    return (
      <View className="flex-row rounded-full bg-panel p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} className={`flex-1 items-center rounded-full py-2 ${active ? 'bg-primary' : ''}`}>
              <Text variant="label" color={active ? 'cream' : 'muted'} className="text-[14px]">
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  return (
    <View className="flex-row border-b border-border">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} className={`flex-1 items-center border-b-2 pb-2.5 pt-1 ${active ? 'border-primary' : 'border-transparent'}`} style={{ marginBottom: -1 }}>
            <Text variant="label" color={active ? 'primary' : 'muted'} className="text-[14px]">
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
