import { useState, type ReactNode } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme/tokens';

import { Text } from './Text';

export type InputVariant = 'line' | 'filled' | 'glass';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  className?: string;
  /** `line`: text on a hairline (forms on the page). `filled`: a soft field inside a white card. `glass`: a translucent field on the purple. */
  variant?: InputVariant;
  /** Something at the trailing edge, such as a show-password toggle. */
  right?: ReactNode;
};

export function Input({ label, error, className = '', variant = 'filled', right, multiline, onFocus, onBlur, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const glass = variant === 'glass';
  const edge = glass
    ? error ? 'border-rose' : focused ? 'border-surface/70' : 'border-surface/20'
    : error ? 'border-rose-deep' : focused ? 'border-primary' : 'border-border';
  const field = multiline
    ? `rounded-[10px] border bg-surface px-4 py-3 text-[16px] leading-[24px] ${edge}`
    : glass
      ? `h-[54px] rounded-[16px] border bg-surface/15 px-4 py-0 text-[16px] text-cream ${edge} ${right ? 'pr-12' : ''}`
      : variant === 'filled'
        ? `h-[52px] rounded-[10px] border bg-surface px-4 py-0 text-[16px] ${edge} ${right ? 'pr-12' : ''}`
        : `border-b bg-transparent px-0 pb-2.5 pt-2 text-[16px] ${edge}`;
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? (
        <Text variant="caption" color={glass ? (error ? 'rose' : 'creamSoft') : error ? 'roseDeep' : focused ? 'primary' : 'muted'} style={glass && error ? { color: colors.rose } : null}>
          {label}
        </Text>
      ) : null}
      <View>
        <TextInput
          placeholderTextColor={glass ? 'rgba(250, 247, 240, 0.55)' : colors.muted}
          selectionColor={glass ? colors.goldLight : colors.primary}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`min-h-[48px] font-sans ${glass ? '' : 'text-ink'} ${field}`}
          style={[multiline ? { minHeight: 96, textAlignVertical: 'top' } : { textAlignVertical: 'center' }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null, style]}
          {...rest}
        />
        {right ? <View className="absolute bottom-0 right-3 top-0 justify-center">{right}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" color={glass ? 'rose' : 'roseDeep'} style={glass ? { color: colors.rose } : null}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
