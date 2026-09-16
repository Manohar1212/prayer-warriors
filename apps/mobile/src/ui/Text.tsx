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
  | 'goldLight'
  | 'violet'
  | 'skyDeep'
  | 'rose'
  | 'roseDeep'
  | 'leaf';

/** Each variant's face, size and line height, kept apart so a caller's own size can replace the variant's. */
const variantParts: Record<TextVariant, { font: string; size: string; leading: string }> = {
  display: { font: 'font-display', size: 'text-[24px]', leading: 'leading-[30px]' },
  title: { font: 'font-display', size: 'text-[18px]', leading: 'leading-[24px]' },
  scripture: { font: 'font-display-italic', size: 'text-[17px]', leading: 'leading-[26px]' },
  body: { font: 'font-sans', size: 'text-[15px]', leading: 'leading-[22px]' },
  label: { font: 'font-medium', size: 'text-[14px]', leading: 'leading-[20px]' },
  caption: { font: 'font-sans', size: 'text-[13px]', leading: 'leading-[18px]' },
  muted: { font: 'font-sans', size: 'text-[14px]', leading: 'leading-[20px]' },
};

const SIZE_CLASS = /(^|\s)text-(\[\d+px\]|xs|sm|base|lg|xl|\dxl)(\s|$)/;
const LEADING_CLASS = /(^|\s)leading-/;

/**
 * Two arbitrary Tailwind sizes on one element resolve by stylesheet order, not class order, so a
 * caller's `text-[12px]` could lose to the variant's `text-[14px]`. Dropping the variant's size
 * whenever the caller sets one makes overrides reliable on web and native alike.
 */
function variantClassFor(variant: TextVariant, className: string): string {
  const v = variantParts[variant];
  return [v.font, SIZE_CLASS.test(className) ? '' : v.size, LEADING_CLASS.test(className) ? '' : v.leading].filter(Boolean).join(' ');
}

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
  goldLight: colors.goldLight,
  violet: colors.violet,
  skyDeep: colors.skyDeep,
  rose: colors.roseDeep,
  roseDeep: colors.roseDeep,
  leaf: colors.leaf,
};

/** Telugu faces that stand in for Inter, which has no Telugu glyphs. */
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
      className={`${variantClassFor(variant, className)} ${className}`}
      style={[{ color: colorValue[color ?? defaultColor[variant]] }, telugu ? { fontFamily: teluguFamily[variant] } : null, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
