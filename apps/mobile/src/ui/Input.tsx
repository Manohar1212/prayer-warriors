import { useState, type ReactNode } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

export type InputVariant = 'line' | 'filled';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  className?: string;
  /** `line`: text on a hairline (forms on the page). `filled`: a soft field (forms inside a white card). */
  variant?: InputVariant;
  /** Something at the trailing edge, such as a show-password toggle. */
  right?: ReactNode;
};

export function Input({ label, error, className = '', variant = 'line', right, multiline, onFocus, onBlur, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const edge = error ? 'border-rose-deep' : focused ? 'border-primary' : variant === 'filled' ? 'border-transparent' : 'border-border';
  const field = multiline
    ? `rounded-[14px] border bg-surface px-4 py-3 text-[16px] leading-[24px] ${edge}`
    : variant === 'filled'
      ? `rounded-[14px] border bg-cream px-4 py-3 text-[16px] ${edge} ${right ? 'pr-12' : ''}`
      : `border-b bg-transparent px-0 pb-2.5 pt-2 text-[17px] ${edge}`;
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? (
        <Text variant="caption" color={error ? 'roseDeep' : focused ? 'primary' : 'muted'}>
          {label}
        </Text>
      ) : null}
      <View>
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
          className={`min-h-[48px] font-sans text-ink ${field}`}
          style={[multiline ? { minHeight: 96, textAlignVertical: 'top' } : null, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null, style]}
          {...rest}
        />
        {right ? <View className="absolute bottom-0 right-3 top-0 justify-center">{right}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" color="roseDeep">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
