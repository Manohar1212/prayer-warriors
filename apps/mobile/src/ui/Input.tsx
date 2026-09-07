import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = TextInputProps & { label?: string; error?: string | null; className?: string };

export function Input({ label, error, className = '', onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const border = error ? 'border-rose' : focused ? 'border-primary' : 'border-border';
  return (
    <View className={`gap-2 ${className}`}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`min-h-[52px] rounded-xl border bg-surface px-4 py-3 font-sans text-[16px] text-ink ${border}`}
        {...rest}
      />
      {error ? (
        <Text variant="muted" color="rose">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
