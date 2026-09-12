import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = TextInputProps & { label?: string; error?: string | null; className?: string };

/**
 * Single-line fields are a rule on the page: label above, text on a hairline that turns forest
 * when focused. Multi-line fields get a soft surface so their extent is visible.
 */
export function Input({ label, error, className = '', multiline, onFocus, onBlur, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const edge = error ? 'border-rose-deep' : focused ? 'border-primary' : 'border-border';
  const field = multiline
    ? `rounded-[14px] border bg-surface px-4 py-3 text-[16px] leading-[24px] ${edge}`
    : `border-b bg-transparent px-0 pb-2.5 pt-2 text-[17px] ${edge}`;
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? (
        <Text variant="caption" color={error ? 'roseDeep' : focused ? 'primary' : 'muted'}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`min-h-[44px] font-sans text-ink ${field}`}
        style={[multiline ? { minHeight: 96, textAlignVertical: 'top' } : null, style]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
