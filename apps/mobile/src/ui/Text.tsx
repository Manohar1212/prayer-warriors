import { Children, type ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, fonts } from '../theme/tokens';

export type TextVariant = 'display' | 'title' | 'scripture' | 'body' | 'label' | 'caption' | 'muted';
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
  | 'roseDeep'
  | 'leaf';

const variantClass: Record<TextVariant, string> = {
  display: 'font-display text-[26px] leading-[32px]',
  title: 'font-display-italic text-[20px] leading-[26px]',
  scripture: 'font-display-italic text-[18px] leading-[28px]',
  body: 'font-sans text-[15px] leading-[22px]',
  label: 'font-medium text-sm leading-5',
  caption: 'font-sans text-[13px] leading-[18px]',
  muted: 'font-sans text-sm leading-5',
};

const defaultColor: Record<TextVariant, TextColor> = {
  display: 'ink',
  title: 'ink',
  scripture: 'ink',
  body: 'ink',
  label: 'ink',
  caption: 'muted',
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
  leaf: colors.leaf,
};

/** Telugu faces that stand in for Playfair and Karla, which have no Telugu glyphs. */
const teluguFamily: Record<TextVariant, string> = {
  display: fonts.teluguBold,
  title: fonts.teluguBold,
  scripture: fonts.teluguSans,
  body: fonts.teluguSans,
  label: fonts.teluguSansMedium,
  caption: fonts.teluguSans,
  muted: fonts.teluguSans,
};

const TELUGU = /[ఀ-౿]/;

function containsTelugu(node: ReactNode): boolean {
  let found = false;
  Children.forEach(node, (child) => {
    if (found) return;
    if (typeof child === 'string' || typeof child === 'number') {
      if (TELUGU.test(String(child))) found = true;
    } else if (child && typeof child === 'object' && 'props' in child) {
      const inner = (child as { props?: { children?: ReactNode } }).props?.children;
      if (inner !== undefined && containsTelugu(inner)) found = true;
    }
  });
  return found;
}

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
};

/**
 * Colour is applied as an inline style so it never loses a Tailwind ordering fight. Telugu text
 * switches to the matching Noto face automatically; Telugu conjuncts also need taller lines.
 */
export function Text({ variant = 'body', color, className = '', style, children, ...rest }: TextProps) {
  const telugu = containsTelugu(children);
  return (
    <RNText
      className={`${variantClass[variant]} ${className}`}
      style={[{ color: colorValue[color ?? defaultColor[variant]] }, telugu ? { fontFamily: teluguFamily[variant] } : null, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
