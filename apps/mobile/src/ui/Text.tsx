import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors } from '../theme/tokens';

export type TextVariant = 'display' | 'title' | 'scripture' | 'body' | 'label' | 'muted';
export type TextColor =
  | 'ink'
  | 'muted'
  | 'primary'
  | 'primaryDark'
  | 'cream'
  | 'creamSoft'
  | 'creamFaint'
  | 'gold'
  | 'rose'
  | 'roseDeep';

const variantClass: Record<TextVariant, string> = {
  display: 'font-display text-[34px] leading-[40px]',
  title: 'font-display text-[22px] leading-[28px]',
  scripture: 'font-display-italic text-[20px] leading-[30px]',
  body: 'font-sans text-base leading-6',
  label: 'font-medium text-sm leading-5',
  muted: 'font-sans text-sm leading-5',
};

const defaultColor: Record<TextVariant, TextColor> = {
  display: 'ink',
  title: 'ink',
  scripture: 'ink',
  body: 'ink',
  label: 'ink',
  muted: 'muted',
};

const colorValue: Record<TextColor, string> = {
  ink: colors.ink,
  muted: colors.muted,
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  cream: colors.cream,
  creamSoft: 'rgba(250, 247, 240, 0.78)',
  creamFaint: 'rgba(250, 247, 240, 0.55)',
  gold: colors.gold,
  rose: colors.roseDeep,
  roseDeep: colors.roseDeep,
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
};

/** Color is applied as an inline style so it never loses a Tailwind ordering fight. */
export function Text({ variant = 'body', color, className = '', style, ...rest }: TextProps) {
  return (
    <RNText
      className={`${variantClass[variant]} ${className}`}
      style={[{ color: colorValue[color ?? defaultColor[variant]] }, style]}
      {...rest}
    />
  );
}
